import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) setUserData(null);
    });
    return () => unsubscribe();
  }, []);

  // User data listener
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          setUserData(data);
        } else {
          setUserData(null);
          if (location.pathname !== "/signup") {
            navigate("/login");
          }
        }
      },
      (err) => {
        console.error("Snapshot error:", err);
        toast.error("Failed to fetch user data");
        setUserData(null);
      }
    );
    return () => unsubscribe();
  }, [user, location.pathname, navigate]);

  const signupWithEmail = async (name, email, password, phoneNumber) => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      // Update display name
      await updateProfile(newUser, { displayName: name });

      // Create user document with 30-day free trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      const userDocRef = doc(db, "users", newUser.uid);
      const userDocData = {
        name,
        email,
        phoneNumber,
        createdAt: serverTimestamp(),
        subscription: {
          status: "trial", // "trial" | "active" | "pending" | "expired"
          plan: "Free Trial",
          trialEndDate: trialEndDate.toISOString(),
          trialStartDate: new Date().toISOString(),
          activationDate: null,
          expiryDate: null,
        },
      };

      await setDoc(userDocRef, userDocData);

      // Wait for document to be created
      await new Promise((resolve) => {
        const checkDoc = async () => {
          if ((await getDoc(userDocRef)).exists()) resolve();
          else setTimeout(checkDoc, 500);
        };
        checkDoc();
      });

      setUserData({ id: userDocRef.id, ...userDocData });
      setUser(newUser);
      toast.success("Account created! You have 30 days free trial.");
      navigate("/dashboard");
      return newUser;
    } catch (err) {
      // Clean up if signup fails
      if (auth.currentUser) {
        await signOut(auth);
      }
      throw new Error(err.message || "Signup failed");
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const loggedInUser = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("Account not found");
      }

      setUser(loggedInUser);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
      return loggedInUser;
    } catch (err) {
      throw new Error(err.message || "Login failed");
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      return "Password reset email sent.";
    } catch (err) {
      throw new Error(err.message || "Password reset failed");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (err) {
      throw new Error(err.message || "Logout failed");
    }
  };

  // Check if user has access to create receipts/invoices/records
  const hasAccessToCreate = () => {
    if (!userData || !userData.subscription) return false;

    const status = userData.subscription.status;

    if (status === "active") return true;

    if (status === "trial") {
      const trialEnd = new Date(userData.subscription.trialEndDate);
      return new Date() <= trialEnd;
    }

    return false;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        loginWithEmail,
        signupWithEmail,
        sendPasswordReset,
        logout,
        loading,
        hasAccessToCreate,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

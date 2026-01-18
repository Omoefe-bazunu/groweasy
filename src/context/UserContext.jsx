import { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Use a ref to track the active unsubscribe function
  const unsubscribeRef = useRef(null);

  // 1. Auth State Listener
  useEffect(() => {
    const authUnsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      // If user logs out, clean up everything immediately
      if (!currentUser) {
        if (unsubscribeRef.current) {
          unsubscribeRef.current(); // Stop Firestore listener
          unsubscribeRef.current = null;
        }
        setUserData(null);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  // 2. User Data Listener (Real-time Profile Sync)
  useEffect(() => {
    // Stop any existing listener if the user changed
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);

    // Set up the listener and store the unsubscribe function in the ref
    unsubscribeRef.current = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setUserData(null);
        }
        setLoading(false);
      },
      (err) => {
        // Handle common permission errors during logout transitions
        if (err.code === "permission-denied") {
          console.warn("User data access denied (likely logged out).");
        } else {
          console.error("Firestore Snapshot Error:", err);
        }
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user]);

  // --- ACTIONS ---

  const signupWithEmail = async (name, email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: name });
      return newUser;
    } catch (err) {
      throw new Error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      toast.success("Logged in successfully!");
      navigate("/dashboard");
      return userCredential.user;
    } catch (err) {
      throw new Error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // 1. Manually stop the listener before calling signOut
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      // 2. Clear state
      setUserData(null);
      setUser(null);
      // 3. Sign out of Firebase
      await signOut(auth);
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (err) {
      throw new Error(err.message || "Logout failed");
    }
  };

  const hasAccessToCreate = () => {
    if (!userData || !userData.subscription) return false;
    const status = userData.subscription.status;
    return status === "active";
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        loginWithEmail,
        signupWithEmail,
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

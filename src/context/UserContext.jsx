import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Auth State Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. User Data Listener (Real-time Profile Sync)
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setUserData(data);
        } else {
          // Doc doesn't exist yet (Backend might be creating it)
          setUserData(null);

          // Only redirect to login if we aren't currently signing up
          // This prevents kicking the user out while the backend creates the profile
          if (location.pathname !== "/signup") {
            // navigate("/login"); // Optional: careful with this in production loops
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("Snapshot error:", err);
        // Don't toast error here to avoid spamming the user on connection blips
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, location.pathname]);

  // --- ACTIONS ---

  /**
   * PURE AUTHENTICATION ONLY
   * The actual database profile creation is handled by the SignUp component calling the Backend API.
   */
  const signupWithEmail = async (name, email, password) => {
    setLoading(true);
    try {
      // 1. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      // 2. Update Display Name immediately
      await updateProfile(newUser, { displayName: name });

      // 3. Return user so component can get Token and call Backend
      return newUser;
    } catch (err) {
      console.error("Auth Error:", err);
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

      // We don't need to manually fetch doc here, the useEffect listener will kick in
      toast.success("Logged in successfully!");
      navigate("/dashboard");
      return userCredential.user;
    } catch (err) {
      console.error("Login Error:", err);
      throw new Error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
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

  // Legacy check - Prefer using SubscriptionContext for this logic now
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

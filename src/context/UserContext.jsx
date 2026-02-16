// src/context/UserContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../lib/api";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Flag to skip /me fetch when signup is in progress
  // Signup handles its own navigation — we don't want onAuthStateChanged
  // racing against the backend profile creation
  const isSigningUp = useRef(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // ✅ Skip if signup is in progress — SignUp.jsx handles everything
        if (isSigningUp.current) {
          setLoading(false);
          return;
        }

        // Normal login or page refresh — profile already exists, safe to fetch
        try {
          const res = await api.get("/auth/me");
          setUserData(res.data);
        } catch (err) {
          console.error("Failed to restore user session:", err.message);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signupWithEmail = async (name, email, password) => {
    // ✅ Raise the flag BEFORE Firebase creates the user
    // This prevents onAuthStateChanged from calling /api/auth/me too early
    isSigningUp.current = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: name });
      return newUser;
    } catch (err) {
      isSigningUp.current = false; // Reset on failure
      throw new Error(err.message || "Signup failed");
    }
    // ✅ Do NOT reset here — SignUp.jsx resets it after backend call completes
  };

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const res = await api.get("/auth/me");
      setUserData(res.data);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
      return userCredential.user;
    } catch (err) {
      if (err.code?.startsWith("auth/")) {
        throw new Error("Invalid email or password");
      }
      throw new Error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUserData(null);
      setUser(null);
      await signOut(auth);
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (err) {
      throw new Error(err.message || "Logout failed");
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(err.message || "Failed to send reset email");
    }
  };

  const hasAccessToCreate = () => {
    if (!userData?.subscription) return false;
    return userData.subscription.status === "active";
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get("/auth/me");
      setUserData(res.data);
    } catch (err) {
      console.error("Failed to refresh user data:", err.message);
    }
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
        sendPasswordReset,
        refreshUserData,
        isSigningUp,
        setUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

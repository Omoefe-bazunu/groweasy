"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase"; // ✅ Ensure db is exported from your firebase config
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // ✅ Added for real-time speed
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/lib/api";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(() => {
    // 🚀 Instant Hydration from Cache
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("groweasy_user_cache");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isSigningUpRef = useRef(false);
  const isLoggingInRef = useRef(false);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // ✅ Clear existing snapshot listener if auth state changes
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        // 🚀 THE SPEED OPTIMIZATION: Real-time Firestore Listener
        // This bypasses the /auth/me API call entirely for faster data loading
        const userDocRef = doc(db, "users", currentUser.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() };
              setUserData(data);

              // Async localStorage write for next session
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  "groweasy_user_cache",
                  JSON.stringify(data),
                );
              }
            }
            setLoading(false);
          },
          (err) => {
            console.error("Firestore stream error:", err);
            setLoading(false);
          },
        );
      } else {
        setUserData(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("groweasy_user_cache");
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signupWithEmail = async (name, email, password) => {
    isSigningUpRef.current = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(userCredential.user, { displayName: name });

      // ✅ We don't need to manually fetch /me here anymore.
      // The onSnapshot in our useEffect will see the new user document instantly.
      return userCredential.user;
    } catch (err) {
      isSigningUpRef.current = false;
      throw new Error(err.message || "Signup failed");
    }
  };

  const loginWithEmail = async (email, password) => {
    isLoggingInRef.current = true;
    setLoading(true);

    try {
      // 🚀 STEP 1: Firebase Auth (Fastest part)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 🚀 STEP 2: Navigate IMMEDIATELY
      // Because onSnapshot is already listening, userData will fill in automatically
      router.push("/dashboard");

      requestAnimationFrame(() => {
        toast.success("Welcome back!", { autoClose: 2000 });
      });

      return userCredential.user;
    } catch (err) {
      const msg = err.code?.startsWith("auth/")
        ? "Invalid credentials"
        : "Login failed";
      throw new Error(msg);
    } finally {
      setLoading(false);
      isLoggingInRef.current = false;
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("groweasy_user_cache");
      }
      setUserData(null);
      setUser(null);
      await signOut(auth);
      router.push("/auth/login");

      requestAnimationFrame(() => {
        toast.success("Signed out successfully", { autoClose: 2000 });
      });
    } catch (err) {
      console.error("Logout Error:", err);
      throw new Error("Logout failed");
    }
  };

  const refreshUserData = async () => {
    // Note: With onSnapshot active, you rarely need this,
    // but we keep it to manually force a sync if needed.
    try {
      const res = await api.get("/auth/me");
      setUserData(res.data);
      localStorage.setItem("groweasy_user_cache", JSON.stringify(res.data));
    } catch (err) {
      console.error("Refresh failed:", err.message);
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
        refreshUserData,
        setUserData,
        isSigningUpRef,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

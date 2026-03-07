"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/lib/api";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // ✅ Renamed with "Ref" suffix to satisfy React Compiler's strict mutation rules
  const isSigningUpRef = useRef(false);
  const isLoggingInRef = useRef(false);

  // 1. Initial hydration for localStorage (Next.js SSR safety)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("groweasy_user_cache");
      if (saved) {
        try {
          setUserData(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse user cache");
        }
      }
    }
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // ✅ Check renamed Refs
        if (isSigningUpRef.current || isLoggingInRef.current) {
          setLoading(false);
          return;
        }

        try {
          const res = await api.get("/auth/me");
          setUserData(res.data);
          localStorage.setItem("groweasy_user_cache", JSON.stringify(res.data));
        } catch (err) {
          console.error("Session restoration failed:", err.message);
          if (err.response?.status === 401) {
            setUserData(null);
            localStorage.removeItem("groweasy_user_cache");
          }
        }
      } else {
        setUserData(null);
        localStorage.removeItem("groweasy_user_cache");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signupWithEmail = async (name, email, password) => {
    isSigningUpRef.current = true; // ✅ Safe mutation
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(userCredential.user, { displayName: name });
      return userCredential.user;
    } catch (err) {
      isSigningUpRef.current = false;
      throw new Error(err.message || "Signup failed");
    }
  };

  const loginWithEmail = async (email, password) => {
    isLoggingInRef.current = true; // ✅ Safe mutation
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Fetch data immediately
      const res = await api.get("/auth/me");
      setUserData(res.data);
      localStorage.setItem("groweasy_user_cache", JSON.stringify(res.data));

      toast.success("Welcome back!");
      router.push("/dashboard");
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

  // const logout = async () => {
  //   try {
  //     setUserData(null);
  //     setUser(null);
  //     localStorage.removeItem("groweasy_user_cache");
  //     await signOut(auth);
  //     router.push("/auth/login"); // Updated path
  //     toast.success("Signed out");
  //   } catch (err) {
  //     throw new Error("Logout failed");
  //   }
  // };

  const logout = async () => {
    try {
      // 1. Clear local cache immediately
      localStorage.removeItem("groweasy_user_cache");

      // 2. Set user states to null FIRST
      // This triggers a re-render in components using the user,
      // often triggering their useEffect cleanup functions.
      setUserData(null);
      setUser(null);

      // 3. Perform the Firebase SignOut
      await signOut(auth);

      // 4. Redirect
      router.push("/auth/login");
      toast.success("Signed out successfully");
    } catch (err) {
      console.error("Logout Error:", err);
      throw new Error("Logout failed");
    }
  };

  const refreshUserData = async () => {
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
        isSigningUpRef, // Pass the Ref for use in SignUp page
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

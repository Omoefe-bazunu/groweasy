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
  const isSigningUpRef = useRef(false);
  const isLoggingInRef = useRef(false);

  // 🚀 OPTIMIZATION 1: Async localStorage hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use requestIdleCallback for non-blocking read
      const loadCache = () => {
        const saved = localStorage.getItem("groweasy_user_cache");
        if (saved) {
          try {
            setUserData(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse user cache");
          }
        }
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(loadCache);
      } else {
        setTimeout(loadCache, 0);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        if (isSigningUpRef.current || isLoggingInRef.current) {
          setLoading(false);
          return;
        }

        try {
          const res = await api.get("/auth/me");
          setUserData(res.data);

          // 🚀 OPTIMIZATION 2: Async localStorage write
          if ("requestIdleCallback" in window) {
            requestIdleCallback(() => {
              localStorage.setItem(
                "groweasy_user_cache",
                JSON.stringify(res.data),
              );
            });
          } else {
            setTimeout(() => {
              localStorage.setItem(
                "groweasy_user_cache",
                JSON.stringify(res.data),
              );
            }, 0);
          }
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
    isSigningUpRef.current = true;
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
    isLoggingInRef.current = true;
    setLoading(true);

    try {
      // 🚀 STEP 1: Firebase auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 🚀 STEP 2: Navigate IMMEDIATELY (don't wait for API)
      router.push("/dashboard");

      // 🚀 STEP 3: Fetch data in background (non-blocking)
      api
        .get("/auth/me")
        .then((res) => {
          setUserData(res.data);
          // Async localStorage write
          if ("requestIdleCallback" in window) {
            requestIdleCallback(() => {
              localStorage.setItem(
                "groweasy_user_cache",
                JSON.stringify(res.data),
              );
            });
          } else {
            setTimeout(() => {
              localStorage.setItem(
                "groweasy_user_cache",
                JSON.stringify(res.data),
              );
            }, 0);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user data:", err);
        });

      // 🚀 STEP 4: Show toast AFTER navigation starts (non-blocking)
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
      localStorage.removeItem("groweasy_user_cache");
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
    try {
      const res = await api.get("/auth/me");
      setUserData(res.data);

      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          localStorage.setItem("groweasy_user_cache", JSON.stringify(res.data));
        });
      } else {
        setTimeout(() => {
          localStorage.setItem("groweasy_user_cache", JSON.stringify(res.data));
        }, 0);
      }
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

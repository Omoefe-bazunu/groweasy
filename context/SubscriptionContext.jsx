"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useUser } from "./UserContext";
import api from "@/lib/api";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  // ✅ 1. Pull 'loading' (the auth status) from UserContext
  const { userData, loading: authLoading } = useUser();

  const [subscription, setSubscription] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ 2. ONLY fetch if auth is finished loading AND we have a user
    // If auth is still loading, we stay in a waiting state.
    if (authLoading) return;

    if (!userData) {
      setSubscription(null);
      setIsPaid(false);
      setDaysRemaining(0);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        // Now that authLoading is false, Firebase auth.currentUser is guaranteed
        // to be available for the interceptor in @/lib/api.js
        const res = await api.get("/subscription/status");
        setSubscription(res.data.subscription);
        setIsPaid(res.data.isPaid);
        setDaysRemaining(res.data.daysRemaining);
      } catch (err) {
        console.error("Failed to fetch subscription:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // ✅ 3. Add authLoading to the dependency array
  }, [userData, authLoading]);

  // --- Derived Values ---
  const planType = useMemo(
    () => subscription?.planType || "monthly",
    [subscription],
  );

  const planLabel = useMemo(() => {
    if (isPaid) return subscription?.plan || "Pro";
    return subscription?.status === "trial" ? "Free Trial" : "Free Plan";
  }, [isPaid, subscription]);

  const subscriptionStatus = useMemo(
    () => subscription?.status || null,
    [subscription],
  );

  // --- Async Helpers ---
  const canWriteTo = async (collectionName) => {
    if (!userData) return false;
    try {
      const res = await api.get(`/subscription/can-write/${collectionName}`);
      return res.data.canWrite;
    } catch {
      return false;
    }
  };

  const getLimitStatus = async (collectionName) => {
    if (!userData) return { reached: true, current: 0, limit: 10 };
    try {
      const res = await api.get(`/subscription/can-write/${collectionName}`);
      return res.data;
    } catch {
      return { reached: true, current: 0, limit: 10 };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isPaid,
        daysRemaining,
        planType,
        planLabel,
        subscriptionStatus,
        canWriteTo,
        getLimitStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};

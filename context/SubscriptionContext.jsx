"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useUser } from "./UserContext";
import api from "@/lib/api";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { userData, loading: authLoading } = useUser();

  const [subscription, setSubscription] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ 1. Re-usable fetch function for initial load and manual refreshes
  const fetchStatus = useCallback(async () => {
    if (!userData) return;

    setLoading(true);
    try {
      const res = await api.get("/subscription/status");
      setSubscription(res.data.subscription);
      setIsPaid(res.data.isPaid);
      setDaysRemaining(res.data.daysRemaining);
    } catch (err) {
      console.error("Failed to fetch subscription:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  // ✅ 2. Handle Auth State Changes
  useEffect(() => {
    let isMounted = true;

    if (authLoading) return;

    if (!userData) {
      setSubscription(null);
      setIsPaid(false);
      setDaysRemaining(0);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      await fetchStatus();
    };

    if (isMounted) loadData();

    return () => {
      isMounted = false;
    };
  }, [userData, authLoading, fetchStatus]);

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

  // --- Memoized Async Helpers ---
  // useCallback is vital here so child components can use these in useEffect
  const canWriteTo = useCallback(
    async (collectionName) => {
      if (!userData) return false;
      try {
        const res = await api.get(`/subscription/can-write/${collectionName}`);
        return res.data.canWrite;
      } catch {
        return false;
      }
    },
    [userData],
  );

  const getLimitStatus = useCallback(
    async (collectionName) => {
      if (!userData) return { reached: true, current: 0, limit: 10 };
      try {
        const res = await api.get(`/subscription/can-write/${collectionName}`);
        return res.data;
      } catch {
        return { reached: true, current: 0, limit: 10 };
      }
    },
    [userData],
  );

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
        refreshSubscription: fetchStatus, // ✅ Exposed for post-payment updates
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

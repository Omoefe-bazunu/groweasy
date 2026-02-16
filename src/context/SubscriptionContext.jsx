// src/context/SubscriptionContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";
import api from "../lib/api";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  // ✅ Watch userData, not user — userData is only set after the
  // Firestore profile exists, preventing race condition 404s
  const { userData } = useUser();

  const [subscription, setSubscription] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) {
      setSubscription(null);
      setIsPaid(false);
      setDaysRemaining(0);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
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
    };

    fetchStatus();
  }, [userData]);

  // ── Derived values ────────────────────────────────────────────────────────
  // planType: "yearly" | "monthly"
  const planType = subscription?.planType || "monthly";

  // planLabel: human-readable plan name for display
  const planLabel = isPaid
    ? subscription?.plan || "Pro"
    : subscription?.status === "trial"
      ? "Free Trial"
      : "Free Plan";

  // subscriptionStatus: "active" | "trial" | "expired" | null
  const subscriptionStatus = subscription?.status || null;

  // ── Async helpers (call these before any write operation) ─────────────────

  // Returns true if user is allowed to create a new document in this collection
  const canWriteTo = async (collectionName) => {
    if (!userData) return false;
    try {
      const res = await api.get(`/subscription/can-write/${collectionName}`);
      return res.data.canWrite;
    } catch {
      return false;
    }
  };

  // Returns full limit info for UI messages
  // { canWrite, reached, current, limit } or { canWrite, unlimited }
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
        subscription, // raw subscription object from backend
        loading, // true while fetching on mount
        isPaid, // boolean — true only when status === "active"
        daysRemaining, // number of days until subscription expires
        planType, // "yearly" | "monthly"
        planLabel, // "Free Trial" | "Free Plan" | "Monthly" | "Yearly"
        subscriptionStatus, // "active" | "trial" | "expired" | null
        canWriteTo, // async (collectionName) => boolean
        getLimitStatus, // async (collectionName) => { reached, current, limit }
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);

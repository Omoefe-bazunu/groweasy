// src/context/SubscriptionContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Document limits per collection (free tier)
  const FREE_LIMIT = 10;

  // Updated list of collections to track
  const COLLECTIONS = [
    "receipts",
    "invoices",
    "financialRecords",
    "quotations", // Added
    "inventory", // Added
    "payrolls",
    "customers", // Added
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Listen to user's subscription doc
      const subRef = doc(db, "subscriptions", currentUser.uid);
      const unsubscribeSub = onSnapshot(subRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isActive =
            data.status === "active" &&
            new Date(data.expiresAt.seconds * 1000) > new Date();
          setSubscription(isActive ? data : null);
        } else {
          setSubscription(null);
        }
        setLoading(false);
      });

      return () => unsubscribeSub();
    });

    return () => unsubscribeAuth();
  }, []);

  // Count documents in a collection for current user
  const getDocumentCount = async (collectionName) => {
    if (!user) return 0;
    const colRef = collection(db, collectionName);
    const q = query(colRef, where("userId", "==", user.uid));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  };

  // Check if user can write to a collection
  const canWriteTo = async (collectionName) => {
    if (!user) return false;
    if (subscription) return true; // Paid = unlimited

    const count = await getDocumentCount(collectionName);
    return count < FREE_LIMIT;
  };

  // Get limit status (for UI messages)
  const getLimitStatus = async (collectionName) => {
    if (!user) return { reached: true, current: 0, limit: FREE_LIMIT };
    if (subscription) return { reached: false, unlimited: true };

    const count = await getDocumentCount(collectionName);
    return { reached: count >= FREE_LIMIT, current: count, limit: FREE_LIMIT };
  };

  return (
    <SubscriptionContext.Provider
      value={{
        user,
        subscription,
        loading,
        isPaid: !!subscription,
        canWriteTo,
        getLimitStatus,
        collections: COLLECTIONS,
        subscriptionType: subscription?.type || "free", // monthly | yearly
        daysRemaining: subscription
          ? Math.ceil(
              (new Date(subscription.expiresAt.seconds * 1000) - new Date()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);

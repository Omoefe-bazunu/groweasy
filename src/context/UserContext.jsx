import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null);
      if (!currentUser) {
        setUserData(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to user data when authenticated
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          setUserData({ id: doc.id, ...doc.data() });
        } else {
          setUserData(null);
        }
      },
      (err) => {
        console.error("Error in snapshot listener:", err);
        setError("Failed to fetch user data: " + err.message);
        setUserData(null);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user]);

  const signupWithEmail = async (
    name,
    email,
    password,
    phoneNumber,
    referrerId = null
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;

      await sendEmailVerification(newUser);
      await updateProfile(newUser, { displayName: name });

      const userDocRef = doc(db, "users", newUser.uid);
      const userDocData = {
        name,
        email,
        phoneNumber,
        referredBy: referrerId,
        earnings: 0,
        downlineEarnings: 0,
        createdAt: serverTimestamp(),
        subscription: {
          plan: "Free",
          status: "active",
          startDate: serverTimestamp(),
          contentPlans: 0,
          contentStrategies: 0,
          blogPosts: 0,
          imageGenerations: 0,
          month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        },
      };

      await setDoc(userDocRef, userDocData);

      // Update referrer's downline if applicable
      if (referrerId) {
        const referrerRef = doc(db, "users", referrerId);
        await updateDoc(referrerRef, {
          referrals: increment(1),
        });
      }

      // Wait for document creation
      await new Promise((resolve) => {
        const checkDoc = async () => {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) resolve();
          else setTimeout(checkDoc, 500);
        };
        checkDoc();
      });

      setUserData({ id: userDocRef.id, ...userDocData });
      setUser(newUser);
      return newUser;
    } catch (err) {
      throw new Error("Failed to sign up: " + err.message);
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const loggedInUser = userCredential.user;

      if (!loggedInUser.emailVerified) {
        await signOut(auth);
        throw new Error(
          "Please verify your email before logging in. Check your inbox for a verification link."
        );
      }

      // Check if we need to reset monthly usage counters
      const currentMonth = new Date().toISOString().slice(0, 7);
      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));

      if (
        userDoc.exists() &&
        userDoc.data().subscription.month !== currentMonth
      ) {
        await updateDoc(doc(db, "users", loggedInUser.uid), {
          "subscription.contentPlans": 0,
          "subscription.contentStrategies": 0,
          "subscription.blogPosts": 0,
          "subscription.imageGenerations": 0,
          "subscription.month": currentMonth,
        });
      }

      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const incrementUsage = async (type) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        [`subscription.${type}`]: increment(1),
      });
    } catch (err) {
      console.error("Failed to increment usage counter:", err);
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return "Password reset email sent. Check your inbox.";
    } catch (err) {
      throw new Error("Failed to send password reset email: " + err.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setError(null);
    } catch (err) {
      throw new Error("Failed to log out: " + err.message);
    }
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
        incrementUsage,
        loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

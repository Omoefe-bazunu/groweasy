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

  // Listen to user data only when user is authenticated
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

  // const signupWithEmail = async (name, email, password, phoneNumber) => {
  //   try {
  //     const userCredential = await createUserWithEmailAndPassword(
  //       auth,
  //       email,
  //       password
  //     );
  //     const newUser = userCredential.user;

  //     // Send email verification
  //     await sendEmailVerification(newUser);

  //     // Update the user's display name
  //     await updateProfile(newUser, { displayName: name });

  //     // Create a user document in Firestore
  //     const userDocRef = doc(db, "users", newUser.uid);
  //     const userDocData = {
  //       name,
  //       email,
  //       phoneNumber,
  //       createdAt: new Date().toISOString(),
  //       subscription: {
  //         plan: "Free",
  //         status: "active",
  //         startDate: serverTimestamp(),
  //         imageAttempts: 0,
  //         contentPlanAttempts: 0,
  //         videoAttempts: 0,
  //       },
  //     };
  //     await setDoc(userDocRef, userDocData);

  //     // Wait for the document to be created before proceeding
  //     await new Promise((resolve, reject) => {
  //       const checkDoc = async () => {
  //         const docSnap = await getDoc(userDocRef);
  //         if (docSnap.exists()) {
  //           resolve();
  //         } else {
  //           setTimeout(checkDoc, 500); // Retry after 500ms
  //         }
  //       };
  //       checkDoc().catch(reject);
  //     });

  //     // Manually set userData to avoid waiting for the snapshot listener
  //     setUserData({ id: userDocRef.id, ...userDocData });
  //     setUser(newUser);
  //     return newUser;
  //   } catch (err) {
  //     throw new Error("Failed to sign up: " + err.message);
  //   }
  // };

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
        referredBy: referrerId, // 👈 Add referrerId here
        earnings: 0,
        downlineEarnings: 0,
        createdAt: new Date().toISOString(),
        subscription: {
          plan: "Free",
          status: "active",
          startDate: serverTimestamp(),
          imageAttempts: 0,
          contentPlanAttempts: 0,
          videoAttempts: 0,
        },
      };

      await setDoc(userDocRef, userDocData);

      await new Promise((resolve, reject) => {
        const checkDoc = async () => {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            resolve();
          } else {
            setTimeout(checkDoc, 500);
          }
        };
        checkDoc().catch(reject);
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

      // Check if email is verified
      if (!loggedInUser.emailVerified) {
        await signOut(auth);
        throw new Error(
          "Please verify your email before logging in. Check your inbox for a verification link."
        );
      }

      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      throw new Error(err.message);
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

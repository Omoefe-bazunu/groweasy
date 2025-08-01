import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { sendAdminNotification } from "../lib/emailjs";

export default function Subscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocal, setShowLocal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setSubscription(userDoc.data().subscription);
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setScreenshot(file);
      setError("");
    } else {
      setError("Please upload a JPEG or PNG image.");
      setScreenshot(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError("Please select a plan.");
      return;
    }
    if (!screenshot) {
      setError("Please upload a payment screenshot.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const screenshotRef = ref(
        storage,
        `screenshots/${user.uid}/${Date.now()}_${screenshot.name}`
      );
      await uploadBytes(screenshotRef, screenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      const requestData = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        plan: selectedPlan,
        screenshotUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "subscriptionRequests"), requestData);

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        subscription: {
          ...subscription,
          status: "pending",
        },
      });

      try {
        await sendAdminNotification(
          requestData.userName,
          requestData.userEmail,
          requestData.plan,
          requestData.screenshotUrl
        );
      } catch (notificationError) {
        console.error("Admin notification failed:", notificationError);
        setError(
          "Subscription request submitted, but failed to notify admin: " +
            notificationError.message
        );
      }

      setSuccess(
        "Subscription request submitted! Pending admin approval within 20 minutes."
      );
      setScreenshot(null);
      setSelectedPlan("");
    } catch (err) {
      setError("Failed to submit subscription request: " + err.message);
      console.error("Subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !subscription) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col max-w-2xl h-[calc(100vh-12rem)] overflow-y-auto mx-auto px-6 pt-10 pb-25 space-y-8">
      <h1 className="text-3xl font-bold text-center text-[#5247bf]">
        Subscription Plans
      </h1>

      {error && (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      )}
      {success && (
        <div className="text-center">
          <p className="text-green-500 mb-4">{success}</p>
        </div>
      )}

      {subscription.status === "pending" ? (
        <div className="text-center text-gray-700">
          <p>Your subscription request is pending admin approval.</p>
          <p>Your plan will be upgraded within 20 minutes.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-xl shadow-md bg-white h-72">
              <h2 className="text-xl font-semibold text-[#5247bf] mb-2">
                Free
              </h2>
              <p className="text-gray-600 mb-4 flex-grow">
                5 Images, <br />5 content plans, <br />5 blog posts, <br />5
                content strategies
              </p>
              <p className="text-gray-800 font-bold">Free</p>
              <p className="text-gray-500 mt-2">Current Plan</p>
            </div>
            <div className="p-6 border flex flex-col rounded-xl shadow-md bg-white h-72">
              <h2 className="text-xl font-semibold text-[#5247bf] mb-2">
                Growth
              </h2>
              <p className="text-gray-600 mb-4 flex-grow text-nowrap">
                30 images, <br />
                20 content plans, <br />
                10 blog posts, <br />
                10 content strategies
              </p>
              <p className="text-gray-800 font-bold">NGN2,999/month</p>
              <button
                onClick={() => setSelectedPlan("Growth")}
                className={`mt-4 w-full py-2 rounded-xl text-white ${
                  selectedPlan === "Growth" ? "bg-[#5247bf]" : "bg-gray-400"
                }`}
              >
                Select
              </button>
            </div>
            <div className="p-6 border flex flex-col rounded-xl shadow-md bg-white h-72">
              <h2 className="text-xl font-semibold text-[#5247bf] mb-2">
                Enterprise
              </h2>
              <p className="text-gray-600 mb-4 flex-grow text-nowrap">
                50 images, <br />
                50 content plans, <br />
                30 blog posts, <br />
                30 content strategies
              </p>
              <p className="text-gray-800 font-bold">NGN7,999/month</p>
              <button
                onClick={() => setSelectedPlan("Enterprise")}
                className={`mt-4 w-full py-2 rounded-xl text-white ${
                  selectedPlan === "Enterprise" ? "bg-[#5247bf]" : "bg-gray-400"
                }`}
              >
                Select
              </button>
            </div>
          </div>

          {selectedPlan && (
            <div className="bg-white p-6 rounded-xl shadow-md space-y-6 mt-8">
              <h2 className="font-semibold text-gray-800 mb-4">
                Payment Options for {selectedPlan} Plan
              </h2>

              <div>
                <button
                  type="button"
                  onClick={() => setShowLocal(!showLocal)}
                  className="w-full text-left py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-gray-700 transition-all duration-200 mb-2"
                >
                  {showLocal ? "Hide" : "Show"} Account Details (Nigeria Only)
                </button>
                {showLocal && (
                  <div className="p-4 border rounded-xl text-gray-700 space-y-2">
                    <p>Bank: Kuda Microfinance Bank</p>
                    <p>Account Number: 3002638291</p>
                    <p>Account Name: HIGH-ER ENTERPRISES</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="text-gray-700 font-medium block mb-1">
                    Upload Payment Screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="w-full p-3 border rounded-xl text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-white bg-[#5247bf] hover:bg-[#4238a6] transition-all duration-200 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Payment"}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

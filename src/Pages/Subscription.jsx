"use client";
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

// 🚀 Import Resend
import { Resend } from "resend";

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export default function Subscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [monthsToSubscribe, setMonthsToSubscribe] = useState(1);
  const [screenshot, setScreenshot] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocal, setShowLocal] = useState(false);

  const MONTHLY_PRICE = 3000; // ₦3,000 per month

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

  // 📧 Function to send admin notification with Resend
  const sendAdminNotification = async (data) => {
    try {
      await resend.emails.send({
        from: "Subscription Alert <info@higher.com.ng>",
        to: "info@higher.com.ng", // change to your admin email
        subject: "New Subscription Request Pending Approval",
        html: `
          <h2>New Subscription Request</h2>
          <p><strong>User:</strong> ${data.userName}</p>
          <p><strong>Email:</strong> ${data.userEmail}</p>
          <p><strong>Plan:</strong> ${data.plan}</p>
          <p><strong>Months:</strong> ${data.months}</p>
          <p><strong>Total Amount:</strong> ₦${data.totalAmount.toLocaleString()}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Payment Proof:</strong> <a href="${data.screenshotUrl}" target="_blank">View Screenshot</a></p>
          <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
        `,
      });
      console.log("✅ Admin email sent successfully!");
    } catch (error) {
      console.error("❌ Failed to send admin email:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlan || monthsToSubscribe < 1) {
      setError("Please select a plan and number of months.");
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

      const totalAmount = MONTHLY_PRICE * monthsToSubscribe;

      const requestData = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        plan: selectedPlan,
        months: monthsToSubscribe,
        totalAmount: totalAmount,
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
          requestedMonths: monthsToSubscribe,
        },
      });

      // Send notification to admin via Resend
      await sendAdminNotification(requestData);

      setSuccess(
        `Subscription request submitted for ₦${totalAmount.toLocaleString()}! Pending admin approval within 20 minutes.`
      );
      setScreenshot(null);
      setSelectedPlan("");
      setMonthsToSubscribe(1);
    } catch (err) {
      setError("Failed to submit subscription request: " + err.message);
      console.error("Subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !subscription) return <div>Loading...</div>;

  const isTrialActive = subscription.status === "trial";
  const isSubscribed = subscription.status === "active";
  const trialEndDate = subscription.trialEndDate
    ? new Date(subscription.trialEndDate).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen flex flex-col max-w-2xl h-[calc(100vh-12rem)] overflow-y-auto mx-auto px-6 pt-10 pb-25 space-y-8">
      <h1 className="text-3xl font-bold text-center text-blue-600">
        Subscription Plans
      </h1>

      {error && <p className="text-center text-red-500">{error}</p>}
      {success && <p className="text-center text-green-500">{success}</p>}

      {isSubscribed ? (
        <div className="text-center bg-green-50 p-6 rounded-xl">
          <p className="font-semibold text-lg">✓ Premium Subscriber</p>
          <p>Full access to Receipts, Invoices & Financial Records.</p>
        </div>
      ) : isTrialActive ? (
        <div className="text-center bg-blue-50 p-6 rounded-xl">
          <p className="font-semibold text-lg">Free Trial Active</p>
          <p>
            Ends on: <strong>{trialEndDate}</strong>
          </p>
        </div>
      ) : subscription.status === "pending" ? (
        <div className="text-center bg-yellow-50 p-6 rounded-xl">
          <p>Your subscription request is pending admin approval.</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Premium Plan
            </h2>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>✓ Create & manage receipts</li>
              <li>✓ Manage invoices</li>
              <li>✓ Track financial records</li>
              <li>✓ Download PDF reports</li>
            </ul>
            <p className="text-3xl font-bold text-blue-600 mb-4">
              ₦3,000/month
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="font-semibold text-gray-800">Subscribe Now</h2>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Months
            </label>
            <input
              type="number"
              min="1"
              value={monthsToSubscribe}
              onChange={(e) =>
                setMonthsToSubscribe(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-600 mt-2">
              Total: ₦{(MONTHLY_PRICE * monthsToSubscribe).toLocaleString()}
            </p>

            <button
              type="button"
              onClick={() => setShowLocal(!showLocal)}
              className="w-full text-left py-3 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium text-gray-700 transition-all"
            >
              {showLocal ? "Hide" : "Show"} Bank Details (Nigeria)
            </button>

            {showLocal && (
              <div className="p-4 border border-gray-300 rounded-lg text-gray-700 space-y-2 mt-2">
                <p>
                  <strong>Bank:</strong> Kuda Microfinance Bank
                </p>
                <p>
                  <strong>Account Number:</strong> 3002638291
                </p>
                <p>
                  <strong>Account Name:</strong> HIGH-ER ENTERPRISES
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="text-gray-700 font-medium block mb-1">
                Upload Payment Screenshot *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:bg-gray-400 font-medium"
                disabled={loading || !screenshot}
              >
                {loading ? "Submitting..." : "Submit Payment"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

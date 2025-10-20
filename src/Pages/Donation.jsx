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
import { Resend } from "resend";

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export default function Donation() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocal, setShowLocal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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

  const sendAdminNotification = async (data) => {
    try {
      await resend.emails.send({
        from: "Donation Alert <info@higher.com.ng>",
        to: "info@higher.com.ng",
        subject: "New Donation Request Pending Approval",
        html: `
          <h2>New Donation Request</h2>
          <p><strong>User:</strong> ${data.userName}</p>
          <p><strong>Email:</strong> ${data.userEmail}</p>
          <p><strong>Amount:</strong> ₦${data.amount.toLocaleString()}</p>
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

    if (!donationAmount || donationAmount < 1) {
      setError("Please enter a valid donation amount.");
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
        amount: parseFloat(donationAmount),
        screenshotUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "donations"), requestData);

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        donation: {
          status: "pending",
          amount: parseFloat(donationAmount),
        },
      });

      await sendAdminNotification(requestData);

      setSuccess(
        `Donation request submitted for ₦${parseFloat(donationAmount).toLocaleString()}! Pending admin approval within 20 minutes.`
      );
      setScreenshot(null);
      setDonationAmount("");
      setShowModal(false);
    } catch (err) {
      setError("Failed to submit donation request: " + err.message);
      console.error("Donation error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col max-w-2xl h-[calc(100vh-12rem)] overflow-y-auto mx-auto px-6 pt-10 pb-25 space-y-8">
      <h1 className="text-3xl font-bold text-center text-[#5247bf]">
        Support Us
      </h1>

      {error && <p className="text-center text-red-500">{error}</p>}
      {success && <p className="text-center text-green-500">{success}</p>}

      <div className="bg-white p-6 rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Support Our Mission
        </h2>
        <p className="text-gray-700 mb-6">
          Your little support helps to keep this platform free for all business
          owners.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 rounded-lg text-white bg-[#5247bf] hover:bg-blue-900 transition-all font-medium"
        >
          Donate Now
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black text-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gray-900">
              Support Our Effort
            </h2>
            <p className="text-gray-700">
              Your donation helps keep our website free for all business owners
              by covering hosting, updates, and maintenance costs to ensure a
              smooth experience.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Amount (₦)
            </label>
            <input
              type="number"
              min="1"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />

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

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-white bg-[#5247bf] hover:bg-blue-900 transition-all disabled:bg-gray-400 font-medium"
                  disabled={loading || !screenshot || !donationAmount}
                >
                  {loading ? "Submitting..." : "Submit Donation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

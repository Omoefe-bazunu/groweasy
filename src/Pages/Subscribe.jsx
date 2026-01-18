import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { storage, db } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { Check, Copy, Upload, Loader2, AlertCircle } from "lucide-react";

const Subscribe = () => {
  const { user, userData } = useUser();
  const { isPaid } = useSubscription();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [plan, setPlan] = useState("monthly");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // State for dynamic pricing
  const [monthlyFee, setMonthlyFee] = useState(3000); // Default fallback
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState("");

  const bankDetails = {
    bankName: "Kuda MicroFinance Bank",
    accountName: "HIGH-ER ENTERPRISES",
    accountNumber: "3002638291",
  };

  // Fetch Pricing on Mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        console.log("🔍 Fetching pricing from Firestore...");

        // Try to get settings document
        const settingsRef = doc(db, "admin", "settings");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          console.log("📦 Settings data:", data);

          // Check for the fee in different possible field names
          const fee =
            data.monthlySubscriptionFee ||
            data.subscriptionFee ||
            data.monthlyFee ||
            data.price;

          if (fee && !isNaN(Number(fee))) {
            const feeNumber = Number(fee);
            console.log("✅ Pricing loaded:", feeNumber);
            setMonthlyFee(feeNumber);
            setPriceError("");
          } else {
            console.warn("⚠️ Fee field exists but is invalid:", fee);
            setPriceError("Using default pricing (₦3,000)");
          }
        } else {
          console.warn("⚠️ Settings document does not exist at admin/settings");
          setPriceError("Using default pricing (₦3,000)");
        }
      } catch (error) {
        console.error("❌ Error fetching pricing:", error);
        setPriceError("Using default pricing (₦3,000)");
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, []);

  // Calculate fees dynamically based on fetched state
  const plans = {
    monthly: {
      name: "Monthly",
      amount: monthlyFee.toLocaleString(),
      rawAmount: monthlyFee,
      duration: "30 days",
    },
    yearly: {
      name: "Yearly",
      amount: (monthlyFee * 12).toLocaleString(),
      rawAmount: monthlyFee * 12,
      duration: "365 days",
      bestValue: true,
    },
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type.startsWith("image/") &&
        selectedFile.size < 5 * 1024 * 1024
      ) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please upload an image under 5MB");
        setFile(null);
      }
    }
  };

  const handleSubmitPayment = async () => {
    if (!file) {
      setError("Please upload your payment screenshot");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      const fileRef = ref(
        storage,
        `payment-proofs/${user.uid}_${Date.now()}_${file.name}`
      );
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "pendingPayments"), {
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.name || "User",
        plan: plan,
        amount: plans[plan].rawAmount, // Save raw number for backend processing
        amountDisplay: plans[plan].amount, // Human-readable version
        paymentScreenshot: downloadURL,
        requestedAt: serverTimestamp(),
        status: "pending",
      });

      setSuccess(true);
      setFile(null);
      const input = document.getElementById("file-upload");
      if (input) input.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Please log in to subscribe</p>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto text-gray-700 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Already Subscribed!
          </h1>
          <p className="text-gray-600">
            Enjoy unlimited access to all features.
          </p>
        </div>
      </div>
    );
  }

  if (loadingPrice) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading pricing information...</p>
      </section>
    );
  }

  return (
    <div className="min-h-screen text-gray-700 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pb-25 pt-6 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Price Error Alert */}
        {priceError && (
          <div className="mb-6 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                {priceError}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Contact support if this seems incorrect.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-12 max-w-2xl mx-auto bg-orange-500 p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-lg text-white">
            Unlock unlimited receipts, invoices, inventory, customer list, &
            financial records
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
          {Object.entries(plans).map(([key, p]) => (
            <div
              key={key}
              onClick={() => setPlan(key)}
              className={`relative bg-white rounded-2xl shadow-lg p-8 border-4 transition-all cursor-pointer ${
                plan === key
                  ? "border-[#5247bf] shadow-2xl scale-105"
                  : "border-gray-200 hover:border-[#5247bf]/50"
              }`}
            >
              {p.bestValue && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  BEST VALUE
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{p.name}</h3>
                {plan === key && (
                  <div className="w-8 h-8 bg-[#5247bf] rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-[#5247bf]">
                  ₦{p.amount}
                </span>
                <span className="text-gray-600">
                  {" "}
                  /{key === "monthly" ? "month" : "year"}
                </span>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  Unlimited Receipts & Invoices
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  Unlimited Inventory Items
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  Unlimited Payrolls & Records
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  Unlimited Customer Lists
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  Priority Support
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Complete Your {plans[plan].name} Subscription
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Bank Name:</span>
                <div className="flex items-center gap-2">
                  <span>{bankDetails.bankName}</span>
                  <button onClick={() => copyToClipboard(bankDetails.bankName)}>
                    <Copy className="w-4 h-4 text-gray-500 hover:text-[#5247bf]" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Account Name:</span>
                <div className="flex items-center gap-2">
                  <span>{bankDetails.accountName}</span>
                  <button
                    onClick={() => copyToClipboard(bankDetails.accountName)}
                  >
                    <Copy className="w-4 h-4 text-gray-500 hover:text-[#5247bf]" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl">
                    {bankDetails.accountNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(bankDetails.accountNumber)}
                  >
                    <Copy className="w-4 h-4 text-gray-500 hover:text-[#5247bf]" />
                  </button>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-bold text-[#5247bf]">
                  Amount to Pay: ₦{plans[plan].amount}
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-4">
                Upload Payment Screenshot
              </p>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#5247bf] file:text-white hover:file:bg-[#4238a6] cursor-pointer"
              />
              {file && (
                <p className="mt-3 text-sm text-green-600">
                  Selected: {file.name}
                </p>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <button
              onClick={handleSubmitPayment}
              disabled={uploading || !file}
              className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-semibold hover:bg-[#4238a6] disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Payment Proof"
              )}
            </button>

            {success && (
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                <Check className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="text-green-800 font-medium">
                  Submitted successfully!
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Your {plans[plan].name} Pro access will be activated soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {copied && (
          <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <Check className="w-5 h-5" /> Copied!
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscribe;

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
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Check,
  Copy,
  Upload,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  Globe,
} from "lucide-react";

const USD_MARKUP = 1.5; // Foreign users pay +50%

const Subscribe = () => {
  const { user, userData } = useUser();
  const { isPaid } = useSubscription();

  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [plan, setPlan] = useState("monthly");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);

  const paymentMethods = [
    {
      country: "Nigeria (NGN)",
      details: [
        { label: "Bank Name", value: "Kuda MicroFinance Bank" },
        { label: "Account Name", value: "HIGH-ER ENTERPRISES" },
        { label: "Account Number", value: "3002638291" },
      ],
    },
    {
      country: "International (USD)",
      details: [
        { label: "Bank Name", value: "Lead Bank" },
        { label: "Account Name", value: "Omoefe Bazunu" },
        { label: "Account Number", value: "217577556883" },
        { label: "Account Type", value: "Checking" },
        { label: "Wire Routing", value: "101019644" },
        { label: "ACH Routing", value: "101019644" },
      ],
    },
  ];

  const [pendingPayment, setPendingPayment] = useState(null);
  const [checkingPending, setCheckingPending] = useState(true);
  const [monthlyFee, setMonthlyFee] = useState(3000);
  const [exchangeRate, setExchangeRate] = useState(1550); // fallback ₦/$ rate
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState("");

  // Check for existing pending payment
  useEffect(() => {
    if (!user) {
      setCheckingPending(false);
      return;
    }
    const checkPending = async () => {
      try {
        const q = query(
          collection(db, "pendingPayments"),
          where("userId", "==", user.uid),
          where("status", "==", "pending"),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          setPendingPayment({ id: d.id, ...d.data() });
        }
      } catch (err) {
        console.error("Failed to check pending payment:", err);
      } finally {
        setCheckingPending(false);
      }
    };
    checkPending();
  }, [user]);

  // Fetch subscription fee AND exchange rate from admin settings
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const settingsRef = doc(db, "admin", "settings");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();

          // Subscription fee
          const fee =
            data.monthlySubscriptionFee ||
            data.subscriptionFee ||
            data.monthlyFee ||
            data.price;
          if (fee && !isNaN(Number(fee))) {
            setMonthlyFee(Number(fee));
          } else {
            setPriceError("Using default pricing (₦3,000)");
          }

          // Exchange rate — store as e.g. exchangeRate: 1600 in admin settings
          const rate = data.exchangeRate || data.usdRate || data.dollarRate;
          if (rate && !isNaN(Number(rate))) {
            setExchangeRate(Number(rate));
          }
          // No error if rate is missing — fallback is silent
        } else {
          setPriceError("Using default pricing (₦3,000)");
        }
      } catch {
        setPriceError("Using default pricing (₦3,000)");
      } finally {
        setLoadingPrice(false);
      }
    };
    fetchPricing();
  }, []);

  // USD = (NGN / exchangeRate) * 1.5  →  +50% markup for international users
  const toUsd = (naira) => ((naira / exchangeRate) * USD_MARKUP).toFixed(2);

  const plans = {
    monthly: {
      name: "Monthly",
      amount: monthlyFee.toLocaleString(),
      usdAmount: toUsd(monthlyFee),
      rawAmount: monthlyFee,
      duration: "30 days",
    },
    yearly: {
      name: "Yearly",
      amount: (monthlyFee * 12).toLocaleString(),
      usdAmount: toUsd(monthlyFee * 12),
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
        `payment-proofs/${user.uid}_${Date.now()}_${file.name}`,
      );
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = await addDoc(collection(db, "pendingPayments"), {
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.name || "User",
        plan,
        amount: plans[plan].rawAmount,
        amountDisplay: plans[plan].amount,
        paymentScreenshot: downloadURL,
        requestedAt: serverTimestamp(),
        status: "pending",
      });

      setPendingPayment({
        id: docRef.id,
        plan,
        amount: plans[plan].rawAmount,
        amountDisplay: plans[plan].amount,
        paymentScreenshot: downloadURL,
        status: "pending",
        requestedAt: new Date(),
      });

      setSuccess(true);
      setFile(null);
      const input = document.getElementById("file-upload");
      if (input) input.value = "";
    } catch {
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

  if (checkingPending || loadingPrice) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <Loader2 className="w-8 h-8 text-[#5247bf] animate-spin mb-4" />
        <p className="text-gray-600">Loading...</p>
      </section>
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

  if (pendingPayment) {
    const submittedAt = pendingPayment.requestedAt?.toDate
      ? pendingPayment.requestedAt.toDate()
      : pendingPayment.requestedAt instanceof Date
        ? pendingPayment.requestedAt
        : new Date(pendingPayment.requestedAt);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-lg w-full">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Under Review
          </h1>
          <p className="text-gray-500 mb-8">
            Your payment proof has been submitted and is being reviewed by our
            team. This usually takes a few hours.
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Plan</span>
              <span className="font-bold text-gray-900 capitalize">
                {pendingPayment.plan} Pro
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Amount</span>
              <span className="font-bold text-[#5247bf]">
                ₦{(pendingPayment.amount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">
                Submitted
              </span>
              <span className="text-sm text-gray-700">
                {submittedAt.toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                at{" "}
                {submittedAt.toLocaleTimeString("en-NG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto transition"
          >
            <RefreshCw className="w-4 h-4" /> Already approved? Refresh to check
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-700 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pb-25 pt-6 px-6">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Upgrade to Pro
          </h1>
          <p className="text-lg text-white opacity-90">
            Unlock unlimited documents and premium features
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
          {Object.entries(plans).map(([key, p]) => (
            <div
              key={key}
              onClick={() => setPlan(key)}
              className={`relative bg-white rounded-2xl shadow-lg p-8 border-4 transition-all cursor-pointer ${
                plan === key
                  ? "border-[#5247bf] scale-105"
                  : "border-gray-200 hover:border-[#5247bf]/50"
              }`}
            >
              {p.bestValue && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  BEST VALUE
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{p.name}</h3>
                {plan === key && <Check className="w-6 h-6 text-[#5247bf]" />}
              </div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-[#5247bf]">
                  ₦{p.amount}
                </div>
                <div className="text-sm text-gray-500 font-medium mt-1">
                  Approx.{" "}
                  <span className="text-orange-600">${p.usdAmount} USD</span>
                  <span className="ml-1 text-xs text-gray-400">
                    (intl. rate)
                  </span>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "Unlimited Receipts & Invoices",
                  "Unlimited Inventory Items",
                  "Full Financial Records",
                  "Priority Support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Payment Details
          </h2>
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">
                Select Payment Method
              </label>
              <div className="relative">
                <select
                  value={selectedBankIndex}
                  onChange={(e) => setSelectedBankIndex(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold text-gray-800 appearance-none focus:ring-2 focus:ring-[#5247bf] outline-none"
                >
                  {paymentMethods.map((method, idx) => (
                    <option key={idx} value={idx}>
                      {method.country}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-[#5247bf]">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {paymentMethods[selectedBankIndex].country} Details
                </span>
              </div>
              {paymentMethods[selectedBankIndex].details.map(
                ({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center mb-4 last:mb-0 border-b border-gray-200/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-gray-500">
                      {label}:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm md:text-base">
                        {value}
                      </span>
                      <button
                        onClick={() => copyToClipboard(value)}
                        className="p-1 hover:bg-[#5247bf]/10 rounded transition"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#5247bf]" />
                      </button>
                    </div>
                  </div>
                ),
              )}

              <div className="mt-6 p-4 bg-[#5247bf] rounded-xl text-center">
                <p className="text-white text-xs font-medium uppercase mb-1">
                  Pay Exactly
                </p>
                {selectedBankIndex === 0 ? (
                  <p className="text-white font-black text-xl">
                    ₦{plans[plan].amount}
                  </p>
                ) : (
                  <div>
                    <p className="text-white font-black text-xl">
                      ${plans[plan].usdAmount} USD
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      International rate · includes processing markup
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-700 mb-4">
                Upload Proof of Payment
              </p>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#5247bf] file:text-white hover:file:bg-[#4238a6] cursor-pointer"
              />
              {file && (
                <p className="mt-3 text-xs text-green-600 font-bold">
                  ✓ {file.name}
                </p>
              )}
              {error && (
                <p className="mt-3 text-xs text-red-500 font-bold">{error}</p>
              )}
            </div>

            <button
              onClick={handleSubmitPayment}
              disabled={uploading || !file}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black disabled:bg-gray-300 transition flex items-center justify-center gap-3 shadow-lg"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Submit Payment for Approval"
              )}
            </button>
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce z-50">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold">Details Copied!</span>
        </div>
      )}
    </div>
  );
};

export default Subscribe;

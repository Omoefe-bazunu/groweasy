"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { storage, db } from "@/lib/firebase";
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
  Clock,
  RefreshCw,
  ChevronDown,
  Globe,
} from "lucide-react";
import api from "@/lib/api";

const USD_MARKUP = 1.5;

const Subscribe = () => {
  const router = useRouter();
  const { user, userData } = useUser();
  const { isPaid } = useSubscription();

  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [plan, setPlan] = useState("monthly");
  const [error, setError] = useState("");
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);

  const [pendingPayment, setPendingPayment] = useState(null);
  const [checkingPending, setCheckingPending] = useState(true);
  const [monthlyFee, setMonthlyFee] = useState(3000);
  const [exchangeRate, setExchangeRate] = useState(1550);
  const [loadingPrice, setLoadingPrice] = useState(true);

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
      ],
    },
  ];

  // 1. Fetch Admin Pricing & Exchange Rates
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "admin", "settings"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          const fee =
            data.monthlySubscriptionFee || data.monthlyFee || data.price;
          if (fee) setMonthlyFee(Number(fee));
          const rate = data.exchangeRate || data.usdRate;
          if (rate) setExchangeRate(Number(rate));
        }
      } catch (err) {
        console.warn("Using default pricing due to fetch error.");
      } finally {
        setLoadingPrice(false);
      }
    };
    fetchPricing();
  }, []);

  // 2. Check for existing pending requests
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
      } finally {
        setCheckingPending(false);
      }
    };
    checkPending();
  }, [user]);

  // 3. Derived Pricing Logic (useMemo for efficiency)
  const plans = useMemo(() => {
    const toUsd = (naira) => ((naira / exchangeRate) * USD_MARKUP).toFixed(2);
    return {
      monthly: {
        name: "Monthly",
        amount: monthlyFee.toLocaleString(),
        usdAmount: toUsd(monthlyFee),
        rawAmount: monthlyFee,
      },
      yearly: {
        name: "Yearly",
        amount: (monthlyFee * 12).toLocaleString(),
        usdAmount: toUsd(monthlyFee * 12),
        rawAmount: monthlyFee * 12,
        bestValue: true,
      },
    };
  }, [monthlyFee, exchangeRate]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size < 5 * 1024 * 1024) {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please upload an image under 5MB");
    }
  };

  const handleSubmitPayment = async () => {
    if (!file) return setError("Upload your payment screenshot first");
    setUploading(true);
    try {
      const fileRef = ref(storage, `payment-proofs/${user.uid}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      const displayAmount =
        selectedBankIndex === 0
          ? `₦${plans[plan].amount}`
          : `$${plans[plan].usdAmount} USD`;

      const paymentData = {
        userId: user.uid,
        userEmail: user.email,
        userName: userData?.name || "User",
        plan,
        amountDisplay: displayAmount,
        paymentScreenshot: downloadURL,
        requestedAt: serverTimestamp(),
        status: "pending",
      };

      const docRef = await addDoc(
        collection(db, "pendingPayments"),
        paymentData,
      );

      // Notify Backend
      await api.post("/subscription/notify-payment", {
        ...paymentData,
        requestedAt: new Date().toISOString(), // Serialized date for API
      });

      setPendingPayment({
        ...paymentData,
        id: docRef.id,
        requestedAt: new Date(),
      });
      toast.success("Payment proof submitted!");
    } catch (err) {
      setError("Submission failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loadingPrice || checkingPending)
    return (
      <div className="h-screen flex items-center justify-center font-black animate-pulse">
        Initializing...
      </div>
    );
  if (isPaid)
    return (
      <div className="h-screen flex items-center justify-center text-green-600 font-black text-3xl">
        PRO ACTIVE ✓
      </div>
    );

  if (pendingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-700">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 text-center max-w-lg border border-gray-100">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">
            Under Review
          </h1>
          <p className="text-gray-500 font-medium mb-8">
            We are verifying your proof. This usually takes a few hours.
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between font-bold">
              <span>Plan</span>
              <span className="uppercase">{pendingPayment.plan} Pro</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Amount</span>
              <span className="text-[#5247bf]">
                {pendingPayment.amountDisplay}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-xs font-black text-[#5247bf] mx-auto uppercase tracking-widest"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-700 pb-24 pt-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-orange-500 rounded-[2.5rem] p-10 text-center text-white shadow-xl mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
            Upgrade to Pro
          </h1>
          <p className="font-bold opacity-90">
            Unlock unlimited documents and premium business tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {Object.entries(plans).map(([key, p]) => (
            <div
              key={key}
              onClick={() => setPlan(key)}
              className={`relative bg-white rounded-3xl p-8 border-4 transition-all cursor-pointer ${plan === key ? "border-[#5247bf] scale-105 shadow-2xl" : "border-gray-100 opacity-60 hover:opacity-100"}`}
            >
              {p.bestValue && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black">
                  BEST VALUE
                </span>
              )}
              <h3 className="text-2xl font-black uppercase mb-4">{p.name}</h3>
              <div className="text-4xl font-black text-[#5247bf] mb-2">
                ₦{p.amount}
              </div>
              <p className="text-xs font-bold text-orange-600 uppercase mb-6">
                ${p.usdAmount} USD approx.
              </p>
              <ul className="space-y-3 text-[10px] font-black uppercase text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Unlimited
                  Documents
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Priority Support
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl p-10 border border-gray-100 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-8">
            Payment Details
          </h2>
          <div className="space-y-6">
            <div className="relative">
              <select
                value={selectedBankIndex}
                onChange={(e) => setSelectedBankIndex(Number(e.target.value))}
                className="w-full bg-gray-50 border-none p-5 rounded-2xl font-black text-gray-800 appearance-none focus:ring-2 focus:ring-[#5247bf] outline-none"
              >
                {paymentMethods.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m.country}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              {paymentMethods[selectedBankIndex].details.map((d) => (
                <div
                  key={d.label}
                  className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase">
                    {d.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">{d.value}</span>
                    <button onClick={() => copyToClipboard(d.value)}>
                      <Copy className="w-4 h-4 text-[#5247bf]" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-4 bg-[#5247bf] rounded-xl text-center text-white">
                <p className="text-[10px] font-black uppercase opacity-70">
                  Pay Exactly
                </p>
                <p className="text-xl font-black">
                  {selectedBankIndex === 0
                    ? `₦${plans[plan].amount}`
                    : `$${plans[plan].usdAmount} USD`}
                </p>
              </div>
            </div>

            <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-8 text-center bg-gray-50 relative">
              <Upload className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="text-xs font-black uppercase text-gray-400 mb-4">
                Upload Proof of Payment
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {file && (
                <p className="text-xs text-green-600 font-black">
                  ✓ {file.name}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-500 font-black">{error}</p>
              )}
            </div>

            <button
              onClick={handleSubmitPayment}
              disabled={uploading || !file}
              className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:bg-gray-200"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                "Submit Proof for Approval"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;

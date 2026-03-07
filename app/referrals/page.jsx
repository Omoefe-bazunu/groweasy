"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import api from "@/lib/api";
import { doc, updateDoc } from "firebase/firestore";
import {
  Copy,
  CheckCircle,
  Share2,
  Users,
  Loader2,
  History,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import BacktoTools from "@/components/Shared/BacktoTools";

const ReferralDashboard = () => {
  const router = useRouter();
  const { user, userData } = useUser();

  // Dashboard States
  const [generating, setGenerating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralList, setReferralList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [origin, setOrigin] = useState(""); // SSR Fix

  // Form States
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  // SSR Fix: Capture window origin on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicLink = `${origin}/signup?ref=${userData?.referralCode}`;

  useEffect(() => {
    if (!user) {
      setLoadingList(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get("/referral/dashboard");
        setReferralList(res.data.referrals);
        setWithdrawalHistory(res.data.withdrawals);
      } catch (err) {
        console.error("Fetch Error:", err.message);
      } finally {
        setLoadingList(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    if (withdrawing) return;

    const amountNum = Number(withdrawAmount);
    if (amountNum < 500) return toast.warn("Minimum withdrawal is ₦500");

    setWithdrawing(true);
    try {
      const res = await api.post("/referral/request-withdrawal", {
        amount: amountNum,
        bankDetails,
      });

      toast.success(res.data.message);
      setShowForm(false);
      setWithdrawAmount("");
      setBankDetails("");

      setWithdrawalHistory((prev) => [
        {
          id: res.data.withdrawalId,
          status: "pending",
          amount: amountNum,
          requestedAt: new Date(),
        },
        ...prev,
      ]);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setWithdrawing(false);
    }
  };

  const generateReferralLink = async () => {
    setGenerating(true);
    try {
      const code = `${userData.name?.substring(0, 3).toUpperCase() || "USR"}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await updateDoc(doc(db, "users", user.uid), { referralCode: code });
      toast.success("Link generated!");
    } catch (e) {
      toast.error("Error generating link");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join GrowEasy",
          text: "Start managing your business easily. Sign up here!",
          url: publicLink,
        });
      } else {
        copyLink();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!user || !userData)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5247bf]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-700 pb-20 relative">
      {/* Header */}
      <div className="bg-[#5247bf] px-4 pt-8 pb-12 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Partner Program
          </h1>
          <p className="text-indigo-200 mt-2">
            Earn 25% commission on Pro upgrades.
          </p>
          {userData.referralCode && (
            <button
              onClick={shareLink}
              className="mt-6 inline-flex items-center gap-2 bg-white/10 px-6 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              <Share2 className="w-5 h-5" /> Share Link
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {!userData.referralCode ? (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center border border-gray-100">
            <Users className="w-12 h-12 text-[#5247bf] mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">
              Start Earning Today
            </h2>
            <button
              onClick={generateReferralLink}
              disabled={generating}
              className="bg-[#5247bf] text-white px-10 py-4 rounded-2xl font-black hover:bg-[#4238a6] transition flex items-center gap-2 mx-auto shadow-xl"
            >
              {generating ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                "Generate My Unique Link"
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-[#5247bf]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Wallet Balance
                </p>
                <p className="text-2xl font-black">
                  ₦{(userData.walletBalance || 0).toLocaleString()}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 w-full text-white bg-[#5247bf] rounded-xl font-black hover:bg-[#3b329c] transition py-2 text-xs uppercase tracking-widest"
                >
                  Withdraw
                </button>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-green-500">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Earnings
                </p>
                <p className="text-2xl font-black">
                  ₦{(userData.totalEarnings || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-orange-500">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Total Signups
                </p>
                <p className="text-2xl font-black">
                  {userData.referralCount || 0}
                </p>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="bg-white p-4 rounded-2xl shadow-md flex items-center gap-3 border border-indigo-50">
              <div className="flex-1 bg-gray-50 p-3 rounded-xl text-gray-500 truncate text-xs font-mono">
                {publicLink}
              </div>
              <button
                onClick={copyLink}
                className="bg-indigo-50 text-[#5247bf] p-3 rounded-xl border border-indigo-100"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* History Tables */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
              <div className="px-6 py-4 bg-gray-50 font-black uppercase text-xs tracking-widest border-b text-gray-500">
                Referral History
              </div>
              {loadingList ? (
                <div className="p-10 text-center">
                  <Loader2 className="animate-spin mx-auto text-gray-200" />
                </div>
              ) : referralList.length === 0 ? (
                <div className="p-10 text-center text-gray-400 italic">
                  No referrals yet. Share your link to start earning!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-50">
                      {referralList.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-bold text-gray-800 text-sm">
                            {r.name}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[9px] uppercase font-black px-2 py-1 bg-green-50 text-green-600 rounded">
                              Joined
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                Withdraw Funds
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  placeholder="Minimum ₦500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5247bf] font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Payment Details
                </label>
                <textarea
                  placeholder="Bank Name, Account Number, Account Name"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5247bf] h-32 resize-none font-medium text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={withdrawing}
                className="w-full bg-[#5247bf] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-[#4238a6] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {withdrawing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Submit Request"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralDashboard;

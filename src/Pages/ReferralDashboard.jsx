import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import api from "../lib/api";
import { doc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Share2,
  Wallet,
  Users,
  TrendingUp,
  Loader2,
  History,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

const ReferralDashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useUser();

  // Dashboard States
  const [generating, setGenerating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralList, setReferralList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form States
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  // 1. Fetch Data on Mount
  useEffect(() => {
    if (!user) {
      setLoadingList(false);
      return;
    }

    const fetchData = async () => {
      try {
        // ✅ Single backend call instead of two Firestore queries
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

  // 2. Withdrawal Submission via Backend API
  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    if (withdrawing) return;

    const amountNum = Number(withdrawAmount);
    if (amountNum < 500) return toast.warn("Minimum withdrawal is ₦500");

    setWithdrawing(true);
    try {
      // ✅ api utility handles token automatically
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
          requestedAt: { toDate: () => new Date() },
        },
        ...prev,
      ]);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setWithdrawing(false);
    }
  };

  // 3. Link Management
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
    navigator.clipboard.writeText(
      `${window.location.origin}/signup?ref=${userData.referralCode}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const shareLink = async () => {
    const link = `${window.location.origin}/signup?ref=${userData?.referralCode}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join GrowEasy",
          text: "Start managing your business easily. Sign up here!",
          url: link,
        });
      } else {
        copyLink();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Date Formatting Helper
  const formatDate = (ts) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading Guard
  if (!user || !userData)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5247bf]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-700 pb-20 relative">
      {/* Header */}
      <div className="bg-[#5247bf] px-2 pt-8 pb-12 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center">
            <div className=" text-center mx-auto">
              <h1 className="text-3xl font-bold">Partner Program</h1>
              <p className="text-indigo-200 mt-2">
                Earn 25% commission on Pro upgrades.
              </p>
            </div>
            {userData.referralCode && (
              <button
                onClick={shareLink}
                className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20"
              >
                <Share2 className="w-5 h-5" /> Share
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {/* Referral Status / CTA */}
        {!userData.referralCode ? (
          <div className="bg-white rounded-xl shadow-lg p-10 text-center">
            <Users className="w-12 h-12 text-[#5247bf] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Start Earning Today</h2>
            <button
              onClick={generateReferralLink}
              disabled={generating}
              className="bg-[#5247bf] text-white px-10 py-3 rounded-full font-bold hover:bg-[#4238a6] transition flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                "Generate My Link"
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-[#5247bf]">
                <p className="text-gray-500 text-sm mb-1">Wallet Balance</p>
                <p className="text-2xl font-extrabold">
                  ₦{(userData.walletBalance || 0).toLocaleString()}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 w-full cursor-pointer text-white bg-[#5247bf] rounded-lg font-bold hover:bg-[#190f6e] transition flex items-center justify-center gap-2 py-2"
                >
                  Withdraw Funds
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-green-500">
                <p className="text-gray-500 text-sm mb-1">Total Earnings</p>
                <p className="text-2xl font-extrabold">
                  ₦{(userData.totalEarnings || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-orange-500">
                <p className="text-gray-500 text-sm mb-1">Total Signups</p>
                <p className="text-2xl font-extrabold">
                  {userData.referralCount || 0}
                </p>
              </div>
            </div>

            {/* Withdrawal Form Section */}
            {showForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      Withdraw Funds
                    </h3>
                    <button
                      onClick={() => setShowForm(false)}
                      className="p-2 hover:bg-gray-200 rounded-full transition"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Amount to Withdraw (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#5247bf] focus:ring-2 focus:ring-[#5247bf]/20 outline-none transition"
                        required
                      />
                      <p className="text-[11px] text-gray-400 mt-2">
                        Available Balance: ₦
                        {(userData.walletBalance || 0).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Bank Name, Account Number & Name
                      </label>
                      <textarea
                        placeholder="Kuda Bank, 1234567890, John Doe"
                        value={bankDetails}
                        onChange={(e) => setBankDetails(e.target.value)}
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#5247bf] focus:ring-2 focus:ring-[#5247bf]/20 outline-none transition h-32 resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={withdrawing}
                      className="w-full bg-[#5247bf] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#4238a6] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {withdrawing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />{" "}
                          Submitting Request...
                        </>
                      ) : (
                        "Request Withdrawal"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Referral Link Box */}
            <div className="bg-white p-6 rounded-xl shadow-md flex gap-2">
              <div className="flex-1 bg-gray-50 p-3.5 rounded-xl text-gray-600 truncate text-sm font-mono border">
                {window.location.origin}/signup?ref={userData.referralCode}
              </div>
              <button
                onClick={copyLink}
                className="bg-indigo-50 text-[#5247bf] px-5 py-2 rounded-xl font-bold border border-indigo-100"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* History Tables */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 font-bold border-b text-gray-700">
                Referral History
              </div>
              {loadingList ? (
                <div className="p-10 text-center">
                  <Loader2 className="animate-spin mx-auto text-gray-300" />
                </div>
              ) : referralList.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  No referrals recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y">
                      {referralList.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {r.name}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-green-50 text-green-600 rounded">
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

            {/* Withdrawal History */}
            {withdrawalHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-20">
                <div className="px-6 py-4 bg-gray-50 font-bold border-b flex items-center gap-2">
                  <History className="w-4 h-4" /> Withdrawal History
                </div>
                <div className="divide-y">
                  {withdrawalHistory.map((w) => (
                    <div
                      key={w.id}
                      className="px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          ₦{w.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {formatDate(w.requestedAt)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                          w.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Share2,
  Wallet,
  Users,
  TrendingUp,
  Banknote,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "react-toastify";

const ReferralDashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useUser();

  const [generating, setGenerating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralList, setReferralList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  // Fetch Referral List & Withdrawal History on mount
  useEffect(() => {
    // GUARD: Ensure user and referralCode exist before running logic
    if (!user || !userData?.referralCode) {
      setLoadingList(false);
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch Users who used my code
        const usersRef = collection(db, "users");
        const qUsers = query(
          usersRef,
          where("referredBy", "==", userData.referralCode),
          orderBy("createdAt", "desc")
        );
        const userSnaps = await getDocs(qUsers);
        const users = userSnaps.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReferralList(users);

        // 2. Fetch My Withdrawal History
        const withdrawRef = collection(db, "withdrawals");
        const qWithdraw = query(
          withdrawRef,
          where("userId", "==", user.uid),
          orderBy("requestedAt", "desc")
        );
        const withdrawSnaps = await getDocs(qWithdraw);
        const withdraws = withdrawSnaps.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWithdrawalHistory(withdraws);
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoadingList(false);
      }
    };

    fetchData();
    // FIXED: Added optional chaining (user?.uid) to prevent crash
  }, [userData?.referralCode, user?.uid]);

  // Generate Link Logic
  const generateReferralLink = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const prefix = (userData.name || "USR")
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "USR");
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();
      const code = `${prefix}-${randomStr}`;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        referralCode: code,
        walletBalance: 0,
        totalEarnings: 0,
        referralCount: 0,
      });

      toast.success("Referral link generated!");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  // Copy Link Logic
  const copyLink = () => {
    const link = `${window.location.origin}/signup?ref=${userData?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  // Share Logic
  const shareLink = async () => {
    const link = `${window.location.origin}/signup?ref=${userData?.referralCode}`;
    const shareData = {
      title: "Join GrowEasy",
      text: "Manage your business with ease. Sign up using my link!",
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyLink();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Withdrawal Logic
  const handleWithdrawal = async () => {
    if (!user) return;
    const balance = userData?.walletBalance || 0;

    if (balance < 1000) {
      return toast.warn("Minimum withdrawal is ₦1,000");
    }

    // Check for pending requests
    const hasPending = withdrawalHistory.some((w) => w.status === "pending");
    if (hasPending) {
      return toast.info("You have a pending withdrawal request.");
    }

    const bankDetails = window.prompt(
      `Withdraw ₦${balance.toLocaleString()}?\n\nEnter Bank Name & Account Number:`
    );

    if (!bankDetails) return;

    setWithdrawing(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: user.uid,
        userName: userData.name,
        email: user.email,
        amount: balance,
        bankDetails: bankDetails,
        status: "pending",
        requestedAt: serverTimestamp(),
      });

      toast.success("Request submitted successfully!");
      // Optimistic update for UI
      setWithdrawalHistory((prev) => [
        {
          status: "pending",
          amount: balance,
          requestedAt: { toDate: () => new Date() },
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit request");
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Wait for both user and userData to be ready
  if (!user || !userData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5247bf]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#5247bf] px-6 pt-8 pb-12 text-white">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-indigo-200 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Partner Program</h1>
              <p className="text-indigo-200 mt-2">
                Earn 25% commission on every referral upgrade.
              </p>
            </div>
            {/* Desktop Share Button */}
            {userData.referralCode && (
              <button
                onClick={shareLink}
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition border border-white/20"
              >
                <Share2 className="w-5 h-5" /> Share Link
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 space-y-6">
        {/* 1. STATS CARDS */}
        {!userData.referralCode ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#5247bf]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Start Earning Today
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Generate your unique link and share it with business owners.
              You'll get paid whenever they subscribe to a Pro plan.
            </p>
            <button
              onClick={generateReferralLink}
              disabled={generating}
              className="bg-[#5247bf] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4238a6] transition shadow-lg flex items-center gap-2 mx-auto disabled:opacity-70"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Generate Referral Link"
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-[#5247bf]">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <Wallet className="w-5 h-5" /> Wallet Balance
                </div>
                <div className="text-3xl font-extrabold text-gray-900">
                  ₦{(userData.walletBalance || 0).toLocaleString()}
                </div>
                <button
                  onClick={handleWithdrawal}
                  className="mt-4 w-full py-2 border border-[#5247bf] text-[#5247bf] rounded-lg text-sm font-semibold hover:bg-purple-50 transition"
                >
                  Withdraw Funds
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-green-500">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <TrendingUp className="w-5 h-5" /> Total Earnings
                </div>
                <div className="text-3xl font-extrabold text-gray-900">
                  ₦{(userData.totalEarnings || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400 mt-4">Lifetime earnings</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-orange-500">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <Users className="w-5 h-5" /> Total Signups
                </div>
                <div className="text-3xl font-extrabold text-gray-900">
                  {userData.referralCount || 0}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Successful registrations
                </p>
              </div>
            </div>

            {/* Link Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-semibold text-gray-700 mb-3">
                Your Referral Link
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 font-mono text-sm truncate flex items-center">
                  {window.location.origin}/signup?ref={userData.referralCode}
                </div>
                <button
                  onClick={copyLink}
                  className="bg-indigo-50 text-[#5247bf] px-4 py-2 rounded-lg hover:bg-indigo-100 transition flex items-center gap-2 font-medium"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button
                  onClick={shareLink}
                  className="bg-[#5247bf] text-white px-4 py-2 rounded-lg hover:bg-[#4238a6] transition flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. REFERRAL LIST */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800">Referral History</h3>
              </div>

              {loadingList ? (
                <div className="p-8 text-center text-gray-500">
                  Loading history...
                </div>
              ) : referralList.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    No referrals yet. Share your link to get started!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Date Joined</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {referralList.map((refUser) => (
                        <tr key={refUser.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">
                              {refUser.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {refUser.email}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatDate(refUser.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Registered
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. WITHDRAWAL HISTORY */}
            {withdrawalHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-800">
                    Withdrawal History
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {withdrawalHistory.map((w) => (
                    <div
                      key={w.id}
                      className="px-6 py-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          ₦{w.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(w.requestedAt)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          w.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : w.status === "rejected"
                              ? "bg-red-100 text-red-700"
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

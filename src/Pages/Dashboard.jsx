import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import {
  FileText,
  User,
  File,
  CheckCircle,
  Lock,
  Share2,
  ArrowRight,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useUser();
  const { isPaid, subscription, daysRemaining, planLabel, planType } =
    useSubscription();

  const handleCreations = () => navigate("/content-creation-board");
  const handleUserProfile = () => navigate("/user-profile");
  const handleViewDocuments = () => navigate("/documents");
  const handleUpgrade = () => navigate("/subscribe");
  const handleReferrals = () => navigate("/referrals");

  if (!userData) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center bg-no-repeat pb-24 pt-8 px-4 md:pt-12 md:px-12"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      {/* Header Banner */}
      <div className="bg-[#5247bf] rounded-2xl p-6 mb-10 max-w-6xl mx-auto shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center">
          Dashboard
        </h1>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Subscription Status Card ─────────────────────────────── */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#5247bf]/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {isPaid ? (
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                      <Lock className="w-8 h-8 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isPaid ? "Pro Plan Active" : planLabel}
                    </h2>
                    {isPaid && (
                      <p className="text-sm text-gray-600 capitalize">
                        {planType} • {daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                </div>

                {!isPaid && (
                  <button
                    onClick={handleUpgrade}
                    className="hidden sm:block bg-[#5247bf] text-white px-6 py-2 rounded-xl hover:bg-[#4238a6] font-semibold transition shadow-md"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {isPaid ? (
                  <p className="text-green-700 text-sm font-medium">
                    ✓ Unlimited receipts, invoices & financial records enabled.
                  </p>
                ) : (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Limited to 10 documents per category</p>
                    <p className="text-[#5247bf] font-bold">
                      Upgrade to Pro for unlimited access
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isPaid && (
              <button
                onClick={handleUpgrade}
                className="mt-4 sm:hidden w-full bg-[#5247bf] text-white px-5 py-3 rounded-xl font-bold transition"
              >
                Upgrade Now
              </button>
            )}
          </div>

          {/* ── Partner Program Card ──────────────────────────────────── */}
          <div
            onClick={handleReferrals}
            className="bg-gradient-to-br from-indigo-900 to-[#5247bf] rounded-2xl shadow-xl p-8 flex flex-col justify-center text-white cursor-pointer hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />

            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-5">
                <div className="bg-white/20 p-4 rounded-2xl">
                  <Share2 className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Partner Program</h2>
                  {userData.referralCode ? (
                    <div className="flex flex-col mt-1">
                      <span className="text-indigo-200 text-sm">
                        Wallet Balance
                      </span>
                      <span className="text-2xl font-mono font-black text-white">
                        ₦{(userData.walletBalance || 0).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <p className="text-indigo-100 opacity-90">
                      Earn 25% commission on upgrades
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-8 h-8 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        </div>

        {/* ── Business Tools Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Business Tools */}
          <div
            onClick={handleCreations}
            className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between hover:border-[#5247bf] border-2 border-transparent transition-all duration-300 cursor-pointer group"
          >
            <div className="mb-6">
              <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5247bf] transition-colors">
                <FileText className="w-8 h-8 text-[#5247bf] group-hover:text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Business Tools
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Create receipts, invoices & track financial records.
              </p>
            </div>
            <button className="w-full bg-gray-100 text-[#5247bf] font-bold py-3 rounded-xl group-hover:bg-[#5247bf] group-hover:text-white transition-all">
              Open Tools
            </button>
          </div>

          {/* User Profile */}
          <div
            onClick={handleUserProfile}
            className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between hover:border-[#5247bf] border-2 border-transparent transition-all duration-300 cursor-pointer group"
          >
            <div className="mb-6">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5247bf] transition-colors">
                <User className="w-8 h-8 text-[#5247bf] group-hover:text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">User Profile</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your account settings and preferences.
              </p>
            </div>
            <button className="w-full bg-gray-100 text-[#5247bf] font-bold py-3 rounded-xl group-hover:bg-[#5247bf] group-hover:text-white transition-all">
              View Profile
            </button>
          </div>

          {/* Legal Documents */}
          <div
            onClick={handleViewDocuments}
            className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between hover:border-[#5247bf] border-2 border-transparent transition-all duration-300 cursor-pointer group"
          >
            <div className="mb-6">
              <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5247bf] transition-colors">
                <File className="w-8 h-8 text-[#5247bf] group-hover:text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Legal Documents
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Access professional contracts and agreements.
              </p>
            </div>
            <button className="w-full bg-gray-100 text-[#5247bf] font-bold py-3 rounded-xl group-hover:bg-[#5247bf] group-hover:text-white transition-all">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

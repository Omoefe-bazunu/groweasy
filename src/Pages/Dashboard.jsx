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
  const { userData } = useUser();
  const { isPaid, planLabel, planType, daysRemaining } = useSubscription();

  const handleCreations = () => navigate("/content-creation-board");
  const handleUserProfile = () => navigate("/user-profile");
  const handleViewDocuments = () => navigate("/documents");
  const handleUpgrade = () => navigate("/subscribe");
  const handleReferrals = () => navigate("/referrals");

  // ✅ REMOVED: Full-page blocking loader.
  // The app will now show the dashboard layout instantly using cached data.

  return (
    <div
      className="min-h-screen bg-[#f8fafc] bg-cover bg-fixed bg-center bg-no-repeat pb-24 pt-8 px-4 md:pt-12 md:px-12 animate-in fade-in duration-700"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.8), rgba(248, 250, 252, 0.9)), url('/gebg.jpg')`,
        backgroundColor: "#f8fafc", // Immediate fallback color
      }}
    >
      {/* Header Banner */}
      <div className="bg-[#5247bf] rounded-2xl p-6 mb-10 max-w-6xl mx-auto shadow-2xl transition-all">
        <h1 className="text-3xl md:text-4xl font-black text-white text-center uppercase tracking-tighter">
          Dashboard
        </h1>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Subscription Status Card ─────────────────────────────── */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-shadow">
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
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      {isPaid ? "Pro Plan Active" : planLabel || "Free Plan"}
                    </h2>
                    {isPaid && (
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-0.5">
                        {planType} • {daysRemaining} days left
                      </p>
                    )}
                  </div>
                </div>

                {!isPaid && (
                  <button
                    onClick={handleUpgrade}
                    className="hidden sm:block bg-[#5247bf] text-white px-6 py-2 rounded-xl hover:bg-[#4238a6] font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {isPaid ? (
                  <p className="text-green-700 text-sm font-bold">
                    ✓ Unlimited documents & records enabled.
                  </p>
                ) : (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">
                      Limited to 10 documents per category
                    </p>
                    <p className="text-[#5247bf] font-black uppercase text-xs tracking-tighter">
                      Upgrade for unlimited business scaling
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isPaid && (
              <button
                onClick={handleUpgrade}
                className="mt-4 sm:hidden w-full bg-[#5247bf] text-white px-5 py-3 rounded-xl font-black uppercase tracking-widest transition active:scale-95"
              >
                Upgrade Now
              </button>
            )}
          </div>

          {/* ── Partner Program Card ──────────────────────────────────── */}
          <div
            onClick={handleReferrals}
            className="bg-gradient-to-br from-indigo-900 to-[#5247bf] rounded-2xl shadow-xl p-8 flex flex-col justify-center text-white cursor-pointer hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group border border-white/5"
          >
            {/* Background Accent */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#5247bf]/20 rounded-full blur-3xl group-hover:bg-[#5247bf]/40 transition-all" />

            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-5">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <Share2 className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Partner Program
                  </h2>
                  {/* Safely check for userData using optional chaining */}
                  {userData?.referralCode ? (
                    <div className="flex flex-col mt-2">
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        Available Balance
                      </span>
                      <span className="text-2xl font-black text-green-400 tracking-tighter">
                        ₦{(userData.walletBalance || 0).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm font-bold mt-1">
                      Earn 25% commission on Pro upgrades
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-8 h-8 text-white/20 group-hover:text-white transform group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        </div>

        {/* ── Business Tools Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardGridItem
            title="Business Tools"
            desc="Create receipts, invoices & track financial records."
            icon={<FileText className="w-8 h-8" />}
            color="bg-purple-100 text-purple-700"
            onClick={handleCreations}
            btnLabel="Open Tools"
          />

          <DashboardGridItem
            title="User Profile"
            desc="Manage your account settings and preferences."
            icon={<User className="w-8 h-8" />}
            color="bg-blue-100 text-blue-700"
            onClick={handleUserProfile}
            btnLabel="View Profile"
          />

          <DashboardGridItem
            title="Legal Documents"
            desc="Access professional contracts and agreements."
            icon={<File className="w-8 h-8" />}
            color="bg-orange-100 text-orange-700"
            onClick={handleViewDocuments}
            btnLabel="View Docs"
          />
        </div>
      </div>
    </div>
  );
};

// Internal reusable item for the grid
const DashboardGridItem = ({ title, desc, icon, color, onClick, btnLabel }) => (
  <div
    onClick={onClick}
    className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-md p-6 flex flex-col items-start justify-between border-2 border-transparent hover:border-[#5247bf]/20 transition-all duration-300 cursor-pointer group"
  >
    <div className="mb-6">
      <div
        className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#5247bf] group-hover:text-white transition-all duration-300`}
      >
        {icon}
      </div>
      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
        {title}
      </h2>
      <p className="text-sm text-gray-500 font-medium mt-1 leading-tight">
        {desc}
      </p>
    </div>
    <button className="w-full bg-gray-50 text-[#5247bf] font-black uppercase text-xs tracking-widest py-4 rounded-2xl group-hover:bg-[#5247bf] group-hover:text-white transition-all shadow-sm">
      {btnLabel}
    </button>
  </div>
);

export default Dashboard;

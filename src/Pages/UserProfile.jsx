import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import {
  CheckCircle,
  Clock,
  FileText,
  Receipt,
  DollarSign,
  LogOut,
  ClipboardList,
  Package,
  Banknote,
  User2Icon,
  Crown,
} from "lucide-react";

const UserProfile = () => {
  const { user, userData, logout } = useUser();
  const { isPaid, daysRemaining, planLabel, planType } = useSubscription();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    receipts: 0,
    invoices: 0,
    financialRecords: 0,
    quotations: 0,
    inventory: 0,
    payrolls: 0,
    customers: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const cols = [
          "receipts",
          "invoices",
          "financialRecords",
          "quotations",
          "inventory",
          "payrolls",
          "customers",
        ];

        const results = await Promise.all(
          cols.map(async (col) => {
            const q = query(
              collection(db, col),
              where("userId", "==", user.uid),
            );
            const snapshot = await getCountFromServer(q);
            return { [col]: snapshot.data().count };
          }),
        );

        setCounts(Object.assign({}, ...results));
      } catch (err) {
        console.error("Failed to fetch counts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [user]);

  if (!user || !userData) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse" />
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse delay-200" />
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse delay-400" />
        </div>
      </section>
    );
  }

  const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="bg-[#5247bf] rounded-2xl p-8 mb-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-white">
              My Profile
            </h1>
            <p className="text-indigo-100 opacity-80">
              Manage your account and subscription
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* ── User Info + Subscription ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* User Info Card */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-lg p-8 border border-gray-100 flex flex-col items-center text-center">
            <div className="w-28 h-28 bg-gradient-to-br from-[#5247bf] to-[#4238a6] rounded-full flex items-center justify-center text-white text-4xl font-black mb-6 shadow-lg shadow-indigo-100">
              {userData.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {userData.name || "User"}
            </h2>
            <p className="text-gray-500 mb-1 font-medium">{user.email}</p>
            {userData.phoneNumber && (
              <p className="text-gray-400 text-sm">{userData.phoneNumber}</p>
            )}
          </div>

          {/* Subscription Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Subscription Status
                </h3>
                <p className="text-gray-500 text-sm">
                  Your current plan and billing cycle
                </p>
              </div>

              {/* ✅ Status badge — reads isPaid, no subscription?.type */}
              <div
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black shadow-sm ${
                  isPaid
                    ? "bg-green-50 text-green-600 border border-green-100"
                    : "bg-orange-50 text-orange-600 border border-orange-100"
                }`}
              >
                {isPaid ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
                {isPaid ? "PRO ACTIVE" : planLabel.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                {/* Plan Type — ✅ uses planType from context, not subscription?.type */}
                <div className="flex items-center gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <Crown className="w-5 h-5 text-[#5247bf]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Plan Type
                    </p>
                    <p className="text-gray-900 font-bold">
                      {isPaid
                        ? `${planType === "yearly" ? "Yearly" : "Monthly"} Pro`
                        : planLabel}
                    </p>
                  </div>
                </div>

                {/* Renewal — only shown when paid */}
                {isPaid && (
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <Clock className="w-5 h-5 text-[#5247bf]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Renewal In
                      </p>
                      <p className="text-gray-900 font-bold">
                        {daysRemaining} Days
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 text-center md:text-left">
                {isPaid ? (
                  <p className="text-green-600 font-bold text-sm">
                    You have full, unlimited access to all business tools and
                    document generation.
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-600 text-sm mb-4">
                      Upgrade to bypass the 10-item document limit per category.
                    </p>
                    <button
                      onClick={() => navigate("/subscribe")}
                      className="w-full bg-[#5247bf] text-white py-3 rounded-xl font-bold hover:bg-[#4238a6] transition-all"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Account Statistics ────────────────────────────────────────── */}
        <h3 className="text-2xl font-black text-gray-900 mb-6 px-2">
          Account Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-12">
          {[
            { label: "Receipts", count: counts.receipts, icon: Receipt },
            { label: "Invoices", count: counts.invoices, icon: FileText },
            {
              label: "Quotations",
              count: counts.quotations,
              icon: ClipboardList,
            },
            { label: "Inventory", count: counts.inventory, icon: Package },
            { label: "Payslips", count: counts.payrolls, icon: Banknote },
            { label: "Customers", count: counts.customers, icon: User2Icon },
            {
              label: "Finance",
              count: counts.financialRecords,
              icon: DollarSign,
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            >
              <stat.icon className="w-8 h-8 text-[#5247bf] opacity-80 mb-4" />
              <p className="text-2xl font-black text-gray-900">
                {loading ? "..." : stat.count}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Free Plan Upgrade Banner ──────────────────────────────────── */}
        {!isPaid && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-3xl p-10 text-center">
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Maximize Your Growth
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              You are currently on the{" "}
              <span className="font-bold text-[#5247bf]">{planLabel}</span>. You
              have used{" "}
              <span className="font-bold text-[#5247bf]">{totalDocs}</span> out
              of your total 70 document capacity.
            </p>
            <button
              onClick={() => navigate("/subscribe")}
              className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:scale-105 transition-transform"
            >
              Unlock Unlimited Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

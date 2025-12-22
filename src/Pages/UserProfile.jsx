// src/Pages/Profile.jsx
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
  XCircle,
  Clock,
  FileText,
  Receipt,
  DollarSign,
  LogOut,
  ClipboardList, // Added for Quotations
  Package, // Added for Inventory
  Banknote,
  User2Icon, // Added for Payrolls
} from "lucide-react";

const UserProfile = () => {
  const { user, userData, logout } = useUser();
  const { isPaid, subscription, daysRemaining } = useSubscription();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    receipts: 0,
    invoices: 0,
    financialRecords: 0,
    quotations: 0, // New
    inventory: 0, // New
    payrolls: 0,
    customers: 0, // New
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
        // Added new collections to the array
        const collections = [
          "receipts",
          "invoices",
          "financialRecords",
          "quotations",
          "inventory",
          "payrolls",
          "customers",
        ];

        const results = await Promise.all(
          collections.map(async (col) => {
            const q = query(
              collection(db, col),
              where("userId", "==", user.uid)
            );
            const snapshot = await getCountFromServer(q);
            return { [col]: snapshot.data().count };
          })
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
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pb-25 pt-6 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#5247bf] rounded-xl p-6 mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white text-center">
            My Profile
          </h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white max-w-2xl mx-auto rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#5247bf] to-[#4238a6] rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {userData.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {userData.name || "User"}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              {userData.phoneNumber && (
                <p className="text-gray-600">{userData.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex flex-col items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 text-left">
                Subscription Status
              </h3>
              <div
                className={`flex items-center w-fit mx-auto gap-2 px-4 py-2 rounded-lg mt-4 text-sm font-bold ${
                  isPaid
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {isPaid ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Pro Active
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Free Plan
                  </>
                )}
              </div>
            </div>

            {isPaid ? (
              <div className="space-y-3 flex flex-col">
                <p className="text-gray-700">
                  <strong>Plan:</strong>{" "}
                  {subscription?.type === "yearly" ? "Yearly" : "Monthly"} Pro
                </p>
                <p className="text-gray-700">
                  <strong>Expires in:</strong> {daysRemaining} days
                </p>
                <p className="text-green-600 font-medium">
                  Unlimited access to all features
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-700">
                  Limited to 10 items per category
                </p>
                <button
                  onClick={() => (window.location.href = "/subscribe")}
                  className="bg-[#5247bf] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4238a6] transition"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document Counts */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Receipt className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.receipts}
            </p>
            <p className="text-sm text-gray-600">Receipts</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <FileText className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.invoices}
            </p>
            <p className="text-sm text-gray-600">Invoices</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <ClipboardList className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.quotations}
            </p>
            <p className="text-sm text-gray-600">Quotations</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Package className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.inventory}
            </p>
            <p className="text-sm text-gray-600">Inventory Items</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Banknote className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.payrolls}
            </p>
            <p className="text-sm text-gray-600">Payslips</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <User2Icon className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.customers}
            </p>
            <p className="text-sm text-gray-600">Customers</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <DollarSign className="w-10 h-10 text-[#5247bf] mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-900">
              {loading ? "..." : counts.financialRecords}
            </p>
            <p className="text-sm text-gray-600">Financial Records</p>
          </div>
        </div>

        {!isPaid && (
          <div className="mt-10 bg-orange-50 border border-orange-200 max-w-2xl mx-auto rounded-2xl p-8 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-6">
              Free Plan Limits (10 per category)
            </p>

            {/* Free Limits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.receipts}
                </p>
                <p className="text-xs text-gray-600">Receipts</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.invoices}
                </p>
                <p className="text-xs text-gray-600">Invoices</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.quotations}
                </p>
                <p className="text-xs text-gray-600">Quotations</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.inventory}
                </p>
                <p className="text-xs text-gray-600">Inventory</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.payrolls}
                </p>
                <p className="text-xs text-gray-600">Payslips</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.customers}
                </p>
                <p className="text-xs text-gray-600">Customers</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-[#5247bf]">
                  {counts.financialRecords}
                </p>
                <p className="text-xs text-gray-600">Finance</p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              You can create up to <strong>60 free items</strong> total (10 of
              each type).
            </p>

            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              Unlock Unlimited Access
            </button>
          </div>
        )}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleLogout}
            className="p-4 w-full bg-red-600 text-white hover:bg-red-700 mt-6 rounded-lg transition-all duration-200 group"
            title="Logout"
          >
            <div className="flex items-center justify-center gap-2">
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

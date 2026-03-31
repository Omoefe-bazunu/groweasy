"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { db } from "@/lib/firebase";
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
  Loader2,
} from "lucide-react";

const STAT_CONFIG = [
  { key: "receipts", label: "Receipts", icon: Receipt },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "quotations", label: "Quotations", icon: ClipboardList },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "payrolls", label: "Payslips", icon: Banknote },
  { key: "customers", label: "Customers", icon: User2Icon },
  { key: "financialRecords", label: "Finance", icon: DollarSign },
];

const UserProfile = () => {
  const { user, userData, loading: authLoading, logout } = useUser();
  const {
    isPaid,
    daysRemaining,
    planLabel,
    planType,
    loading: subLoading,
  } = useSubscription();
  const router = useRouter();

  const [counts, setCounts] = useState({
    receipts: 0,
    invoices: 0,
    financialRecords: 0,
    quotations: 0,
    inventory: 0,
    payrolls: 0,
    customers: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  // ✅ FIX: Move redirection to useEffect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const results = await Promise.all(
          STAT_CONFIG.map(async (stat) => {
            const q = query(
              collection(db, stat.key),
              where("userId", "==", user.uid),
            );
            const snapshot = await getCountFromServer(q);
            return { [stat.key]: snapshot.data().count };
          }),
        );

        if (isMounted) {
          setCounts(Object.assign({}, ...results));
        }
      } catch (err) {
        console.error("Failed to fetch counts:", err);
      } finally {
        if (isMounted) setCountsLoading(false);
      }
    };

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const totalDocs = useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [counts]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ✅ Change the conditional return logic:
  // Show loading if auth is loading OR if there is no user yet (while we wait for the useEffect to redirect)
  if (authLoading || subLoading || !user) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#5247bf] mb-4" />
        <p className="text-[#5247bf] font-black uppercase tracking-widest text-xs">
          Loading Profile...
        </p>
      </section>
    );
  }

  // If we get here, we have a user and data is ready
  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12 text-gray-700 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#5247bf] rounded-2xl p-8 mb-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
              My Profile
            </h1>
            <p className="text-indigo-100 opacity-80 font-medium">
              Manage your business account and subscription
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black uppercase text-xs tracking-widest shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* User Info Card */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-lg p-8 border border-gray-100 flex flex-col items-center text-center">
            <div className="w-28 h-28 bg-gradient-to-br from-[#5247bf] to-[#4238a6] rounded-full flex items-center justify-center text-white text-4xl font-black mb-6 shadow-xl">
              {userData?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">
              {userData?.name || "User"}
            </h2>
            <p className="text-gray-500 mb-1 font-bold">{user.email}</p>
            {userData?.phoneNumber && (
              <p className="text-gray-400 text-sm font-medium">
                {userData.phoneNumber}
              </p>
            )}
          </div>

          {/* Subscription Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  Subscription Status
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                  Current plan and billing cycle
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black shadow-sm tracking-widest ${
                  isPaid
                    ? "bg-green-50 text-green-600 border border-green-100"
                    : "bg-orange-50 text-orange-600 border border-orange-100"
                }`}
              >
                {isPaid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                {isPaid ? "PRO ACTIVE" : (planLabel || "FREE").toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <Crown className="w-5 h-5 text-[#5247bf]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Plan Type
                    </p>
                    <p className="text-gray-900 font-black uppercase text-sm">
                      {isPaid
                        ? `${planType === "yearly" ? "Yearly" : "Monthly"} Pro`
                        : planLabel}
                    </p>
                  </div>
                </div>
                {isPaid && (
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <Clock className="w-5 h-5 text-[#5247bf]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Renewal In
                      </p>
                      <p className="text-gray-900 font-black text-sm">
                        {daysRemaining} Days
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                {isPaid ? (
                  <p className="text-green-700 font-bold text-sm leading-relaxed">
                    ✓ Full, unlimited access to all GrowEasy tools enabled. Your
                    business is ready to scale.
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-600 text-sm mb-4 font-medium">
                      Upgrade to bypass the 10-item limit per category.
                    </p>
                    <button
                      onClick={() => router.push("/subscribe")}
                      className="w-full bg-[#5247bf] text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#4238a6] transition-all shadow-md active:scale-95"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <h3 className="text-2xl font-black text-gray-900 mb-6 px-2 uppercase tracking-tighter">
          Account Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-12">
          {STAT_CONFIG.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            >
              <stat.icon className="w-8 h-8 text-[#5247bf] opacity-60 mb-4" />
              <p className="text-2xl font-black text-gray-900">
                {countsLoading ? "..." : counts[stat.key]}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Upgrade Banner */}
        {!isPaid && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-3xl p-10 text-center shadow-inner">
            <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
              Maximize Your Growth
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto font-medium">
              You have already generated{" "}
              <span className="font-black text-[#5247bf] text-lg">
                {totalDocs}
              </span>{" "}
              documents. Upgrade to Pro for unlimited potential and advanced
              business tools.
            </p>
            <button
              onClick={() => router.push("/subscribe")}
              className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all active:scale-95"
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

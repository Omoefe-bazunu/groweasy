import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Receipt,
  FileText,
  List,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  ClipboardList,
  Package,
  Banknote,
  Settings,
  Save,
  Calendar, // Added Calendar Icon
  ShieldCheck, // Added Shield Icon for status
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [modalError, setModalError] = useState("");

  // Data States
  const [users, setUsers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState({}); // New State for Subscriptions

  // Metrics State
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalFinancialRecords, setTotalFinancialRecords] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [totalInventory, setTotalInventory] = useState(0);
  const [totalPayrolls, setTotalPayrolls] = useState(0);

  // Settings State
  const [monthlyFee, setMonthlyFee] = useState(3000);
  const [updatingFee, setUpdatingFee] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({
    users: true,
    subscriptions: true,
    metrics: false,
    settings: true,
  });

  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate("/login");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleExperts = () => {
    navigate("/admin/add-expert");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setModalError("");
    setLoading(true);

    try {
      const adminDoc = await getDoc(doc(db, "admin", "adminAccess"));
      if (!adminDoc.exists()) {
        setModalError("Admin credentials not configured");
        return;
      }

      const data = adminDoc.data();
      if (adminEmail === data.email && adminPassword === data.password) {
        setIsAdmin(true);
        setShowModal(false);
      } else {
        setModalError("Invalid email or password");
      }
    } catch (err) {
      setModalError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async (e) => {
    e.preventDefault();
    if (!monthlyFee || monthlyFee < 0)
      return alert("Please enter a valid amount");

    setUpdatingFee(true);
    try {
      await setDoc(
        doc(db, "admin", "settings"),
        {
          monthlySubscriptionFee: Number(monthlyFee),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );
      alert("Subscription fee updated successfully!");
    } catch (error) {
      console.error("Error updating fee:", error);
      alert("Failed to update fee.");
    } finally {
      setUpdatingFee(false);
    }
  };

  const approveSubscription = async (payment) => {
    if (
      !window.confirm(
        `Approve ${payment.plan?.toUpperCase()} subscription for ${payment.userEmail}?`
      )
    )
      return;

    try {
      const days = payment.plan === "yearly" ? 365 : 30;

      await setDoc(
        doc(db, "subscriptions", payment.userId),
        {
          status: "active",
          type: payment.plan || "monthly",
          expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          approvedAt: serverTimestamp(),
          approvedBy: user.uid,
        },
        { merge: true }
      );

      await updateDoc(doc(db, "pendingPayments", payment.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      alert("Subscription approved successfully!");
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Failed to approve: " + err.message);
    }
  };

  const rejectSubscription = async (paymentId) => {
    if (!window.confirm("Reject this payment?")) return;
    try {
      await updateDoc(doc(db, "pendingPayments", paymentId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
      alert("Payment rejected");
    } catch (err) {
      alert("Failed to reject");
    }
  };

  // Helper to format timestamps safely
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    // Handle Firestore Timestamp or standard Date string
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper to calculate days remaining
  const calculateDaysLeft = (expiresAt) => {
    if (!expiresAt) return 0;
    const expiryDate = expiresAt.toDate
      ? expiresAt.toDate()
      : new Date(expiresAt);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "admin", "settings"));
        if (settingsSnap.exists()) {
          setMonthlyFee(settingsSnap.data().monthlySubscriptionFee || 3000);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();

    // Fetch Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Fetch Pending Payments
    const q = query(
      collection(db, "pendingPayments"),
      where("status", "==", "pending")
    );
    const unsubscribePayments = onSnapshot(q, (snap) => {
      setPendingPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // --- NEW: Fetch All Subscriptions to map to users ---
    const unsubscribeSubs = onSnapshot(
      collection(db, "subscriptions"),
      (snap) => {
        const subsMap = {};
        snap.forEach((doc) => {
          // Map subscription data by User ID (doc.id is the userId based on your setDoc logic)
          subsMap[doc.id] = doc.data();
        });
        setAllSubscriptions(subsMap);
      }
    );

    const fetchCounts = async () => {
      const [r, i, f, t, q, inv, p] = await Promise.all([
        getDocs(collection(db, "receipts")),
        getDocs(collection(db, "invoices")),
        getDocs(collection(db, "financialRecords")),
        getDocs(collection(db, "tasks")),
        getDocs(collection(db, "quotations")),
        getDocs(collection(db, "inventory")),
        getDocs(collection(db, "payrolls")),
      ]);
      setTotalReceipts(r.size);
      setTotalInvoices(i.size);
      setTotalFinancialRecords(f.size);
      setTotalTasks(t.size);
      setTotalQuotations(q.size);
      setTotalInventory(inv.size);
      setTotalPayrolls(p.size);
    };
    fetchCounts();

    return () => {
      unsubscribeUsers();
      unsubscribePayments();
      unsubscribeSubs();
    };
  }, [isAdmin]);

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-25 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Login Modal */}
        {showModal && (
          <div className="fixed inset-0 text-gray-700 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Admin Login
                </h2>
                <button
                  onClick={() => navigate("/")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                  placeholder="admin@higher.com"
                  required
                  autoFocus
                />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                  placeholder="••••••••"
                  required
                />
                {modalError && (
                  <p className="text-red-600 text-sm">{modalError}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5247bf] text-white py-3 rounded-lg font-semibold hover:bg-[#4238a6] disabled:bg-gray-400"
                >
                  {loading ? "Verifying..." : "Login as Admin"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {isAdmin && (
          <>
            <h1 className="text-4xl font-bold text-center text-[#5247bf] mb-10">
              Admin Dashboard
            </h1>

            {/* Subscription Settings */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <button
                onClick={() => toggleSection("settings")}
                className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xl font-bold hover:opacity-90 transition"
              >
                <span className="flex items-center gap-3">
                  <Settings className="w-6 h-6" />
                  Subscription Settings
                </span>
                {sections.settings ? <ChevronUp /> : <ChevronDown />}
              </button>
              {sections.settings && (
                <div className="p-6 text-gray-700">
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Subscription Fee (₦)
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                      />
                      <button
                        onClick={handleUpdateFee}
                        disabled={updatingFee}
                        className="bg-[#5247bf] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4238a6] flex items-center gap-2 disabled:opacity-50"
                      >
                        {updatingFee ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Yearly plan will automatically be calculated as (Monthly
                      Fee × 12).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pending Payment Proofs */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <button
                onClick={() => toggleSection("subscriptions")}
                className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-[#5247bf] to-[#4238a6] text-white text-xl font-bold hover:opacity-90 transition"
              >
                <span className="flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  Pending Payment Proofs ({pendingPayments.length})
                </span>
                {sections.subscriptions ? <ChevronUp /> : <ChevronDown />}
              </button>

              {sections.subscriptions && pendingPayments.length > 0 && (
                <div className="p-6 space-y-6">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row gap-6"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-lg">{payment.userEmail}</p>
                        <p className="text-gray-600">{payment.userName}</p>
                        <p className="text-sm text-gray-500">
                          {payment.requestedAt?.toDate?.().toLocaleString() ||
                            "Just now"}
                        </p>
                        <div className="mt-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              payment.plan === "yearly"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {payment.plan === "yearly" ? "YEARLY" : "MONTHLY"} •
                            ₦{payment.amount}
                          </span>
                        </div>
                        <div className="mt-4">
                          <a
                            href={payment.paymentScreenshot}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#5247bf] hover:underline font-medium"
                          >
                            <Image className="w-5 h-5" />
                            View Payment Proof
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-3 self-start lg:self-center">
                        <button
                          onClick={() => approveSubscription(payment)}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" /> Approve
                        </button>
                        <button
                          onClick={() => rejectSubscription(payment.id)}
                          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                        >
                          <XCircle className="w-5 h-5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sections.subscriptions && pendingPayments.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-lg">
                  No pending payment proofs
                </div>
              )}
            </div>

            {/* Metrics Overview */}
            <div className="bg-white rounded-xl shadow-md">
              <button
                onClick={() => toggleSection("metrics")}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-blue-600"
              >
                <span>Platform Metrics</span>
                {sections.metrics ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>
              {sections.metrics && (
                <div className="p-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* ... (Existing Metric Cards) ... */}
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-xl font-bold text-gray-900">
                        {users.length}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                    <Receipt className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Receipts</p>
                      <p className="text-xl font-bold text-gray-900">
                        {totalReceipts}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Invoices</p>
                      <p className="text-xl font-bold text-gray-900">
                        {totalInvoices}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                    <List className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                      <p className="text-xl font-bold text-gray-900">
                        {totalTasks}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Users Section (UPDATED TABLE) */}
            <div className="bg-white rounded-xl shadow-md">
              <button
                onClick={() => toggleSection("users")}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-blue-600"
              >
                <span>Users ({users.length})</span>
                {sections.users ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>
              {sections.users && (
                <div className="p-4 border-t">
                  {users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-sm font-semibold text-gray-600">
                              Name
                            </th>
                            <th className="p-3 text-sm font-semibold text-gray-600">
                              Email
                            </th>
                            <th className="p-3 text-sm font-semibold text-gray-600">
                              Date Signed Up
                            </th>
                            <th className="p-3 text-sm font-semibold text-gray-600">
                              Subscription
                            </th>
                            <th className="p-3 text-sm font-semibold text-gray-600">
                              Days Left
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => {
                            // Find subscription for this user
                            const sub = allSubscriptions[user.id];
                            const isPro =
                              sub?.status === "active" &&
                              calculateDaysLeft(sub.expiresAt) > 0;
                            const daysLeft = isPro
                              ? calculateDaysLeft(sub.expiresAt)
                              : 0;

                            return (
                              <tr key={user.id} className="border-t">
                                <td className="p-3 text-sm text-gray-900">
                                  {user.name || "N/A"}
                                </td>
                                <td className="p-3 text-sm text-gray-900">
                                  {user.email || "N/A"}
                                </td>
                                <td className="p-3 text-sm text-gray-900 flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  {formatDate(user.createdAt)}
                                </td>
                                <td className="p-3 text-sm">
                                  {isPro ? (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                      <ShieldCheck className="w-3 h-3" /> PRO (
                                      {sub.type === "yearly"
                                        ? "Yearly"
                                        : "Monthly"}
                                      )
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                                      Free Plan
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-sm font-medium">
                                  {isPro ? (
                                    <span
                                      className={`${daysLeft < 5 ? "text-red-500" : "text-gray-900"}`}
                                    >
                                      {daysLeft} days
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No users found.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Experts CTA */}
            <button
              onClick={() => handleExperts()}
              className="w-full flex justify-between cursor-pointer bg-white rounded-lg shadow-md items-center p-4 text-lg font-semibold text-blue-600 hover:bg-gray-50 transition"
            >
              Manage Documents Experts
            </button>
          </>
        )}
      </div>
    </div>
  );
}

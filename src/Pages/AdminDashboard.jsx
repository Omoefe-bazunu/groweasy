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
  serverTimestamp,
  where,
  orderBy,
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
  Settings,
  Save,
  Calendar,
  ShieldCheck,
  Wallet,
  Check,
  Loader2,
  Mail,
  Trash2,
  Copy,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../lib/api"; // ✅ centralized API utility

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
  const [contacts, setContacts] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [referrers, setReferrers] = useState([]);

  // Metrics State
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalFinancialRecords, setTotalFinancialRecords] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [totalInventory, setTotalInventory] = useState(0);
  const [totalPayrolls, setTotalPayrolls] = useState(0);

  // Settings & UI State
  const [monthlyFee, setMonthlyFee] = useState(3000);
  const [updatingFee, setUpdatingFee] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [sections, setSections] = useState({
    users: true,
    subscriptions: true,
    metrics: false,
    settings: true,
    referrals: false,
    messages: false,
  });

  const toggleSection = (section) =>
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate("/login");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleExperts = () => navigate("/admin/add-expert");

  // ── Admin Auth ────────────────────────────────────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setModalError("");
    setLoading(true);

    try {
      await api.post("/admin/login", {
        email: adminEmail.trim(),
        password: adminPassword.trim(),
      });

      // ✅ Success — just open the dashboard
      setIsAdmin(true);
      setShowModal(false);
    } catch (err) {
      setModalError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // ── Settings ──────────────────────────────────────────────────────────────
  const handleUpdateFee = async (e) => {
    e.preventDefault();
    if (!monthlyFee || monthlyFee < 0) return toast.warn("Invalid fee amount");
    setUpdatingFee(true);
    try {
      await setDoc(
        doc(db, "admin", "settings"),
        {
          monthlySubscriptionFee: Number(monthlyFee),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true },
      );
      toast.success("Subscription fee updated");
    } catch {
      toast.error("Failed to update fee");
    } finally {
      setUpdatingFee(false);
    }
  };

  // ── Actions — all use api utility, token attached automatically ───────────

  const approveSubscription = async (payment) => {
    if (!window.confirm(`Approve ${payment.plan} for ${payment.userEmail}?`))
      return;
    setProcessingId(payment.id);
    try {
      await api.post("/admin/approve-payment", {
        paymentId: payment.id,
        userId: payment.userId,
        amount: payment.amount,
        plan: payment.plan,
      });
      toast.success("Subscription approved & commissions paid");
    } catch (err) {
      toast.error(err.message || "Failed to approve payment");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectSubscription = async (paymentId) => {
    if (!window.confirm("Reject this payment? This cannot be undone.")) return;
    setProcessingId(paymentId);
    try {
      await api.post("/admin/reject-payment", { paymentId });
      toast.info("Payment rejected");
    } catch (err) {
      toast.error(err.message || "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithdrawal = async (request) => {
    if (
      !window.confirm(
        `Mark ₦${request.amount.toLocaleString()} as PAID for ${request.userName}?`,
      )
    )
      return;
    setProcessingId(request.id);
    try {
      await api.post("/admin/approve-withdrawal", {
        withdrawalId: request.id,
        userId: request.userId,
        amount: request.amount,
      });
      toast.success("Withdrawal processed successfully");
    } catch (err) {
      toast.error(err.message || "Failed to approve withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    if (
      !window.confirm("Reject this withdrawal request? This cannot be undone.")
    )
      return;
    setProcessingId(withdrawalId);
    try {
      await api.post("/admin/reject-withdrawal", { withdrawalId });
      toast.info("Withdrawal rejected");
    } catch (err) {
      toast.error(err.message || "Failed to reject withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.get("/contact");
      setContacts(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const deleteContact = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this message?",
      )
    )
      return;

    try {
      // Calls DELETE /api/contact/MESSAGE_ID
      await api.delete(`/contact/${id}`);

      // Update local state to remove the message from view immediately
      setContacts((prev) => prev.filter((c) => c.id !== id));

      toast.success("Message deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.error || "Failed to delete message");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Bank details copied!");
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ Works with ISO string (new system) — no more Firestore Timestamp assumed
  const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // ── Data Fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;

    // Settings
    getDoc(doc(db, "admin", "settings")).then((snap) => {
      if (snap.exists())
        setMonthlyFee(snap.data().monthlySubscriptionFee || 3000);
    });

    // Users — ✅ subscription now lives inside the user doc, no separate collection needed
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const userList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(userList);

      // Build referrers list from user docs directly
      const refs = userList
        .filter(
          (u) => u.referralCount > 0 || u.walletBalance > 0 || u.referralCode,
        )
        .sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0));
      setReferrers(refs);
    });

    // Pending payments
    const unsubPayments = onSnapshot(
      query(
        collection(db, "pendingPayments"),
        where("status", "==", "pending"),
      ),
      (snap) =>
        setPendingPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    // Withdrawals
    const unsubWithdrawals = onSnapshot(
      query(collection(db, "withdrawals"), orderBy("requestedAt", "desc")),
      (snap) =>
        setWithdrawalRequests(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ),
    );

    // Metrics
    const fetchCounts = async () => {
      const cols = [
        "receipts",
        "invoices",
        "financialRecords",
        "tasks",
        "quotations",
        "inventory",
        "payrolls",
      ];
      try {
        const snaps = await Promise.all(
          cols.map((c) => getDocs(collection(db, c))),
        );
        setTotalReceipts(snaps[0].size);
        setTotalInvoices(snaps[1].size);
        setTotalFinancialRecords(snaps[2].size);
        setTotalTasks(snaps[3].size);
        setTotalQuotations(snaps[4].size);
        setTotalInventory(snaps[5].size);
        setTotalPayrolls(snaps[6].size);
      } catch (e) {
        console.error("Metrics load failed", e);
      }
    };
    fetchCounts();
    fetchContacts();

    return () => {
      unsubUsers();
      unsubPayments();
      unsubWithdrawals();
    };
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5247bf]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-25 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Login Modal ─────────────────────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 text-gray-700 bg-black/60 flex items-center justify-center z-50 p-4">
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
                  className="w-full bg-[#5247bf] text-white py-3 rounded-lg font-semibold hover:bg-[#4238a6] disabled:bg-gray-400 flex justify-center items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying..." : "Login as Admin"}
                </button>
              </form>
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-center text-[#5247bf] mb-10">
              Admin Dashboard
            </h1>

            {/* ── Referral Management ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-400/20">
              <button
                onClick={() => toggleSection("referrals")}
                className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xl font-bold hover:opacity-90 transition"
              >
                <span className="flex items-center gap-3 text-gray-700">
                  <Wallet className="w-6 h-6" /> Referral Management
                </span>
                {sections.referrals ? <ChevronUp /> : <ChevronDown />}
              </button>

              {sections.referrals && (
                <div className="p-6">
                  {/* Pending Withdrawals */}
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                    Pending Withdrawals
                  </h3>
                  {withdrawalRequests.filter((r) => r.status === "pending")
                    .length === 0 ? (
                    <p className="text-gray-500 italic mb-8">
                      No pending requests.
                    </p>
                  ) : (
                    <div className="space-y-4 mb-8 text-gray-700">
                      {withdrawalRequests
                        .filter((r) => r.status === "pending")
                        .map((req) => (
                          <div
                            key={req.id}
                            className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg"
                          >
                            <div className="flex flex-col lg:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-bold text-gray-800 text-lg">
                                    {req.userName}
                                  </p>
                                  <span className="text-sm text-gray-500">
                                    ({req.email})
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-[#5247bf] mb-3">
                                  ₦{req.amount.toLocaleString()}
                                </p>
                                <div className="flex items-start gap-2 bg-white border border-gray-300 p-3 rounded-lg max-w-md mb-2">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">
                                      Bank Details
                                    </p>
                                    <p className="text-gray-800 font-medium whitespace-pre-line">
                                      {req.bankDetails || "No details provided"}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(req.bankDetails)
                                    }
                                    className="p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded transition"
                                    title="Copy Bank Details"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-400">
                                  Requested:{" "}
                                  {req.requestedAt?.toDate?.().toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-2 self-start lg:self-center">
                                <button
                                  onClick={() => handleApproveWithdrawal(req)}
                                  disabled={processingId === req.id}
                                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400 font-bold shadow-md transition"
                                >
                                  {processingId === req.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Check className="w-5 h-5" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(req.id)}
                                  disabled={processingId === req.id}
                                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:bg-gray-400 font-bold shadow-md transition"
                                >
                                  {processingId === req.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-5 h-5" />
                                  )}
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Withdrawal History */}
                  {withdrawalRequests.filter((r) => r.status !== "pending")
                    .length > 0 && (
                    <>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 mt-8">
                        Withdrawal History
                      </h3>
                      <div className="space-y-3 mb-8">
                        {withdrawalRequests
                          .filter((r) => r.status !== "pending")
                          .slice(0, 10)
                          .map((req) => (
                            <div
                              key={req.id}
                              className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  {req.userName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ₦{req.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatDate(
                                    req.processedAt || req.rejectedAt,
                                  )}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  req.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {req.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </>
                  )}

                  {/* Top Referrers */}
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                    Top Referrers
                  </h3>
                  <div className="overflow-x-auto text-gray-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3">User</th>
                          <th className="p-3">Code</th>
                          <th className="p-3">Total Referrals</th>
                          <th className="p-3">Wallet Bal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrers.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-800 font-medium">
                              {u.name}
                              <br />
                              <span className="text-xs text-gray-500">
                                {u.email}
                              </span>
                            </td>
                            <td className="p-3">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {u.referralCode}
                              </code>
                            </td>
                            <td className="p-3 font-bold">
                              {u.referralCount || 0}
                            </td>
                            <td className="p-3 font-bold text-green-600">
                              ₦{(u.walletBalance || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {referrers.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="p-4 text-center text-gray-500"
                            >
                              No active referrers found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ── Subscription Settings ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-gray-700">
              <button
                onClick={() => toggleSection("settings")}
                className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xl font-bold hover:opacity-90 transition"
              >
                <span className="flex items-center gap-3">
                  <Settings className="w-6 h-6" /> Subscription Settings
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
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Yearly plan is automatically calculated as Monthly Fee ×
                      12.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Pending Payment Proofs ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-gray-700">
              <button
                onClick={() => toggleSection("subscriptions")}
                className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-[#5247bf] to-[#4238a6] text-white text-xl font-bold hover:opacity-90 transition"
              >
                <span className="flex items-center gap-3">
                  <Clock className="w-6 h-6" /> Pending Payment Proofs (
                  {pendingPayments.length})
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
                            <Image className="w-5 h-5" /> View Payment Proof
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-3 self-start lg:self-center">
                        <button
                          onClick={() => approveSubscription(payment)}
                          disabled={processingId === payment.id}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:bg-gray-400"
                        >
                          {processingId === payment.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => rejectSubscription(payment.id)}
                          disabled={processingId === payment.id}
                          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:bg-gray-400"
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
            {/* ── Contact Messages ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-400/20">
              <button
                onClick={() => toggleSection("messages")}
                className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xl font-bold hover:opacity-90 transition"
              >
                <span className="flex items-center gap-3">
                  <Mail className="w-6 h-6" /> User Messages ({contacts.length})
                </span>
                {sections.messages ? <ChevronUp /> : <ChevronDown />}
              </button>

              {sections.messages && (
                <div className="p-6">
                  {contacts.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">
                      No messages received yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map((msg) => (
                        <div
                          key={msg.id}
                          className="bg-gray-50 border border-gray-200 p-5 rounded-xl hover:border-indigo-300 transition shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                {msg.name}
                              </h4>
                              <p className="text-sm text-[#5247bf] font-medium">
                                {msg.email}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs text-gray-400">
                                {new Date(msg.createdAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => deleteContact(msg.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-line text-sm">
                            {msg.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Platform Metrics ──────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-md text-gray-700">
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
                  {[
                    { label: "Users", value: users.length, icon: Users },
                    { label: "Receipts", value: totalReceipts, icon: Receipt },
                    { label: "Invoices", value: totalInvoices, icon: FileText },
                    { label: "Tasks", value: totalTasks, icon: List },
                    {
                      label: "Quotations",
                      value: totalQuotations,
                      icon: FileText,
                    },
                    {
                      label: "Inventory",
                      value: totalInventory,
                      icon: FileText,
                    },
                    { label: "Payrolls", value: totalPayrolls, icon: FileText },
                    {
                      label: "Financial Records",
                      value: totalFinancialRecords,
                      icon: FileText,
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-50 rounded-lg flex items-center gap-3"
                    >
                      <m.icon className="text-blue-600 w-5 h-5" />
                      <div>
                        <p className="text-sm text-gray-500">{m.label}</p>
                        <p className="font-bold text-gray-900">{m.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Users Table ───────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-md text-gray-700">
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
                            {[
                              "Name",
                              "Email",
                              "Phone",
                              "Signed Up",
                              "Subscription",
                              "Days Left",
                            ].map((h) => (
                              <th
                                key={h}
                                className="p-3 text-sm font-semibold text-gray-600"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => {
                            // ✅ Read subscription from user doc directly — new system
                            const sub = u.subscription;
                            const isPro =
                              sub?.status === "active" &&
                              calculateDaysLeft(sub.expiryDate) > 0;
                            const daysLeft = isPro
                              ? calculateDaysLeft(sub.expiryDate)
                              : 0;

                            return (
                              <tr
                                key={u.id}
                                className="border-t hover:bg-gray-50"
                              >
                                <td className="p-3 text-sm">
                                  {u.name || "N/A"}
                                </td>
                                <td className="p-3 text-sm">
                                  {u.email || "N/A"}
                                </td>
                                <td className="p-3 text-sm">
                                  {u.phoneNumber || "N/A"}
                                </td>
                                <td className="p-3 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {formatDate(u.createdAt)}
                                  </span>
                                </td>
                                <td className="p-3 text-sm">
                                  {isPro ? (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                      <ShieldCheck className="w-3 h-3" />
                                      {/* ✅ reads sub.plan not sub.type */}
                                      PRO ({sub.plan || "Monthly"})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                                      {sub?.status === "trial"
                                        ? "Trial"
                                        : "Free"}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-sm font-medium">
                                  {isPro ? (
                                    <span
                                      className={
                                        daysLeft < 5
                                          ? "text-red-500"
                                          : "text-gray-900"
                                      }
                                    >
                                      {daysLeft} days
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
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

            <button
              onClick={handleExperts}
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

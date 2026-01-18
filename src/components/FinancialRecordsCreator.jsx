import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { useSubscription } from "../context/SubscriptionContext";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  Lock,
  LockIcon,
} from "lucide-react";

const COLLECTION_NAME = "financialRecords";

const FinancialRecordsCreator = () => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [records, setRecords] = useState([]);
  const [groupedRecords, setGroupedRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    details: "",
    inflow: "",
    outflow: "",
    paymentMethod: "Cash",
  });

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  useEffect(() => {
    groupRecordsByWeek();
  }, [records]);

  // --- NEW GROUPING LOGIC START ---
  // Helper: Get the Monday of the week for any given date
  const getStartOfWeek = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    // Calculate difference to get to Monday.
    // If Sunday (0), subtract 6 days. If Mon (1), subtract 0. If Tue (2), subtract 1...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Helper: Generate a readable label (e.g., "Dec 1 - Dec 7")
  const getWeekRangeLabel = (mondayDateString) => {
    const start = new Date(mondayDateString);
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Add 6 days to get Sunday

    const options = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString(
      "en-US",
      options
    )}`;
  };

  const groupRecordsByWeek = () => {
    const grouped = {};
    let runningBalance = 0;

    // Sort by Date Ascending first to calculate running balance correctly
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sortedRecords.forEach((record) => {
      // Get the Monday of this record's week as the unique Key
      const startOfWeek = getStartOfWeek(record.date);
      // Use ISO string (YYYY-MM-DD) of that Monday as the key
      const weekKey = startOfWeek.toISOString().split("T")[0];

      if (!grouped[weekKey]) {
        grouped[weekKey] = {
          records: [],
          totalInflow: 0,
          totalOutflow: 0,
          startingBalance: runningBalance,
          dateLabel: getWeekRangeLabel(weekKey), // Store the readable label
        };
      }

      const inflow = parseFloat(record.inflow) || 0;
      const outflow = parseFloat(record.outflow) || 0;
      runningBalance += inflow - outflow;

      grouped[weekKey].records.push({ ...record, balance: runningBalance });
      grouped[weekKey].totalInflow += inflow;
      grouped[weekKey].totalOutflow += outflow;
      grouped[weekKey].endingBalance = runningBalance;
    });

    setGroupedRecords(grouped);
  };
  // --- NEW GROUPING LOGIC END ---

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(recordsData);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.details || !formData.paymentMethod) {
      toast.error("Date, details, and payment method are required");
      return;
    }

    if (!formData.inflow && !formData.outflow) {
      toast.error("Please enter either inflow or outflow");
      return;
    }

    try {
      const recordData = {
        userId: user.uid,
        date: formData.date,
        details: formData.details,
        inflow: parseFloat(formData.inflow) || 0,
        outflow: parseFloat(formData.outflow) || 0,
        paymentMethod: formData.paymentMethod,
        // We don't need to save weekId anymore as we calculate it dynamically
        createdAt: serverTimestamp(),
      };

      if (editingRecord) {
        await updateDoc(doc(db, COLLECTION_NAME, editingRecord.id), recordData);
        toast.success("Record updated successfully");
      } else {
        await addDoc(collection(db, COLLECTION_NAME), recordData);
        toast.success("Record added successfully");
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        details: "",
        inflow: "",
        outflow: "",
        paymentMethod: "Cash",
      });
      fetchRecords();
      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error("Failed to save record");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      details: record.details,
      inflow: record.inflow || "",
      outflow: record.outflow || "",
      paymentMethod: record.paymentMethod || "Cash",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (recordId) => {
    // --- UPDATED: Prevent delete if not paid ---
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }

    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, recordId));
      toast.success("Record deleted successfully");
      fetchRecords();
      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const openCreateModal = async () => {
    const allowed = await canWriteTo(COLLECTION_NAME);
    if (!allowed) {
      setShowLimitModal(true);
    } else {
      setEditingRecord(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        details: "",
        inflow: "",
        outflow: "",
        paymentMethod: "Cash",
      });
      setIsModalOpen(true);
    }
  };

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
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
    <>
      <div className="min-h-screen bg-gray-50 text-gray-600 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Financial Records
              </h1>
              <p className="text-gray-600 mt-1">
                Track your income and expenses
                {!isPaid && limitStatus.current > 0 && (
                  <span className="ml-3 text-sm font-medium">
                    • {limitStatus.current}/{limitStatus.limit} free records
                    used
                  </span>
                )}
              </p>
            </div>
            <div className="relative group">
              <button
                onClick={openCreateModal}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  limitStatus.reached && !isPaid
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#5247bf] hover:bg-[#4238a6] text-white"
                }`}
                disabled={limitStatus.reached && !isPaid}
              >
                {limitStatus.reached && !isPaid ? (
                  <>
                    <LockIcon className="w-5 h-5" />
                    Upgrade to Continue
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Record
                  </>
                )}
              </button>
            </div>
          </div>

          {Object.keys(groupedRecords).length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No records yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start tracking your finances by adding your first record
              </p>
              <button
                onClick={openCreateModal}
                className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
              >
                Add Your First Record
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRecords)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort weeks descending (newest first)
                .map(([weekKey, weekData]) => {
                  const netBalance =
                    weekData.totalInflow - weekData.totalOutflow;
                  const isProfit = netBalance >= 0;

                  return (
                    <div
                      key={weekKey}
                      className="bg-white rounded-xl shadow-md overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-lg md:text-xl font-bold text-white">
                              {/* Display the calculated label (Dec 1 - Dec 7) */}
                              {weekData.dateLabel}
                            </h3>
                            <p className="text-white/80 text-sm">
                              Weekly Overview
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <div className="bg-green-500 backdrop-blur rounded-lg p-3">
                              <p className="text-white text-xs mb-1">Inflow</p>
                              <p className="text-white font-bold text-sm md:text-base">
                                ₦
                                {formatCurrency(
                                  weekData.totalInflow.toFixed(2)
                                )}
                              </p>
                            </div>
                            <div className="bg-red-500 backdrop-blur rounded-lg p-3">
                              <p className="text-white text-xs mb-1">Outflow</p>
                              <p className="text-white font-bold text-sm md:text-base">
                                ₦
                                {formatCurrency(
                                  weekData.totalOutflow.toFixed(2)
                                )}
                              </p>
                            </div>
                            <div
                              className={`backdrop-blur rounded-lg p-3 ${
                                isProfit ? "bg-green-500/70" : "bg-red-600/70"
                              }`}
                            >
                              <p className="text-white text-xs mb-1 flex items-center gap-1">
                                Net{" "}
                                {isProfit ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                              </p>
                              <p className="font-bold text-sm md:text-base text-white">
                                ₦
                                {formatCurrency(
                                  Math.abs(netBalance).toFixed(2)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-left font-semibold text-gray-700 min-w-[100px]">
                                Date
                              </th>
                              <th className="p-3 text-left font-semibold text-gray-700 min-w-[200px]">
                                Details
                              </th>
                              <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                                Inflow
                              </th>
                              <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                                Outflow
                              </th>
                              <th className="p-3 text-left font-semibold text-gray-700 min-w-[100px]">
                                Method
                              </th>
                              <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                                Balance
                              </th>
                              <th className="p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {weekData.records
                              .sort(
                                (a, b) => new Date(b.date) - new Date(a.date)
                              )
                              .map((record) => (
                                <tr
                                  key={record.id}
                                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                  <td className="p-3 text-gray-700">
                                    {new Date(record.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-3 text-gray-700">
                                    {record.details}
                                  </td>
                                  <td className="p-3 text-right text-green-600 font-semibold">
                                    {record.inflow
                                      ? `₦${formatCurrency(
                                          record.inflow.toFixed(2)
                                        )}`
                                      : "-"}
                                  </td>
                                  <td className="p-3 text-right text-red-600 font-semibold">
                                    {record.outflow
                                      ? `₦${formatCurrency(
                                          record.outflow.toFixed(2)
                                        )}`
                                      : "-"}
                                  </td>
                                  <td className="p-3 text-gray-700">
                                    {record.paymentMethod}
                                  </td>
                                  <td className="p-3 text-right font-bold text-gray-900">
                                    ₦{formatCurrency(record.balance.toFixed(2))}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleEdit(record)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>

                                      {/* --- UPDATED DELETE BUTTON --- */}
                                      <button
                                        onClick={() => handleDelete(record.id)}
                                        disabled={!isPaid}
                                        title={
                                          !isPaid
                                            ? "Upgrade to delete items"
                                            : "Delete"
                                        }
                                        className={`px-4 py-2 rounded transition flex items-center justify-center ${
                                          !isPaid
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-red-600 text-white hover:bg-red-800"
                                        }`}
                                      >
                                        {!isPaid ? (
                                          <Lock className="w-3 h-3" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Create/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingRecord ? "Edit Record" : "Add Record"}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Details *
                    </label>
                    <textarea
                      name="details"
                      value={formData.details}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                      rows="3"
                      placeholder="e.g., Client payment for Project X"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inflow (+)
                      </label>
                      <input
                        type="number"
                        name="inflow"
                        value={formData.inflow}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outflow (-)
                      </label>
                      <input
                        type="number"
                        name="outflow"
                        value={formData.outflow}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-[#5247bf] text-white rounded-lg hover:bg-[#4238a6] transition-colors font-medium"
                    >
                      {editingRecord ? "Update" : "Add"} Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Limit Reached Modal */}
          {showLimitModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Feature Locked
                </h3>
                <p className="text-gray-600 mb-8">
                  Deleting records is available for <strong>Pro</strong> users
                  only. Upgrade now to manage your records freely.
                </p>
                <button
                  onClick={() => (window.location.href = "/subscribe")}
                  className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-semibold hover:bg-[#4238a6] transition"
                >
                  Subscribe Now
                </button>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full mt-3 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FinancialRecordsCreator;

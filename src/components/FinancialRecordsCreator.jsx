import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
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
// ✅ Import Currency selection tools
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

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
    // ✅ Default to Naira
    currency: SUPPORTED_CURRENCIES[0],
  });

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus("financialRecords").then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  useEffect(() => {
    groupRecordsByWeek();
  }, [records]);

  // Helper: Get the Monday of the week for any given date
  const getStartOfWeek = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Helper: Generate a readable label (e.g., "Dec 1 - Dec 7")
  const getWeekRangeLabel = (mondayDateString) => {
    const start = new Date(mondayDateString);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const options = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
  };

  const groupRecordsByWeek = () => {
    const grouped = {};
    let runningBalance = 0;

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    sortedRecords.forEach((record) => {
      const startOfWeek = getStartOfWeek(record.date);
      const weekKey = startOfWeek.toISOString().split("T")[0];

      if (!grouped[weekKey]) {
        grouped[weekKey] = {
          records: [],
          totalInflow: 0,
          totalOutflow: 0,
          startingBalance: runningBalance,
          dateLabel: getWeekRangeLabel(weekKey),
          currency: record.currency || SUPPORTED_CURRENCIES[0],
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

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get("/financial-records");
      setRecords(res.data.records);
    } catch (err) {
      console.error("Error fetching records:", err);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
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
      const payload = {
        date: formData.date,
        details: formData.details,
        inflow: parseFloat(formData.inflow) || 0,
        outflow: parseFloat(formData.outflow) || 0,
        paymentMethod: formData.paymentMethod,
        currency: formData.currency,
      };

      if (editingRecord) {
        await api.put(`/financial-records/${editingRecord.id}`, payload);
        toast.success("Record updated successfully");
      } else {
        await api.post("/financial-records", payload);
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
        currency: SUPPORTED_CURRENCIES[0],
      });
      fetchRecords();
      if (!isPaid) getLimitStatus("financialRecords").then(setLimitStatus);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save record");
      }
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
      currency: record.currency || SUPPORTED_CURRENCIES[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (recordId) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }

    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await api.delete(`/financial-records/${recordId}`);
      toast.success("Record deleted successfully");
      fetchRecords();
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to delete record");
      }
    }
  };

  const openCreateModal = async () => {
    const allowed = await canWriteTo("financialRecords");
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
        currency: SUPPORTED_CURRENCIES[0],
      });
      setIsModalOpen(true);
    }
  };

  const formatCurrency = (value, currencyObj) => {
    const curr = currencyObj || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
    }).format(parseFloat(value || 0));
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
              <p className="text-gray-600 mt-1 font-medium">
                Track your income and expenses
                {!isPaid && limitStatus.current > 0 && (
                  <span className="ml-3 text-sm font-bold text-[#5247bf]">
                    • {limitStatus.current}/{limitStatus.limit} free records
                    used
                  </span>
                )}
              </p>
            </div>
            <div className="relative group">
              <button
                onClick={openCreateModal}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
                  limitStatus.reached && !isPaid
                    ? "bg-gray-400 cursor-not-allowed text-white"
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
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No records yet
              </h3>
              <p className="text-gray-600 mb-6 font-medium">
                Start tracking your finances by adding your first record
              </p>
              <button
                onClick={openCreateModal}
                className="bg-[#5247bf] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4238a6] transition-colors"
              >
                Add Your First Record
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRecords)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([weekKey, weekData]) => {
                  const netBalance =
                    weekData.totalInflow - weekData.totalOutflow;
                  const isProfit = netBalance >= 0;

                  return (
                    <div
                      key={weekKey}
                      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
                    >
                      <div className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-lg md:text-xl font-black text-white">
                              {weekData.dateLabel}
                            </h3>
                            <p className="text-white/90 text-sm font-bold">
                              Weekly Summary
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            <div className="bg-green-500/90 backdrop-blur-sm rounded-lg p-3 border border-green-400">
                              <p className="text-white text-xs font-black uppercase mb-1">
                                Inflow
                              </p>
                              <p className="text-white font-black text-sm md:text-base">
                                {formatCurrency(
                                  weekData.totalInflow,
                                  weekData.currency,
                                )}
                              </p>
                            </div>
                            <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3 border border-red-400">
                              <p className="text-white text-xs font-black uppercase mb-1">
                                Outflow
                              </p>
                              <p className="text-white font-black text-sm md:text-base">
                                {formatCurrency(
                                  weekData.totalOutflow,
                                  weekData.currency,
                                )}
                              </p>
                            </div>
                            <div
                              className={`backdrop-blur-sm rounded-lg p-3 border ${
                                isProfit
                                  ? "bg-green-600 border-green-500"
                                  : "bg-red-700 border-red-600"
                              }`}
                            >
                              <p className="text-white text-xs font-black uppercase mb-1 flex items-center gap-1">
                                Net {isProfit ? "Profit" : "Deficit"}
                              </p>
                              <p className="font-black text-sm md:text-base text-white">
                                {formatCurrency(
                                  Math.abs(netBalance),
                                  weekData.currency,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="p-3 text-left font-black text-gray-700 min-w-[100px]">
                                Date
                              </th>
                              <th className="p-3 text-left font-black text-gray-700 min-w-[200px]">
                                Details
                              </th>
                              <th className="p-3 text-right font-black text-gray-700 min-w-[120px]">
                                Inflow
                              </th>
                              <th className="p-3 text-right font-black text-gray-700 min-w-[120px]">
                                Outflow
                              </th>
                              <th className="p-3 text-left font-black text-gray-700 min-w-[100px]">
                                Method
                              </th>
                              <th className="p-3 text-right font-black text-gray-700 min-w-[140px]">
                                Balance
                              </th>
                              <th className="p-3 text-center font-black text-gray-700 min-w-[100px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {weekData.records
                              .sort(
                                (a, b) => new Date(b.date) - new Date(a.date),
                              )
                              .map((record) => (
                                <tr
                                  key={record.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="p-3 text-gray-900 font-medium">
                                    {new Date(record.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-3 text-gray-900 font-medium">
                                    {record.details}
                                  </td>
                                  <td className="p-3 text-right text-green-700 font-black">
                                    {record.inflow > 0
                                      ? formatCurrency(
                                          record.inflow,
                                          record.currency,
                                        )
                                      : "—"}
                                  </td>
                                  <td className="p-3 text-right text-red-700 font-black">
                                    {record.outflow > 0
                                      ? formatCurrency(
                                          record.outflow,
                                          record.currency,
                                        )
                                      : "—"}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-bold uppercase">
                                      {record.paymentMethod}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-black text-gray-900">
                                    {formatCurrency(
                                      record.balance,
                                      record.currency,
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleEdit(record)}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-800 transition"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(record.id)}
                                        disabled={!isPaid}
                                        className={`p-2 rounded-lg transition ${
                                          !isPaid
                                            ? "bg-gray-100 text-gray-400"
                                            : "bg-red-600 text-white hover:bg-red-800"
                                        }`}
                                      >
                                        {!isPaid ? (
                                          <Lock className="w-3.5 h-3.5" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
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

          {/* ── Add/Edit Modal (Device-Safe Fixed Version) ── */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100 max-h-[90dvh] flex flex-col">
                {/* Header - Stays at top */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl shrink-0">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingRecord ? "Edit Record" : "Add Record"}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Body - Everything below scrolls, including the buttons */}
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] outline-none text-gray-900"
                          required
                        />
                      </div>
                      <CurrencySelector
                        selectedCurrency={
                          formData.currency || SUPPORTED_CURRENCIES[0]
                        }
                        onCurrencyChange={handleCurrencyChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Details *
                      </label>
                      <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] outline-none text-gray-900"
                        rows="3"
                        placeholder="e.g., Client payment for Project X"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] outline-none text-gray-900 font-bold"
                        required
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Inflow (+)
                        </label>
                        <input
                          type="number"
                          name="inflow"
                          value={formData.inflow}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] outline-none text-gray-900 font-black"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Outflow (-)
                        </label>
                        <input
                          type="number"
                          name="outflow"
                          value={formData.outflow}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] outline-none text-gray-900 font-black"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* ✅ CTAs are now strictly inside the scroll flow with bottom padding */}
                    <div className="flex gap-3 pt-6 pb-10">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-bold text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-[#5247bf] text-white rounded-lg hover:bg-[#4238a6] transition-colors font-bold shadow-md"
                      >
                        {editingRecord ? "Update" : "Add"} Record
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showLimitModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
                <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-gray-900 mb-3">
                  Feature Locked
                </h3>
                <p className="text-gray-700 mb-8 font-medium">
                  Upgrade to Pro to manage unlimited financial records and keep
                  your business bookkeeping organized.
                </p>
                <button
                  onClick={() => (window.location.href = "/subscribe")}
                  className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-black hover:bg-[#4238a6] transition shadow-lg"
                >
                  Subscribe Now
                </button>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full mt-3 text-gray-500 font-bold hover:text-gray-700"
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

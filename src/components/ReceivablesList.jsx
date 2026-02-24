import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import {
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Save,
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";

const ReceivablesList = () => {
  const { user } = useUser();
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingReceivable, setEditingReceivable] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isPaid } = useSubscription();

  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    address: "",
    details: "",
    totalAmountOwed: "",
    payments: [],
  });

  useEffect(() => {
    if (user) fetchReceivables();
  }, [user]);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const res = await api.get("/receivables");
      setReceivables(res.data.receivables || []);
    } catch (err) {
      console.error("Failed to fetch receivables:", err);
      toast.error("Failed to load receivables");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receivable?"))
      return;
    try {
      await api.delete(`/receivables/${id}`);
      toast.success("Receivable deleted");
      fetchReceivables();
    } catch (err) {
      toast.error("Failed to delete receivable");
    }
  };

  const openEditModal = (receivable) => {
    setEditingReceivable(receivable);
    setFormData({
      customerName: receivable.customerName,
      phoneNumber: receivable.phoneNumber,
      address: receivable.address || "",
      details: receivable.details,
      totalAmountOwed: receivable.totalAmountOwed,
      payments: receivable.payments || [],
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (index, field, value) => {
    const updated = [...formData.payments];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, payments: updated }));
  };

  const addPayment = () => {
    setFormData((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        { amount: "", date: new Date().toISOString().split("T")[0], note: "" },
      ],
    }));
  };

  const removePayment = (index) => {
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/receivables/${editingReceivable.id}`, formData);
      toast.success("Receivable updated successfully");
      setIsEditModalOpen(false);
      fetchReceivables();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update receivable");
    }
  };

  const totalPaid = formData.payments
    .filter((p) => p.amount && !isNaN(Number(p.amount)))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = (Number(formData.totalAmountOwed) || 0) - totalPaid;

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

  const owingReceivables = receivables.filter((r) => r.status === "owing");
  const clearedReceivables = receivables.filter((r) => r.status === "cleared");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Receivables
          </h1>
          <p className="text-gray-600 mt-1 font-medium">
            Track amounts owed by customers
          </p>
        </div>

        {receivables.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No receivables yet
            </h3>
            <p className="text-gray-600">
              Start tracking money owed to your business
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Total Receivables
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {receivables.length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Outstanding
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  ₦
                  {owingReceivables
                    .reduce((sum, r) => sum + r.balance, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Cleared
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {clearedReceivables.length}
                </p>
              </div>
            </div>

            {/* Outstanding Section */}
            {owingReceivables.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Outstanding ({owingReceivables.length})
                </h2>
                <div className="space-y-3">
                  {owingReceivables.map((rec) => (
                    <ReceivableCard
                      key={rec.id}
                      receivable={rec}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cleared Section */}
            {clearedReceivables.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Cleared ({clearedReceivables.length})
                </h2>
                <div className="space-y-3">
                  {clearedReceivables.map((rec) => (
                    <ReceivableCard
                      key={rec.id}
                      receivable={rec}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ✅ FIXED EDIT MODAL: Added scrollable container and safe margins */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 md:p-8">
            <div className="flex min-h-full items-center justify-center">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all border border-gray-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    Edit Receivable
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleUpdate} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-[#5247bf] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-[#5247bf] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-[#5247bf] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">
                      Details *
                    </label>
                    <textarea
                      name="details"
                      value={formData.details}
                      onChange={handleInputChange}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#5247bf] outline-none"
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">
                      Total Amount Owed (₦) *
                    </label>
                    <input
                      type="number"
                      name="totalAmountOwed"
                      value={formData.totalAmountOwed}
                      onChange={handleInputChange}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 focus:ring-2 focus:ring-[#5247bf] outline-none"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Payments History List */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Payments History
                      </label>
                      <button
                        type="button"
                        onClick={addPayment}
                        className="text-xs flex items-center gap-1 bg-[#5247bf]/10 text-[#5247bf] px-3 py-1.5 rounded-lg font-black uppercase transition hover:bg-[#5247bf] hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Payment
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.payments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Amt"
                              value={payment.amount}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "amount",
                                  e.target.value,
                                )
                              }
                              className="w-1/2 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-1 focus:ring-[#5247bf] outline-none"
                              step="0.01"
                            />
                            <input
                              type="date"
                              value={payment.date}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "date",
                                  e.target.value,
                                )
                              }
                              className="w-1/2 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-[#5247bf] outline-none"
                            />
                            {formData.payments.length > 0 && (
                              <button
                                type="button"
                                onClick={() => removePayment(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Note"
                            value={payment.note}
                            onChange={(e) =>
                              handlePaymentChange(index, "note", e.target.value)
                            }
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#5247bf] outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-inner">
                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                      <span>Total Debt:</span>
                      <span>
                        ₦
                        {(
                          Number(formData.totalAmountOwed) || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase text-green-400 mb-4">
                      <span>Total Paid:</span>
                      <span>₦{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-4">
                      <span className="font-black uppercase tracking-tighter text-lg">
                        Remaining:
                      </span>
                      <span
                        className={`text-2xl font-black ${balance > 0 ? "text-red-400" : "text-green-400"}`}
                      >
                        ₦{balance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-4 pt-4 pb-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-4 bg-[#5247bf] text-white rounded-2xl font-black shadow-lg hover:bg-[#4238a6] transition flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Receivable Card Component (Helper)
const ReceivableCard = ({
  receivable,
  expandedId,
  setExpandedId,
  onEdit,
  onDelete,
}) => {
  const isExpanded = expandedId === receivable.id;
  const isOwing = receivable.status === "owing";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${isOwing ? "border-red-200" : "border-green-200"} overflow-hidden`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <h3 className="font-bold text-lg text-gray-900">
                {receivable.customerName}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isOwing ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
              >
                {isOwing ? "OWING" : "CLEARED"}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                {receivable.phoneNumber}
              </div>
              {receivable.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {receivable.address}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
              Balance
            </p>
            <p
              className={`text-2xl font-black ${isOwing ? "text-red-600" : "text-green-600"}`}
            >
              ₦{receivable.balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Details
          </p>
          <p className="text-sm text-gray-700 font-medium">
            {receivable.details}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpandedId(isExpanded ? null : receivable.id)}
            className="text-xs text-[#5247bf] font-black uppercase tracking-widest flex items-center gap-1 hover:text-[#4238a6]"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {isExpanded ? "Hide" : "Show"} History
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(receivable)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDelete(receivable.id)}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">
                  Total Owed
                </p>
                <p className="font-black text-gray-900">
                  ₦{receivable.totalAmountOwed.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-[10px] font-black text-green-400 uppercase mb-1 tracking-tighter">
                  Total Paid
                </p>
                <p className="font-black text-green-700">
                  ₦{receivable.totalPaid.toLocaleString()}
                </p>
              </div>
            </div>

            {receivable.payments && receivable.payments.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Installments
                </p>
                <div className="space-y-2">
                  {receivable.payments.map((payment, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex justify-between items-center"
                    >
                      <div>
                        <p className="font-black text-gray-900">
                          ₦{Number(payment.amount).toLocaleString()}
                        </p>
                        {payment.note && (
                          <p className="text-xs text-gray-500 font-medium italic">
                            {payment.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivablesList;

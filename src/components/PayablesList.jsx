import React, { useState, useEffect, Fragment } from "react";
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
  X,
  Plus,
  Save,
  ShoppingCart,
} from "lucide-react";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const PayablesList = () => {
  const { user } = useUser();
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingPayable, setEditingPayable] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    vendorName: "",
    phoneNumber: "",
    address: "",
    details: "",
    totalAmountOwed: "",
    currency: SUPPORTED_CURRENCIES[0],
    payments: [],
  });

  useEffect(() => {
    if (user) fetchPayables();
  }, [user]);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payables");
      setPayables(res.data.payables || []);
    } catch (err) {
      console.error("Failed to fetch payables:", err);
      toast.error("Failed to load payables");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entire debt record?")) return;
    try {
      await api.delete(`/payables/${id}`);
      toast.success("Payable deleted");
      fetchPayables();
    } catch (err) {
      toast.error("Failed to delete payable");
    }
  };

  const openEditModal = (payable) => {
    setEditingPayable(payable);
    setFormData({
      vendorName: payable.vendorName,
      phoneNumber: payable.phoneNumber,
      address: payable.address || "",
      details: payable.details,
      totalAmountOwed: payable.totalAmountOwed,
      currency: payable.currency || SUPPORTED_CURRENCIES[0],
      payments: payable.payments || [],
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
      await api.put(`/payables/${editingPayable.id}`, formData);
      toast.success("Payable updated successfully");
      setIsEditModalOpen(false);
      fetchPayables();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update payable");
    }
  };

  const formatCurrency = (val, curr) => {
    const activeCurr = curr || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(activeCurr.locale, {
      style: "currency",
      currency: activeCurr.code,
    }).format(parseFloat(val || 0));
  };

  const totalPaid = formData.payments
    .filter((p) => p.amount && !isNaN(Number(p.amount)))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = (Number(formData.totalAmountOwed) || 0) - totalPaid;

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-red-600 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-red-600 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-red-600 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  const owingPayables = payables.filter((p) => p.status === "owing");
  const clearedPayables = payables.filter((p) => p.status === "cleared");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Total Payables
            </p>
            <p className="text-3xl font-black text-gray-900">
              {payables.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-100">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">
              Amount We Owe
            </p>
            <p className="text-3xl font-black text-red-600">
              {formatCurrency(
                owingPayables.reduce((sum, p) => sum + p.balance, 0),
                payables[0]?.currency,
              )}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">
              Cleared Records
            </p>
            <p className="text-3xl font-black text-green-600">
              {clearedPayables.length}
            </p>
          </div>
        </div>

        {payables.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-16 text-center border border-gray-200">
            <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">
              No Payables Recorded
            </h3>
            <p className="text-gray-500 font-medium">
              Keep track of your vendor debts and payments here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Outstanding */}
            {owingPayables.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" /> Outstanding
                  Debts ({owingPayables.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {owingPayables.map((p) => (
                    <PayableCard
                      key={p.id}
                      payable={p}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Cleared */}
            {clearedPayables.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" /> Cleared (
                  {clearedPayables.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 opacity-75">
                  {clearedPayables.map((p) => (
                    <PayableCard
                      key={p.id}
                      payable={p}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ✅ FIXED EDIT MODAL: Scrollable and Centered */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 md:p-8">
            <div className="flex min-h-full items-center justify-center">
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900 uppercase">
                    Edit Payable Record
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 transition"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Vendor Name
                      </label>
                      <input
                        type="text"
                        name="vendorName"
                        value={formData.vendorName}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-gray-50 border rounded-2xl font-bold focus:ring-2 focus:ring-red-600 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-gray-50 border rounded-2xl font-bold focus:ring-2 focus:ring-red-600 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Total Debt Amount
                    </label>
                    <input
                      type="number"
                      name="totalAmountOwed"
                      value={formData.totalAmountOwed}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-gray-50 border rounded-2xl font-black text-red-600 focus:ring-2 focus:ring-red-600 outline-none text-xl"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Installment History
                      </label>
                      <button
                        type="button"
                        onClick={addPayment}
                        className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        + Add Row
                      </button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {formData.payments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100"
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
                              className="w-1/2 p-2 bg-white border rounded-xl font-bold outline-none"
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
                              className="w-1/2 p-2 bg-white border rounded-xl font-bold outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removePayment(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Note (e.g. Bank Transfer)"
                            value={payment.note}
                            onChange={(e) =>
                              handlePaymentChange(index, "note", e.target.value)
                            }
                            className="w-full p-2 bg-white border rounded-xl text-xs font-medium outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-3xl p-6 text-white text-center shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Calculated Balance Due
                    </p>
                    <p
                      className={`text-3xl font-black mt-1 ${balance > 0 ? "text-red-400" : "text-green-400"}`}
                    >
                      {formatCurrency(balance, formData.currency)}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4 pb-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 py-4 border-2 rounded-2xl font-bold text-gray-500 uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs hover:bg-red-700 transition"
                    >
                      Save Changes
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

// Internal Card Component for Payables
const PayableCard = ({
  payable,
  expandedId,
  setExpandedId,
  onEdit,
  onDelete,
  formatCurrency,
}) => {
  const isExpanded = expandedId === payable.id;
  const isOwing = payable.status === "owing";

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border ${isOwing ? "border-red-100" : "border-green-100"} overflow-hidden transition-all hover:shadow-md`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-gray-400" />
              <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight">
                {payable.vendorName}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isOwing ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
              >
                {isOwing ? "Owing" : "Cleared"}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> {payable.phoneNumber}
              </div>
              <div className="flex items-center gap-2 text-xs opacity-75">
                <FileText className="w-3.5 h-3.5" /> {payable.details}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
              Balance
            </p>
            <p
              className={`text-2xl font-black ${isOwing ? "text-red-600" : "text-green-600"}`}
            >
              {formatCurrency(payable.balance, payable.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
          <button
            onClick={() => setExpandedId(isExpanded ? null : payable.id)}
            className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1 hover:opacity-75 transition"
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
              onClick={() => onEdit(payable)}
              className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(payable.id)}
              className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Total Debt
                </p>
                <p className="font-black text-gray-900">
                  {formatCurrency(payable.totalAmountOwed, payable.currency)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <p className="text-[10px] font-black text-green-400 uppercase mb-1">
                  Paid to Date
                </p>
                <p className="font-black text-green-700">
                  {formatCurrency(payable.totalPaid, payable.currency)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Installment Logs
              </p>
              {payable.payments?.map((payment, i) => (
                <div
                  key={i}
                  className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm"
                >
                  <div>
                    <p className="font-black text-gray-900">
                      {formatCurrency(payment.amount, payable.currency)}
                    </p>
                    {payment.note && (
                      <p className="text-[10px] text-gray-500 font-bold italic">
                        {payment.note}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] font-black text-gray-400 uppercase">
                    {new Date(payment.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayablesList;

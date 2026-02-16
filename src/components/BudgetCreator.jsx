import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import {
  Plus,
  Trash2,
  X,
  Save,
  Lock,
  LockIcon,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
// ✅ Import Currency selection tools
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "budgets";

const PERIOD_OPTIONS = ["Weekly", "Monthly", "Quarterly", "Annual", "Custom"];
const STATUS_OPTIONS = ["Active", "Draft", "Completed"];

const emptyItem = () => ({
  category: "",
  type: "expense",
  allocated: "",
  actual: "",
  notes: "",
});

const defaultForm = {
  name: "",
  period: "Monthly",
  startDate: "",
  endDate: "",
  status: "Active",
  // ✅ Default to Naira
  currency: SUPPORTED_CURRENCIES[0],
  items: [emptyItem()],
};

const BudgetCreator = ({ editingBudget = null, onSaved, onCancel }) => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        name: editingBudget.name || "",
        period: editingBudget.period || "Monthly",
        startDate: editingBudget.startDate || "",
        endDate: editingBudget.endDate || "",
        status: editingBudget.status || "Active",
        // ✅ Load stored currency or fallback
        currency: editingBudget.currency || SUPPORTED_CURRENCIES[0],
        items:
          editingBudget.items?.length > 0 ? editingBudget.items : [emptyItem()],
      });
    } else {
      setFormData(defaultForm);
    }
  }, [editingBudget]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  // ✅ Currency Change Handler
  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return; // keep at least one row
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const totalAllocated = formData.items.reduce(
    (sum, item) => sum + (parseFloat(item.allocated) || 0),
    0,
  );
  const totalActual = formData.items.reduce(
    (sum, item) => sum + (parseFloat(item.actual) || 0),
    0,
  );
  const totalIncome = formData.items
    .filter((i) => i.type === "income")
    .reduce((sum, i) => sum + (parseFloat(i.allocated) || 0), 0);
  const totalExpense = formData.items
    .filter((i) => i.type === "expense")
    .reduce((sum, i) => sum + (parseFloat(i.allocated) || 0), 0);

  // ✅ Dynamic Currency Formatter
  const formatCurrencyValue = (val) => {
    const curr = formData.currency || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
    }).format(parseFloat(val || 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Name, start date, and end date are required");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    const validItems = formData.items.filter(
      (i) => i.category && i.allocated !== "",
    );
    if (validItems.length === 0) {
      toast.error("Add at least one budget item with a category and amount");
      return;
    }

    if (!editingBudget) {
      const allowed = await canWriteTo(COLLECTION_NAME);
      if (!allowed) {
        setShowLimitModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        // ✅ Include currency in payload
        currency: formData.currency,
        items: validItems,
      };

      if (editingBudget) {
        await api.put(`/budgets/${editingBudget.id}`, payload);
        toast.success("Budget updated successfully");
      } else {
        await api.post("/budgets", payload);
        toast.success("Budget created successfully");
      }

      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
      onSaved?.();
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save budget");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingBudget ? "Edit Budget" : "Create Budget"}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Budget Meta ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Q1 Operating Budget"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Currency Selector Integrated Here */}
          <CurrencySelector
            selectedCurrency={formData.currency || SUPPORTED_CURRENCIES[0]}
            onCurrencyChange={handleCurrencyChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* ── Budget Items ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Budget Items
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-[#5247bf] hover:text-[#4238a6] font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {/* Header row */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-3">Category</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">
                Allocated ({formData.currency?.symbol || "₦"})
              </div>
              <div className="col-span-2">
                Actual ({formData.currency?.symbol || "₦"})
              </div>
              <div className="col-span-2">Notes</div>
              <div className="col-span-1"></div>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="e.g. Rent, Salaries"
                    value={item.category}
                    onChange={(e) =>
                      handleItemChange(index, "category", e.target.value)
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      handleItemChange(index, "type", e.target.value)
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.allocated}
                    onChange={(e) =>
                      handleItemChange(index, "allocated", e.target.value)
                    }
                    min="0"
                    step="0.01"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.actual}
                    onChange={(e) =>
                      handleItemChange(index, "actual", e.target.value)
                    }
                    min="0"
                    step="0.01"
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={item.notes}
                    onChange={(e) =>
                      handleItemChange(index, "notes", e.target.value)
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Totals Summary ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-[#5247bf]/10 to-[#4238a6]/10 rounded-lg border border-[#5247bf]/20">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-bold">
              Total Allocated
            </p>
            <p className="font-bold text-gray-900">
              {formatCurrencyValue(totalAllocated)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-bold">Total Actual</p>
            <p
              className={`font-bold ${
                totalActual > totalAllocated ? "text-red-600" : "text-gray-900"
              }`}
            >
              {formatCurrencyValue(totalActual)}
            </p>
          </div>
          <div className="flex items-start gap-1">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-1 font-bold">Income</p>
              <p className="font-bold text-green-600">
                {formatCurrencyValue(totalIncome)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-1 font-bold">Expenses</p>
              <p className="font-bold text-red-500">
                {formatCurrencyValue(totalExpense)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={
              loading || (limitStatus.reached && !isPaid && !editingBudget)
            }
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
              limitStatus.reached && !isPaid && !editingBudget
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-[#5247bf] hover:bg-[#4238a6] text-white"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : limitStatus.reached && !isPaid && !editingBudget ? (
              <>
                <LockIcon className="w-5 h-5" />
                Upgrade to Continue
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {editingBudget ? "Update Budget" : "Save Budget"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Free Limit Reached
            </h3>
            <p className="text-gray-600 mb-8 font-medium">
              You've used all <strong>{limitStatus.limit}</strong> free budgets.
              Upgrade to Pro for unlimited budgets and full management.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-bold hover:bg-[#4238a6] transition"
            >
              Subscribe Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full mt-3 text-gray-600 font-bold"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCreator;

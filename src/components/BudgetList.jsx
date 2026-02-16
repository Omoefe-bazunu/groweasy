import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import { Fragment } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Lock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";
import BudgetCreator from "./BudgetCreator";
// ✅ Import supported currencies for fallback
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Completed: "bg-blue-100 text-blue-700",
};

const PERIOD_COLORS = {
  Weekly: "bg-purple-100 text-purple-700",
  Monthly: "bg-indigo-100 text-indigo-700",
  Quarterly: "bg-pink-100 text-pink-700",
  Annual: "bg-orange-100 text-orange-700",
  Custom: "bg-gray-100 text-gray-700",
};

const BudgetList = () => {
  const { user } = useUser();
  const { isPaid, getLimitStatus } = useSubscription();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [editingBudget, setEditingBudget] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  useEffect(() => {
    if (user) fetchBudgets();
  }, [user]);

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus("budgets").then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/budgets");
      setBudgets(res.data.budgets);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    setDeleting(id);
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast.success("Budget deleted");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to delete budget");
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = () => {
    setShowCreateForm(false);
    setEditingBudget(null);
    fetchBudgets();
    if (!isPaid) getLimitStatus("budgets").then(setLimitStatus);
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ✅ Updated Dynamic Formatter with currencyObj parameter
  const formatCurrency = (val, currencyObj) => {
    const curr = currencyObj || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
    }).format(parseFloat(val || 0));
  };

  const getBudgetTotals = (items = []) => {
    const totalAllocated = items.reduce(
      (sum, i) => sum + (parseFloat(i.allocated) || 0),
      0,
    );
    const totalActual = items.reduce(
      (sum, i) => sum + (parseFloat(i.actual) || 0),
      0,
    );
    const totalIncome = items
      .filter((i) => i.type === "income")
      .reduce((sum, i) => sum + (parseFloat(i.allocated) || 0), 0);
    const totalExpense = items
      .filter((i) => i.type === "expense")
      .reduce((sum, i) => sum + (parseFloat(i.allocated) || 0), 0);
    const variance = totalAllocated - totalActual;
    return { totalAllocated, totalActual, totalIncome, totalExpense, variance };
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-700";
  };

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch = searchTerm
      ? b.name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesStatus =
      statusFilter === "All" ? true : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  if (showCreateForm || editingBudget) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <BudgetCreator
            editingBudget={editingBudget}
            onSaved={handleSaved}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingBudget(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Budgets
            </h1>
            <p className="text-gray-600 mt-1">
              Plan and track your financial goals
              {!isPaid && limitStatus.current > 0 && (
                <span className="ml-3 text-sm font-medium">
                  • {limitStatus.current}/{limitStatus.limit} free budgets used
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              if (limitStatus.reached && !isPaid) {
                setShowLimitModal(true);
              } else {
                setShowCreateForm(true);
              }
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              limitStatus.reached && !isPaid
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-[#5247bf] hover:bg-[#4238a6] text-white"
            }`}
          >
            {limitStatus.reached && !isPaid ? (
              <>
                <Lock className="w-5 h-5" />
                Upgrade to Continue
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                New Budget
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-40 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {filteredBudgets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {budgets.length === 0
                ? "No budgets yet"
                : "No budgets match your search"}
            </h3>
            <p className="text-gray-600 mb-6">
              {budgets.length === 0
                ? "Create your first budget to start planning your finances"
                : "Try adjusting your search or filter"}
            </p>
            {budgets.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
              >
                Create Your First Budget
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 w-8"></th>
                  <th className="p-3 text-left font-semibold text-gray-700 min-w-[160px]">
                    Budget Name
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 min-w-[100px]">
                    Period
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 min-w-[180px]">
                    Dates
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-700 min-w-[120px]">
                    Allocated
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-700 min-w-[120px]">
                    Actual
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                    Variance
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 min-w-[90px]">
                    Status
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((budget) => {
                  const {
                    totalAllocated,
                    totalActual,
                    totalIncome,
                    totalExpense,
                    variance,
                  } = getBudgetTotals(budget.items);
                  const isExpanded = expandedRows[budget.id];

                  return (
                    <Fragment key={budget.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <button
                            onClick={() => toggleRow(budget.id)}
                            className="text-gray-400 hover:text-[#5247bf] transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-gray-900">
                            {budget.name}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {budget.items?.length || 0} item
                            {budget.items?.length !== 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              PERIOD_COLORS[budget.period] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {budget.period}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">
                          <span>{budget.startDate}</span>
                          <span className="mx-1 text-gray-400">→</span>
                          <span>{budget.endDate}</span>
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          {/* ✅ Dynamic Currency Logic */}
                          {formatCurrency(totalAllocated, budget.currency)}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-700">
                          {formatCurrency(totalActual, budget.currency)}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${getVarianceColor(variance)}`}
                        >
                          {variance >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(variance), budget.currency)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[budget.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {budget.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingBudget(budget)}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-800 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(budget.id)}
                              disabled={!isPaid || deleting === budget.id}
                              className={`px-3 py-1.5 rounded transition flex items-center justify-center ${
                                !isPaid
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-red-600 text-white hover:bg-red-800"
                              }`}
                            >
                              {deleting === budget.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : !isPaid ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="flex flex-wrap gap-4 mb-4">
                              <div className="flex items-center gap-1.5 text-sm">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600 font-medium">
                                  Budgeted Income:
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(totalIncome, budget.currency)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-gray-600 font-medium">
                                  Budgeted Expenses:
                                </span>
                                <span className="font-bold text-red-500">
                                  {formatCurrency(
                                    totalExpense,
                                    budget.currency,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm border-l pl-4 border-gray-300">
                                <span className="text-gray-600 font-medium">
                                  Net Budget:
                                </span>
                                <span
                                  className={`font-bold ${
                                    totalIncome - totalExpense >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatCurrency(
                                    totalIncome - totalExpense,
                                    budget.currency,
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                  <tr>
                                    <th className="p-2.5 text-left font-bold text-gray-700">
                                      Category
                                    </th>
                                    <th className="p-2.5 text-left font-bold text-gray-700">
                                      Type
                                    </th>
                                    <th className="p-2.5 text-right font-bold text-gray-700">
                                      Allocated
                                    </th>
                                    <th className="p-2.5 text-right font-bold text-gray-700">
                                      Actual
                                    </th>
                                    <th className="p-2.5 text-right font-bold text-gray-700">
                                      Variance
                                    </th>
                                    <th className="p-2.5 text-left font-bold text-gray-700">
                                      Notes
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(budget.items || []).map((item, idx) => {
                                    const itemVariance =
                                      (parseFloat(item.allocated) || 0) -
                                      (parseFloat(item.actual) || 0);
                                    const isOverBudget =
                                      item.type === "expense" &&
                                      itemVariance < 0;
                                    return (
                                      <tr
                                        key={idx}
                                        className={`border-b border-gray-50 last:border-0 ${
                                          isOverBudget ? "bg-red-50" : ""
                                        }`}
                                      >
                                        <td className="p-2.5 font-bold text-gray-900">
                                          {item.category}
                                        </td>
                                        <td className="p-2.5">
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                              item.type === "income"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {item.type}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-right font-medium text-gray-900">
                                          {formatCurrency(
                                            item.allocated,
                                            budget.currency,
                                          )}
                                        </td>
                                        <td className="p-2.5 text-right font-medium text-gray-900">
                                          {parseFloat(item.actual) > 0
                                            ? formatCurrency(
                                                item.actual,
                                                budget.currency,
                                              )
                                            : "-"}
                                        </td>
                                        <td
                                          className={`p-2.5 text-right font-black ${getVarianceColor(itemVariance)}`}
                                        >
                                          {itemVariance >= 0 ? "+" : "-"}
                                          {formatCurrency(
                                            Math.abs(itemVariance),
                                            budget.currency,
                                          )}
                                        </td>
                                        <td className="p-2.5 text-gray-600 italic">
                                          {item.notes || "-"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showLimitModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Feature Locked
              </h3>
              <p className="text-gray-600 mb-8 font-medium">
                Deleting budgets is available for <strong>Pro</strong> users
                only. Upgrade now to manage your budgets freely.
              </p>
              <button
                onClick={() => (window.location.href = "/subscribe")}
                className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-bold hover:bg-[#4238a6] transition"
              >
                Subscribe Now
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full mt-3 text-gray-500 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetList;

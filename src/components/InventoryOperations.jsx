import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Save,
  RotateCcw,
  Lock,
  Loader2,
  LockIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import api from "../lib/api";
// ✅ Import currency selection tools
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "inventory";

const InventoryOperations = ({ inventory, onInventoryChange, switchToTab }) => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  const defaultNewItem = {
    name: "",
    sku: "",
    category: "",
    minLevel: 5,
    costPrice: "",
    sellPrice: "",
    quantity: 0,
    // ✅ Default to Naira
    currency: SUPPORTED_CURRENCIES[0],
  };

  const [newItem, setNewItem] = useState(defaultNewItem);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("add");

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  const handleCurrencyChange = (currency) => {
    setNewItem((prev) => ({ ...prev, currency }));
  };

  // ✅ Updated Formatter for dynamic currency
  const formatCurrency = (value) => {
    const activeCurrency = newItem.currency || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: activeCurrency.code,
      minimumFractionDigits: 2,
    }).format(parseFloat(value || 0));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in");
    if (!newItem.name || !newItem.costPrice)
      return toast.error("Name and Cost Price are required");

    const allowed = await canWriteTo(COLLECTION_NAME);
    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/inventory", {
        name: newItem.name,
        sku: newItem.sku,
        category: newItem.category,
        quantity: parseInt(newItem.quantity) || 0,
        minLevel: parseInt(newItem.minLevel) || 5,
        costPrice: parseFloat(newItem.costPrice) || 0,
        sellPrice: parseFloat(newItem.sellPrice) || 0,
        // ✅ Send currency settings to backend
        currency: newItem.currency,
      });

      toast.success("Product created successfully");

      const createdProduct = {
        id: res.data.id,
        userId: user.uid,
        name: newItem.name,
        sku: newItem.sku || "",
        category: newItem.category || "",
        quantity: parseInt(newItem.quantity) || 0,
        minLevel: parseInt(newItem.minLevel) || 5,
        costPrice: parseFloat(newItem.costPrice) || 0,
        sellPrice: parseFloat(newItem.sellPrice) || 0,
        currency: newItem.currency,
      };
      onInventoryChange((prev) => [createdProduct, ...prev]);
      setNewItem(defaultNewItem);
      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
      switchToTab("dashboard");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save product");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !adjustmentQty) return;

    setUpdating(true);
    try {
      const res = await api.patch(`/inventory/${selectedItemId}/adjust`, {
        type: adjustmentType,
        qty: parseInt(adjustmentQty),
      });

      const { newQty, message } = res.data;

      onInventoryChange((prev) =>
        prev.map((i) =>
          i.id === selectedItemId ? { ...i, quantity: newQty } : i,
        ),
      );

      toast.success(message || "Stock updated");
      setAdjustmentQty("");
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.error || "Failed to update stock");
      } else {
        console.error("adjustStock error:", err);
        toast.warning("Stock may have updated — please refresh to check");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* ── Stock Adjustment ── */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-fit">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-blue-600" /> Stock Adjustment
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Quickly add new stock (purchases) or remove stock (sales/damages).
        </p>

        <form onSubmit={handleAdjustment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Product
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Item --</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Current: {i.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("add")}
                  className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition ${
                    adjustmentType === "add"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <Plus className="w-4 h-4" /> Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("remove")}
                  className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition ${
                    adjustmentType === "remove"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <Minus className="w-4 h-4" /> Stock Out
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating || inventory.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition mt-2 flex justify-center items-center gap-2"
          >
            {updating && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Stock Level
          </button>
        </form>
      </div>

      {/* ── Add New Product ── */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 border-t-4 border-t-[#8b5cf6]">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#8b5cf6]" /> Add New Product
          </h2>
          {!isPaid && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {limitStatus.current}/{limitStatus.limit} Used
            </span>
          )}
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dangote Cement"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU / Code
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem({ ...newItem, sku: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Materials"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* ✅ Added Currency Selector */}
            <CurrencySelector
              selectedCurrency={newItem.currency || SUPPORTED_CURRENCIES[0]}
              onCurrencyChange={handleCurrencyChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price ({newItem.currency?.symbol || "₦"})
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={newItem.costPrice}
                onChange={(e) =>
                  setNewItem({ ...newItem, costPrice: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price ({newItem.currency?.symbol || "₦"})
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={newItem.sellPrice}
                onChange={(e) =>
                  setNewItem({ ...newItem, sellPrice: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Qty
              </label>
              <input
                type="number"
                placeholder="0"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Alert Level
              </label>
              <input
                type="number"
                placeholder="Default: 5"
                value={newItem.minLevel}
                onChange={(e) =>
                  setNewItem({ ...newItem, minLevel: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#8b5cf6]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (limitStatus.reached && !isPaid)}
            className={`w-full font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 mt-2 ${
              limitStatus.reached && !isPaid
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : limitStatus.reached && !isPaid ? (
              <>
                <LockIcon className="w-5 h-5" /> Upgrade to Continue
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Product
              </>
            )}
          </button>
        </form>
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Inventory Limit Reached
            </h3>
            <p className="text-gray-600 mb-4">
              You've created <strong>{limitStatus.limit} free products</strong>.
            </p>
            <p className="text-gray-600 mb-8">
              Upgrade to Pro to manage <strong>unlimited</strong> inventory
              items.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-[#8b5cf6] text-white py-4 rounded-lg font-semibold hover:bg-[#7c3aed] transition"
            >
              Subscribe Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full mt-3 text-gray-600 hover:text-gray-800"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryOperations;

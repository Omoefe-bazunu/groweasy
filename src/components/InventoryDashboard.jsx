import { useState } from "react";
import { useSubscription } from "../context/SubscriptionContext"; // Added Context
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Lock, // Added Lock Icon
} from "lucide-react";
import { db } from "../lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const InventoryDashboard = ({ inventory, loading }) => {
  const { isPaid } = useSubscription(); // Get subscription status
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false); // Modal State

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  // Analytics
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= i.minLevel
  ).length;
  const outOfStockItems = inventory.filter((i) => i.quantity === 0).length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + item.quantity * item.costPrice,
    0
  );

  // Filter
  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (qty, min) => {
    if (qty === 0)
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
      };
    if (qty <= min)
      return {
        label: "Low Stock",
        color: "bg-yellow-100 text-yellow-700",
        icon: AlertTriangle,
      };
    return {
      label: "In Stock",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle2,
    };
  };

  const handleDelete = async (id, name) => {
    // --- LOCK CHECK ---
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    )
      return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "inventory", id));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Total Inventory Value</p>
          <p className="text-2xl font-bold text-[#8b5cf6]">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Unique Products</p>
          <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Low Stock Alerts</p>
          <p
            className={`text-2xl font-bold ${
              lowStockItems > 0 ? "text-yellow-600" : "text-gray-800"
            }`}
          >
            {lowStockItems}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Out of Stock</p>
          <p
            className={`text-2xl font-bold ${
              outOfStockItems > 0 ? "text-red-600" : "text-gray-800"
            }`}
          >
            {outOfStockItems}
          </p>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800">
            Current Stock Levels
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Cost Price</th>
                <th className="px-6 py-3 text-right">Selling Price</th>
                <th className="px-6 py-3 text-right">Asset Value</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => {
                const status = getStatus(item.quantity, item.minLevel);
                const StatusIcon = status.icon;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.sku ? `SKU: ${item.sku}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.category}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <p className=" text-nowrap">{status.label}</p>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatCurrency(item.costPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatCurrency(item.sellPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[#8b5cf6]">
                      {formatCurrency(item.quantity * item.costPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deletingId === item.id || !isPaid}
                        className={`p-2 rounded-lg transition disabled:opacity-50 ${
                          !isPaid
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "text-red-500 hover:bg-red-50"
                        }`}
                        title={!isPaid ? "Upgrade to delete" : "Delete Product"}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : !isPaid ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {inventory.length === 0
                      ? "Your inventory is empty. Go to 'Manage Stock' to add items."
                      : `No products found matching "${searchTerm}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Feature Locked
            </h3>
            <p className="text-gray-600 mb-8">
              Deleting items is a <strong>Pro</strong> feature. Upgrade to
              manage your data freely.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-[#5247bf] text-white py-3 rounded-lg font-semibold hover:bg-[#4238a6] transition"
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
  );
};

export default InventoryDashboard;

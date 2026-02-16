import { useState } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  X,
  Loader2,
  Lock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../lib/api";

// InventoryDashboard receives `inventory` list and `onInventoryChange` callback
// from the parent page so the list stays in sync after mutations.
const InventoryDashboard = ({ inventory, loading, onInventoryChange }) => {
  const { isPaid } = useSubscription();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val || 0);

  // ── Analytics ─────────────────────────────────────────────────────────────
  const totalValue = inventory.reduce(
    (s, i) => s + i.quantity * i.costPrice,
    0,
  );
  const totalSales = inventory.reduce(
    (s, i) => s + i.quantity * i.sellPrice,
    0,
  );
  const totalProfit = inventory.reduce(
    (s, i) => s + (i.sellPrice - i.costPrice) * i.quantity,
    0,
  );
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= i.minLevel,
  ).length;
  const outOfStockItems = inventory.filter((i) => i.quantity === 0).length;

  const filteredInventory = inventory.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
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

  // ✅ Delete via backend
  const handleDelete = async (id, name) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }
    if (!window.confirm(`Delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/inventory/${id}`);
      onInventoryChange((prev) => prev.filter((i) => i.id !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to delete product");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Update product details via backend
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.patch(`/inventory/${editingProduct.id}`, {
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        costPrice: parseFloat(editingProduct.costPrice),
        sellPrice: parseFloat(editingProduct.sellPrice),
        minLevel: parseInt(editingProduct.minLevel),
      });

      onInventoryChange((prev) =>
        prev.map((i) =>
          i.id === editingProduct.id
            ? {
                ...i,
                name: editingProduct.name,
                sku: editingProduct.sku || "",
                category: editingProduct.category || "",
                costPrice: parseFloat(editingProduct.costPrice),
                sellPrice: parseFloat(editingProduct.sellPrice),
                minLevel: parseInt(editingProduct.minLevel),
              }
            : i,
        ),
      );

      toast.success("Product updated successfully");
      setEditingProduct(null);
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.error || "Failed to update product");
      } else {
        console.error("updateProduct error:", err);
        toast.warning("Product may have updated — please refresh to check");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-[#8b5cf6] rounded-full animate-pulse" />
          <span className="h-3 w-3 bg-[#8b5cf6] rounded-full animate-pulse delay-200" />
          <span className="h-3 w-3 bg-[#8b5cf6] rounded-full animate-pulse delay-400" />
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Inventory Value</p>
          <p className="text-lg font-bold text-[#8b5cf6]">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <p className="text-gray-500 text-xs flex items-center gap-1">
            Total Sales <BarChart3 className="w-3 h-3 text-blue-600" />
          </p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(totalSales)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
          <p className="text-gray-500 text-xs flex items-center gap-1">
            Total Profit <TrendingUp className="w-3 h-3 text-green-600" />
          </p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Products</p>
          <p className="text-lg font-bold text-gray-800">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Low Stock</p>
          <p
            className={`text-lg font-bold ${lowStockItems > 0 ? "text-yellow-600" : "text-gray-800"}`}
          >
            {lowStockItems}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Out of Stock</p>
          <p
            className={`text-lg font-bold ${outOfStockItems > 0 ? "text-red-600" : "text-gray-800"}`}
          >
            {outOfStockItems}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800">
            Stock & Profitability
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
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Cost Price</th>
                <th className="px-6 py-3 text-right">Selling Price</th>
                <th className="px-6 py-3 text-right text-green-700">
                  Profit/Unit
                </th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {searchTerm
                      ? "No products match your search"
                      : "No inventory items yet"}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStatus(item.quantity, item.minLevel);
                  const StatusIcon = status.icon;
                  const profitPerUnit =
                    (item.sellPrice || 0) - (item.costPrice || 0);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.sku && (
                          <div className="text-xs text-gray-500">
                            SKU: {item.sku}
                          </div>
                        )}
                        {item.category && (
                          <div className="text-xs text-gray-400">
                            {item.category}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span className="whitespace-nowrap">
                            {status.label}
                          </span>
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
                      <td className="px-6 py-4 text-right font-bold text-green-600 bg-green-50/20">
                        {formatCurrency(profitPerUnit)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingProduct(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={deletingId === item.id || !isPaid}
                            className={`p-2 rounded-lg transition disabled:opacity-50 ${
                              !isPaid
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "text-red-500 hover:bg-red-50"
                            }`}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : !isPaid ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                required
                value={editingProduct.name}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, name: e.target.value })
                }
                className="w-full p-2.5 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="SKU (Optional)"
                  value={editingProduct.sku || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      sku: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={editingProduct.category || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Cost Price"
                  required
                  value={editingProduct.costPrice}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      costPrice: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Sell Price"
                  value={editingProduct.sellPrice}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      sellPrice: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
              <input
                type="number"
                placeholder="Low Stock Alert Level"
                value={editingProduct.minLevel}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    minLevel: e.target.value,
                  })
                }
                className="w-full p-2.5 border rounded-lg"
              />
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-[#8b5cf6] text-white py-3 rounded-lg font-bold hover:bg-[#7c3aed] transition disabled:opacity-60"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Feature Locked
            </h3>
            <p className="text-gray-600 mb-8">
              Deleting items is a Pro feature. Upgrade to manage your data
              freely.
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

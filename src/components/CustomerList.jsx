import { useState } from "react";
import { useSubscription } from "../context/SubscriptionContext"; // Added Context
import {
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Save,
  X,
  Lock, // Added Lock Icon
} from "lucide-react";
import { db } from "../lib/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const CustomerList = ({ customers, loading }) => {
  const { isPaid } = useSubscription(); // Get subscription status
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false); // Modal State

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.productInterest?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    // --- LOCK CHECK ---
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }

    if (!window.confirm("Delete this customer?")) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      toast.success("Customer deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setEditForm(customer);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "customers", editingId), {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        state: editForm.state,
        productInterest: editForm.productInterest,
      });
      toast.success("Customer updated");
      setEditingId(null);
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name, state, or interest..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5247bf] outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
          >
            {editingId === customer.id ? (
              <div className="space-y-3">
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Name"
                />
                <input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Phone"
                />
                <input
                  value={editForm.state}
                  onChange={(e) =>
                    setEditForm({ ...editForm, state: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                  placeholder="State"
                />
                <input
                  value={editForm.productInterest}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      productInterest: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Interest"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-medium flex justify-center items-center gap-1"
                  >
                    {updating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}{" "}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900 truncate">
                    {customer.name}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1.5 text-gray-400 hover:text-[#5247bf] hover:bg-purple-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(customer.id)}
                      disabled={!isPaid}
                      title={!isPaid ? "Upgrade to delete" : "Delete"}
                      className={`p-1.5 rounded transition ${
                        !isPaid
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {!isPaid ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#5247bf]" />{" "}
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-[#5247bf]" />{" "}
                      {customer.email}
                    </div>
                  )}
                  {customer.state && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#5247bf]" />{" "}
                      {customer.state}, {customer.country}
                    </div>
                  )}
                </div>

                {customer.productInterest && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Interested in
                    </span>
                    <p className="text-sm font-medium text-[#5247bf]">
                      {customer.productInterest}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No customers found.
          </div>
        )}
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

export default CustomerList;

import { useState, useEffect } from "react";
import { UserPlus, Save, Lock, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const COLLECTION_NAME = "customers";

const CustomerForm = ({ switchToTab }) => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    state: "", // For Analytics
    country: "Nigeria", // Default
    productInterest: "", // For Analytics (e.g., "Web Dev")
  });

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");
    if (!formData.name || !formData.phone)
      return toast.error("Name and Phone are required");

    const allowed = await canWriteTo(COLLECTION_NAME);
    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        userId: user.uid,
        ...formData,
        createdAt: serverTimestamp(),
      });

      toast.success("Customer added successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        state: "",
        country: "Nigeria",
        productInterest: "",
      });

      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
      switchToTab("list");
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-[#5247bf]" /> Add New Customer
        </h2>
        {!isPaid && (
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {limitStatus.current}/{limitStatus.limit} Free Used
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5247bf]"
            placeholder="e.g. Chioma Adebayo"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              placeholder="client@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              placeholder="+234..."
              required
            />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            Demographics & Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                State / Region
              </label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-1 focus:ring-purple-500"
                placeholder="e.g. Lagos"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Product Interest
              </label>
              <input
                name="productInterest"
                value={formData.productInterest}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-1 focus:ring-purple-500"
                placeholder="e.g. Web Design"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (limitStatus.reached && !isPaid)}
          className={`w-full font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 ${
            limitStatus.reached && !isPaid
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-[#5247bf] hover:bg-[#4238a6] text-white"
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : limitStatus.reached && !isPaid ? (
            <Lock className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {limitStatus.reached && !isPaid
            ? "Upgrade to Add More"
            : "Save Customer"}
        </button>
      </form>

      {/* Upgrade Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md">
            <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Customer Limit Reached</h3>
            <p className="text-gray-600 mb-6">
              Upgrade to Pro to save unlimited customer contacts.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="bg-[#5247bf] text-white w-full py-3 rounded-lg hover:bg-[#4238a6]"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="mt-4 text-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerForm;

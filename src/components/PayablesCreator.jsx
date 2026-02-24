import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import {
  Plus,
  X,
  Save,
  ShoppingCart,
  Info,
  Lock,
  LockIcon,
  Loader2,
} from "lucide-react";
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "payables";

const PayablesCreator = () => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  const [formData, setFormData] = useState({
    vendorName: "",
    phoneNumber: "",
    details: "",
    totalAmountOwed: "",
    currency: SUPPORTED_CURRENCIES[0],
    initialPayment: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorName || !formData.totalAmountOwed)
      return toast.error("Vendor and Total Amount are required");

    const allowed = await canWriteTo(COLLECTION_NAME);
    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        payments: formData.initialPayment
          ? [
              {
                amount: Number(formData.initialPayment),
                date: formData.date,
                note: "Initial payment",
              },
            ]
          : [],
      };

      await api.post("/payables", payload);
      toast.success("Debt record created");
      setIsModalOpen(false);
      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
      window.location.reload();
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to save record");
      }
    } finally {
      setLoading(false);
    }
  };

  const balance =
    (Number(formData.totalAmountOwed) || 0) -
    (Number(formData.initialPayment) || 0);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl mt-4 p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-red-600" /> Payables
          </h2>
          {!isPaid && (
            <p className="text-red-600 text-xs font-black mt-1 uppercase tracking-widest">
              {limitStatus.current}/{limitStatus.limit} Free Records Used
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (limitStatus.reached && !isPaid) setShowLimitModal(true);
            else setIsModalOpen(true);
          }}
          className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition shadow-lg ${
            limitStatus.reached && !isPaid
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {limitStatus.reached && !isPaid ? (
            <LockIcon className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          New Debt Entry
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-2xl shrink-0">
              <h2 className="text-2xl font-black text-gray-900 uppercase">
                Record New Debt
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-7 h-7 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="vendorName"
                    placeholder="Vendor Name"
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-red-600 outline-none"
                    required
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-red-600 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CurrencySelector
                    selectedCurrency={formData.currency}
                    onCurrencyChange={(c) =>
                      setFormData({ ...formData, currency: c })
                    }
                  />
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Total Debt Amount
                    </label>
                    <input
                      type="number"
                      name="totalAmountOwed"
                      placeholder="0.00"
                      onChange={handleInputChange}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-red-600 focus:ring-2 focus:ring-red-600 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs font-black text-blue-800 uppercase mb-3 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Initial Payment Details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="initialPayment"
                      placeholder="Amount Paying Now"
                      onChange={handleInputChange}
                      className="p-3 bg-white border border-gray-200 rounded-lg font-bold outline-none"
                    />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="p-3 bg-white border border-gray-200 rounded-lg font-bold outline-none"
                    />
                  </div>
                </div>

                <textarea
                  name="details"
                  placeholder="Details of items/services..."
                  onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-red-600 outline-none"
                  rows="2"
                  required
                />

                <div className="bg-gray-900 rounded-2xl p-6 text-white text-center shadow-inner">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Remaining Balance
                  </p>
                  <p className="text-3xl font-black text-red-400 mt-1">
                    {formData.currency.symbol}
                    {balance.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-4 flex-col pt-4 pb-10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 uppercase text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg uppercase text-sm flex items-center justify-center gap-2 hover:bg-red-700"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
            <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tighter">
              Limit Reached
            </h3>
            <p className="text-gray-700 mb-8 font-medium">
              Upgrade to Pro to record unlimited payables and keep accurate
              vendor accounts.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-red-600 text-white py-4 rounded-lg font-black hover:bg-red-700 transition shadow-lg uppercase"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full mt-3 text-gray-400 font-bold uppercase text-xs"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PayablesCreator;

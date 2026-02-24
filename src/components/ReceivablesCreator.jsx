import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import {
  Plus,
  X,
  Trash2,
  Save,
  UserPlus,
  Users,
  Landmark,
  Lock,
  LockIcon,
  Loader2,
  Info,
} from "lucide-react";
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "receivables";

const ReceivablesCreator = () => {
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
    customerName: "",
    phoneNumber: "",
    address: "",
    details: "",
    totalAmountOwed: "",
    currency: SUPPORTED_CURRENCIES[0],
    initialPayment: "",
    date: new Date().toISOString().split("T")[0],
    payments: [],
  });

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.totalAmountOwed) {
      toast.error("Please fill required fields");
      return;
    }

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

      await api.post("/receivables", payload);
      toast.success("Receivable created successfully");
      setIsModalOpen(false);
      resetForm();
      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
      window.location.reload();
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to create receivable");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      phoneNumber: "",
      address: "",
      details: "",
      totalAmountOwed: "",
      currency: SUPPORTED_CURRENCIES[0],
      initialPayment: "",
      date: new Date().toISOString().split("T")[0],
      payments: [],
    });
  };

  const formatCurrency = (val) => {
    const curr = formData.currency || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
    }).format(parseFloat(val || 0));
  };

  const balance =
    (Number(formData.totalAmountOwed) || 0) -
    (Number(formData.initialPayment) || 0);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl mt-4 p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Landmark className="w-6 h-6 text-[#5247bf]" /> Accounts
              Receivable
            </h2>
            {!isPaid && (
              <p className="text-[#5247bf] text-xs font-black mt-1 uppercase tracking-widest">
                {limitStatus.current}/{limitStatus.limit} Free Records Used
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (limitStatus.reached && !isPaid) setShowLimitModal(true);
              else setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-md font-bold text-sm uppercase tracking-widest transition-all ${
              limitStatus.reached && !isPaid
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-[#5247bf] text-white hover:bg-[#4238a6]"
            }`}
          >
            {limitStatus.reached && !isPaid ? (
              <LockIcon className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Debt Entry
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                New Receivable Entry
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
                    name="customerName"
                    placeholder="Customer Name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-[#5247bf] outline-none"
                    required
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-[#5247bf] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CurrencySelector
                    selectedCurrency={formData.currency}
                    onCurrencyChange={handleCurrencyChange}
                  />
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Total Debt Amount
                    </label>
                    <input
                      type="number"
                      name="totalAmountOwed"
                      placeholder="0.00"
                      value={formData.totalAmountOwed}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 focus:ring-2 focus:ring-[#5247bf] outline-none"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs font-black text-blue-800 uppercase mb-3 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Initial Payment Received
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="initialPayment"
                      placeholder="Amount Received Now"
                      value={formData.initialPayment}
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
                  placeholder="What is this debt for?"
                  value={formData.details}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#5247bf] outline-none"
                  rows="3"
                  required
                />

                <div className="bg-gray-900 rounded-2xl p-6 text-white text-center shadow-inner">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Balance to be Paid
                  </p>
                  <p
                    className={`text-3xl font-black mt-1 ${balance > 0 ? "text-red-400" : "text-green-400"}`}
                  >
                    {formatCurrency(balance)}
                  </p>
                </div>

                <div className="flex gap-4 flex-col pt-4 pb-10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 uppercase text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-[#5247bf] text-white rounded-2xl font-black shadow-lg uppercase flex items-center justify-center gap-2 tracking-widest"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}{" "}
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
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tighter">
              Limit Reached
            </h3>
            <p className="text-gray-700 mb-8 font-medium">
              Upgrade to Pro to manage unlimited accounts receivable and keep
              your business debts organized.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-black hover:bg-[#4238a6] transition shadow-lg uppercase"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full mt-3 text-gray-500 font-bold uppercase text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReceivablesCreator;

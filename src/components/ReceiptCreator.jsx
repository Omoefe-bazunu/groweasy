import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import { RotateCcw, Save, Lock, Loader2, LockIcon } from "lucide-react";
// ✅ Import Currency selection tools
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "receipts";

const ReceiptCreator = () => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  const defaultForm = {
    businessName: "",
    address: "",
    contactEmail: "",
    contactNumber: "",
    date: new Date().toISOString().split("T")[0],
    brandColor: "#5247bf",
    // ✅ Initialize with Default Currency (Naira)
    currency: SUPPORTED_CURRENCIES[0],
    clientName: "",
    clientContact: "",
    clientLocation: "",
    clientOccupation: "",
    items: Array(10).fill({
      details: "",
      qty: "",
      unitPrice: "",
      discount: "",
    }),
    signatureName: "",
    signatoryPosition: "",
    amountPaid: "",
    paymentMethod: "",
    dueDate: "",
    interestRate: "",
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (user && !isPaid) {
      getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    }
  }, [user, isPaid, getLimitStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  // ✅ Currency Change Handler
  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  // ✅ Updated Dynamic Currency Formatter
  const formatCurrency = (value) => {
    const activeCurrency = formData.currency || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: activeCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value || 0));
  };

  const calculateAmount = (qty, unitPrice) =>
    (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);
  const calculateFinalAmount = (qty, unitPrice, discount) =>
    calculateAmount(qty, unitPrice) - (parseFloat(discount) || 0);
  const calculateTotal = () =>
    formData.items.reduce(
      (sum, item) =>
        sum + calculateFinalAmount(item.qty, item.unitPrice, item.discount),
      0,
    );
  const calculateOutstandingBalance = () =>
    calculateTotal() - (parseFloat(formData.amountPaid) || 0);
  const calculateInterestCharges = () => {
    if (!formData.dueDate || !formData.interestRate) return 0;
    const today = new Date();
    const dueDate = new Date(formData.dueDate);
    if (today <= dueDate) return 0;
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const balance = calculateOutstandingBalance();
    const dailyRate = parseFloat(formData.interestRate) / 100 / 365;
    return balance * dailyRate * daysOverdue;
  };

  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in");
    if (!formData.businessName || !formData.address)
      return toast.error("Business name and address are required");

    const allowed = await canWriteTo(COLLECTION_NAME);
    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      await api.post("/receipts", {
        ...formData,
        items: formData.items.filter((i) => i.details && i.qty && i.unitPrice),
        total: calculateTotal().toFixed(2),
      });

      toast.success("Receipt saved successfully!");
      handleReset();

      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save receipt");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(defaultForm);
    toast.info("Form cleared");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-6 text-gray-600">
      <div className="w-full mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Receipt</h1>
            {!isPaid && (
              <p className="text-sm text-gray-600 mt-1">
                {limitStatus.current}/{limitStatus.limit} free receipts used
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <div className="relative group">
              <button
                onClick={handleSave}
                disabled={loading || (limitStatus.reached && !isPaid)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                  limitStatus.reached && !isPaid
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-[#5247bf] hover:bg-[#4238a6] text-white"
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
                    <Save className="w-5 h-5" /> Save Receipt
                  </>
                )}
              </button>
              {limitStatus.reached && !isPaid && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  You've reached 10 free receipts. Upgrade for unlimited!
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Form ── */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Receipt Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
              {/* ✅ Currency Selector correctly imported as CurrencySelector */}
              <CurrencySelector
                selectedCurrency={formData.currency || SUPPORTED_CURRENCIES[0]}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Color
              </label>
              <input
                type="color"
                name="brandColor"
                value={formData.brandColor}
                onChange={handleInputChange}
                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Client Info */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Client Information
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  name="clientName"
                  placeholder="Client/Customer Name"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="tel"
                    name="clientContact"
                    placeholder="Contact Number"
                    value={formData.clientContact}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                  />
                  <input
                    type="text"
                    name="clientLocation"
                    placeholder="Location"
                    value={formData.clientLocation}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                  />
                </div>
                <input
                  type="text"
                  name="clientOccupation"
                  placeholder="Occupation (Optional)"
                  value={formData.clientOccupation}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
            </div>

            {/* Items */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Items
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 space-y-2"
                  >
                    <textarea
                      placeholder={`Item ${index + 1} Details`}
                      value={item.details}
                      onChange={(e) =>
                        handleItemChange(index, "details", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#5247bf]"
                      rows={2}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(index, "qty", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#5247bf]"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#5247bf]"
                      />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(index, "discount", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#5247bf]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Details (Optional)
              </h3>
              <input
                type="number"
                name="amountPaid"
                placeholder="Amount Paid"
                value={formData.amountPaid}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              />
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (%) (Optional)
                </label>
                <input
                  type="number"
                  name="interestRate"
                  placeholder="Annual interest rate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
            </div>

            {/* Signatory */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Signatory
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="signatureName"
                  placeholder="Signatory Name"
                  value={formData.signatureName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
                <input
                  type="text"
                  name="signatoryPosition"
                  placeholder="Position"
                  value={formData.signatoryPosition}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div
              id="receipt-preview"
              className="bg-white p-8 border border-gray-200 rounded-lg"
            >
              <div
                className="flex justify-between items-start mb-6"
                style={{
                  borderBottom: `3px solid ${formData.brandColor}`,
                  paddingBottom: "16px",
                }}
              >
                <div className="flex-1">
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: formData.brandColor }}
                  >
                    {formData.businessName || "Business Name"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.address || "Address"}
                  </p>
                  {formData.contactEmail && (
                    <p className="text-sm text-gray-600">
                      {formData.contactEmail}
                    </p>
                  )}
                  {formData.contactNumber && (
                    <p className="text-sm text-gray-600">
                      {formData.contactNumber}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: formData.brandColor }}
                  >
                    RECEIPT
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Date: {formData.date}
                  </p>
                </div>
              </div>

              {(formData.clientName ||
                formData.clientContact ||
                formData.clientLocation) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    CLIENT INFORMATION
                  </h3>
                  {formData.clientName && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Name:</span>{" "}
                      {formData.clientName}
                    </p>
                  )}
                  {formData.clientContact && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Contact:</span>{" "}
                      {formData.clientContact}
                    </p>
                  )}
                  {formData.clientLocation && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span>{" "}
                      {formData.clientLocation}
                    </p>
                  )}
                  {formData.clientOccupation && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Occupation:</span>{" "}
                      {formData.clientOccupation}
                    </p>
                  )}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[600px] w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: formData.brandColor,
                        color: "white",
                      }}
                    >
                      <th className="p-2 text-left">Details</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-right">Discount</th>
                      <th className="p-2 text-right">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2 text-left">{item.details || "-"}</td>
                        <td className="p-2 text-center">{item.qty || "-"}</td>
                        <td className="p-2 text-right">
                          {item.unitPrice
                            ? formatCurrency(item.unitPrice)
                            : "-"}
                        </td>
                        <td className="p-2 text-right">
                          {item.qty && item.unitPrice
                            ? formatCurrency(
                                calculateAmount(item.qty, item.unitPrice),
                              )
                            : "-"}
                        </td>
                        <td className="p-2 text-right">
                          {item.discount ? formatCurrency(item.discount) : "-"}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {item.qty && item.unitPrice
                            ? formatCurrency(
                                calculateFinalAmount(
                                  item.qty,
                                  item.unitPrice,
                                  item.discount,
                                ),
                              )
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: formData.brandColor + "20" }}>
                      <td colSpan={5} className="p-2 text-right font-bold">
                        Total:
                      </td>
                      <td
                        className="p-2 text-right font-bold"
                        style={{ color: formData.brandColor }}
                      >
                        {formatCurrency(calculateTotal())}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="p-2 text-right font-bold">
                        Amount Paid:
                      </td>
                      <td className="p-2 text-right font-bold">
                        {formData.amountPaid
                          ? formatCurrency(formData.amountPaid)
                          : "-"}
                        {formData.paymentMethod && formData.amountPaid && (
                          <span className="text-xs text-gray-600 block">
                            ({formData.paymentMethod})
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="p-2 text-right font-bold">
                        Outstanding Balance:
                      </td>
                      <td className="p-2 text-right font-bold">
                        {formatCurrency(calculateOutstandingBalance())}
                      </td>
                    </tr>
                    {formData.dueDate && (
                      <tr>
                        <td colSpan={5} className="p-2 text-right font-bold">
                          Due Date:
                        </td>
                        <td className="p-2 text-right font-bold">
                          {formData.dueDate}
                        </td>
                      </tr>
                    )}
                    {formData.interestRate && (
                      <tr>
                        <td colSpan={5} className="p-2 text-right font-bold">
                          Interest Rate on default:
                        </td>
                        <td className="p-2 text-right font-bold">
                          {formData.interestRate}%
                        </td>
                      </tr>
                    )}
                    {formData.interestRate &&
                      calculateInterestCharges() > 0 && (
                        <tr>
                          <td colSpan={5} className="p-2 text-right font-bold">
                            Interest Charges:
                          </td>
                          <td className="p-2 text-right font-bold">
                            {formatCurrency(calculateInterestCharges())}
                          </td>
                        </tr>
                      )}
                  </tfoot>
                </table>
              </div>

              {formData.signatureName && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold">
                    {formData.signatureName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formData.signatoryPosition}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Free Limit Reached
            </h3>
            <p className="text-gray-600 mb-4">
              You've created <strong>10 free receipts</strong>.
            </p>
            <p className="text-gray-600 mb-8">
              Upgrade to Pro for <strong>unlimited</strong> receipts.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-[#5247bf] text-white py-4 rounded-lg font-semibold hover:bg-[#4238a6] transition"
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

export default ReceiptCreator;

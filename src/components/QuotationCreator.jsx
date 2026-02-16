import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import { RotateCcw, Save, Lock, Loader2, LockIcon } from "lucide-react";
// ✅ Import Currency selection tools
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "quotations";

const QuotationCreator = () => {
  const { user } = useUser();
  const { canWriteTo, getLimitStatus, isPaid } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitStatus, setLimitStatus] = useState({
    reached: false,
    current: 0,
    limit: 10,
  });

  // ✅ Default to Naira (Ensure NGN is index 0 in your currencies.js)
  const defaultForm = {
    businessName: "",
    address: "",
    contactEmail: "",
    contactNumber: "",
    date: new Date().toISOString().split("T")[0],
    quotationNumber: "",
    brandColor: "#0ea5e9",
    currency: SUPPORTED_CURRENCIES[0],
    clientName: "",
    clientContact: "",
    clientLocation: "",
    clientOccupation: "",
    items: Array(10).fill({
      description: "",
      qty: "",
      unitPrice: "",
      discount: "",
    }),
    signatureName: "",
    signatoryPosition: "",
    validUntil: "",
    termsAndConditions: "",
    accountName: "",
    accountNumber: "",
    bankName: "",
  };

  const [formData, setFormData] = useState(defaultForm);

  // Load free-tier usage count
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

  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  // ✅ SAFEGUARD: This handles both new data and old data missing the currency field
  const formatCurrency = (value) => {
    // If formData.currency is missing (old data), fallback to Naira
    const activeCurrency = formData.currency || SUPPORTED_CURRENCIES[0];

    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: activeCurrency.code,
      minimumFractionDigits: 2,
    }).format(value || 0);
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
      await api.post("/quotations", {
        ...formData,
        items: formData.items.filter(
          (i) => i.description && i.qty && i.unitPrice,
        ),
        total: calculateTotal().toFixed(2),
      });

      toast.success("Quotation saved successfully!");
      handleReset();

      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save quotation");
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
    <div className="min-h-screen w-full bg-gray-50 px-2 py-6 text-gray-600">
      <div className="w-full mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Quotation
            </h1>
            {!isPaid && (
              <p className="text-sm text-gray-600 mt-1">
                {limitStatus.current}/{limitStatus.limit} free quotations used
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={loading || (limitStatus.reached && !isPaid)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                limitStatus.reached && !isPaid
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#0ea5e9] hover:bg-[#0284c7] text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : limitStatus.reached && !isPaid ? (
                <>
                  <LockIcon className="w-5 h-5" />
                  Upgrade to Continue
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Quotation
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Quotation Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                  rows={2}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                name="contactEmail"
                placeholder="Email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
              <input
                type="tel"
                name="contactNumber"
                placeholder="Phone"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                />
              </div>
              <CurrencySelector
                selectedCurrency={formData.currency || SUPPORTED_CURRENCIES[0]}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Number
              </label>
              <input
                type="text"
                name="quotationNumber"
                placeholder="QTE-001"
                value={formData.quotationNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Client Information
              </h3>
              <input
                type="text"
                name="clientName"
                placeholder="Client Name"
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  name="clientContact"
                  placeholder="Client Phone"
                  value={formData.clientContact}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                />
                <input
                  type="text"
                  name="clientLocation"
                  placeholder="Client Location"
                  value={formData.clientLocation}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Line Items
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 space-y-2"
                  >
                    <textarea
                      placeholder={`Item ${index + 1} Description`}
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0ea5e9]"
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
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0ea5e9]"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0ea5e9]"
                      />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(index, "discount", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#0ea5e9]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Terms & Validity
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until (Expiration Date)
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  name="termsAndConditions"
                  placeholder="e.g. 50% deposit required. Delivery within 2 weeks."
                  value={formData.termsAndConditions}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                  rows={3}
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Details (Optional)
              </h3>
              <input
                type="text"
                name="accountName"
                placeholder="Account Name"
                value={formData.accountName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
              <input
                type="text"
                name="accountNumber"
                placeholder="Account Number"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
              />
            </div>

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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                />
                <input
                  type="text"
                  name="signatoryPosition"
                  placeholder="Position"
                  value={formData.signatoryPosition}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div
              id="quotation-preview"
              className="bg-white p-8 border border-gray-200 rounded-lg"
            >
              <div
                className="flex justify-between items-start mb-6 pb-4"
                style={{ borderBottom: `3px solid ${formData.brandColor}` }}
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
                    QUOTATION
                  </h2>
                  {formData.quotationNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      #{formData.quotationNumber}
                    </p>
                  )}
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
                    QUOTATION FOR
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
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-right">Discount</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2 text-left">
                          {item.description || "-"}
                        </td>
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
                    <tr style={{ backgroundColor: `${formData.brandColor}20` }}>
                      <td colSpan="5" className="p-2 text-right font-bold">
                        Total Estimate:
                      </td>
                      <td
                        className="p-2 text-right font-bold"
                        style={{ color: formData.brandColor }}
                      >
                        {formatCurrency(calculateTotal())}
                      </td>
                    </tr>
                    {formData.validUntil && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-2 text-right font-semibold"
                        >
                          Valid Until:
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formData.validUntil}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {formData.termsAndConditions && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    TERMS & CONDITIONS
                  </h3>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">
                    {formData.termsAndConditions}
                  </p>
                </div>
              )}

              {(formData.accountName ||
                formData.accountNumber ||
                formData.bankName) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    PAYMENT DETAILS
                  </h3>
                  {formData.bankName && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Bank:</span>{" "}
                      {formData.bankName}
                    </p>
                  )}
                  {formData.accountNumber && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Account:</span>{" "}
                      {formData.accountNumber}
                    </p>
                  )}
                  {formData.accountName && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Name:</span>{" "}
                      {formData.accountName}
                    </p>
                  )}
                </div>
              )}

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

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Free Limit Reached
            </h3>
            <p className="text-gray-600 mb-8">
              Upgrade to Pro for unlimited quotations.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="w-full bg-[#0ea5e9] text-white py-4 rounded-lg font-semibold hover:bg-[#0284c7] transition"
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

export default QuotationCreator;

import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import { RotateCcw, Save, Lock, Loader2, LockIcon } from "lucide-react";
// ✅ Correct Import as per your instruction
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "invoices";

const InvoiceCreator = () => {
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
    invoiceNumber: "",
    brandColor: "#5247bf",
    // ✅ Initialize with Default Currency (Naira)
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
    dueDate: "",
    accountName: "",
    accountNumber: "",
    bankName: "",
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

  // ✅ Updated Dynamic Currency Formatter for Invoices
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
      await api.post("/invoices", {
        ...formData,
        items: formData.items.filter(
          (i) => i.description && i.qty && i.unitPrice,
        ),
        total: calculateTotal().toFixed(2),
      });

      toast.success("Invoice saved successfully!");
      handleReset();

      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save invoice");
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
            <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
            {!isPaid && (
              <p className="text-sm text-gray-600 mt-1">
                {limitStatus.current}/{limitStatus.limit} free invoices used
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
                    <Save className="w-5 h-5" /> Save Invoice
                  </>
                )}
              </button>
              {limitStatus.reached && !isPaid && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  You've reached 10 free invoices. Upgrade for unlimited!
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Form Side ── */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Invoice Details
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                name="contactEmail"
                placeholder="Contact Email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              />
              <input
                type="tel"
                name="contactNumber"
                placeholder="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
                />
              </div>
              {/* ✅ Currency Selector Integrated Here */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoiceNumber"
                placeholder="INV-001"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  name="clientContact"
                  placeholder="Phone"
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

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Terms (Optional)
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              />
              <input
                type="text"
                name="accountNumber"
                placeholder="Account Number"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
              />
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf]"
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

          {/* ── Preview Side ── */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div
              id="invoice-preview"
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
                    INVOICE
                  </h2>
                  {formData.invoiceNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      #{formData.invoiceNumber}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Date: {formData.date}
                  </p>
                </div>
              </div>

              {(formData.clientName ||
                formData.clientContact ||
                formData.clientLocation ||
                formData.clientOccupation) && (
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
                        Total Due:
                      </td>
                      <td
                        className="p-2 text-right font-bold"
                        style={{ color: formData.brandColor }}
                      >
                        {formatCurrency(calculateTotal())}
                      </td>
                    </tr>
                    {formData.dueDate && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-2 text-right font-semibold"
                        >
                          Due Date:
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formData.dueDate}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {(formData.accountName ||
                formData.accountNumber ||
                formData.bankName) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    BANK DETAILS
                  </h3>
                  {formData.accountName && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Account Name:</span>{" "}
                      {formData.accountName}
                    </p>
                  )}
                  {formData.accountNumber && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Account Number:</span>{" "}
                      {formData.accountNumber}
                    </p>
                  )}
                  {formData.bankName && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Bank Name:</span>{" "}
                      {formData.bankName}
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

      {/* Upgrade Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Free Limit Reached
            </h3>
            <p className="text-gray-600 mb-4">
              You've created <strong>10 free invoices</strong>.
            </p>
            <p className="text-gray-600 mb-8">
              Upgrade to Pro for <strong>unlimited</strong> invoices.
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

export default InvoiceCreator;

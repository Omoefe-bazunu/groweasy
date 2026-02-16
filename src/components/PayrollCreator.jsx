import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "react-toastify";
import api from "../lib/api";
import { RotateCcw, Save, Lock, Loader2, Plus } from "lucide-react";
// ✅ Import Currency selection tools
import CurrencySelector from "./Currency";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const COLLECTION_NAME = "payrolls";

const PayrollCreator = () => {
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
    companyName: "",
    address: "",
    payPeriod: new Date().toISOString().slice(0, 7),
    paymentDate: new Date().toISOString().split("T")[0],
    brandColor: "#10b981",
    // ✅ Initialize with Default Currency (Naira)
    currency: SUPPORTED_CURRENCIES[0],
    employeeName: "",
    employeeRole: "",
    employeeId: "",
    bankName: "",
    accountNumber: "",
    basicSalary: "",
    earnings: [{ description: "Housing Allowance", amount: "" }],
    deductions: [{ description: "Tax / PAYE", amount: "" }],
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

  const handleDynamicChange = (type, index, field, value) => {
    const updated = [...formData[type]];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, [type]: updated }));
  };

  // ✅ Currency Change Handler
  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  const addField = (type) =>
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], { description: "", amount: "" }],
    }));

  const removeField = (type, index) =>
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));

  // ✅ Dynamic Currency Formatter for Payroll
  const formatCurrency = (value) => {
    const activeCurrency = formData.currency || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: activeCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value || 0));
  };

  const calculateTotal = (items) =>
    items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const totalEarnings =
    (parseFloat(formData.basicSalary) || 0) + calculateTotal(formData.earnings);
  const totalDeductions = calculateTotal(formData.deductions);
  const netPay = totalEarnings - totalDeductions;

  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in");
    if (!formData.companyName || !formData.employeeName)
      return toast.error("Company and Employee names are required");

    const allowed = await canWriteTo(COLLECTION_NAME);
    if (!allowed) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    try {
      await api.post("/payrolls", {
        ...formData,
        totalEarnings: totalEarnings.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        netPay: netPay.toFixed(2),
      });

      toast.success("Payslip saved successfully!");
      handleReset();
      if (!isPaid) getLimitStatus(COLLECTION_NAME).then(setLimitStatus);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error(err.response?.data?.error || "Failed to save payslip");
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
              Generate Payslip
            </h1>
            {!isPaid && (
              <p className="text-sm text-gray-600 mt-1">
                {limitStatus.current}/{limitStatus.limit} free payslips
                generated
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
            <button
              onClick={handleSave}
              disabled={loading || (limitStatus.reached && !isPaid)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                limitStatus.reached && !isPaid
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#10b981] hover:bg-[#059669] text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />{" "}
                  {limitStatus.reached && !isPaid
                    ? "Upgrade to Continue"
                    : "Save Payslip"}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Form Side ── */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Company Information
              </h3>
              <input
                type="text"
                name="companyName"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
              />
              <textarea
                name="address"
                placeholder="Company Address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                rows={2}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="month"
                  name="payPeriod"
                  value={formData.payPeriod}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
                {/* ✅ Integrated CurrencySelector */}
                <CurrencySelector
                  selectedCurrency={
                    formData.currency || SUPPORTED_CURRENCIES[0]
                  }
                  onCurrencyChange={handleCurrencyChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Color
                  </label>
                  <input
                    type="color"
                    name="brandColor"
                    value={formData.brandColor}
                    onChange={handleInputChange}
                    className="w-full h-12 border rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Employee Details
              </h3>
              <input
                type="text"
                name="employeeName"
                placeholder="Employee Name"
                value={formData.employeeName}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="employeeRole"
                  placeholder="Job Title / Role"
                  value={formData.employeeRole}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
                <input
                  type="text"
                  name="employeeId"
                  placeholder="Employee ID (Optional)"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="bankName"
                  placeholder="Bank Name"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Salary & Deductions
              </h3>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Basic Salary
                </label>
                <input
                  type="number"
                  name="basicSalary"
                  placeholder="0.00"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-green-800">
                    Allowances / Bonuses
                  </h4>
                  <button
                    onClick={() => addField("earnings")}
                    className="text-xs bg-green-200 hover:bg-green-300 text-green-800 px-2 py-1 rounded flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </button>
                </div>
                {formData.earnings.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2 flex-col">
                    <div className="flex gap-2 justify-between">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          handleDynamicChange(
                            "earnings",
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="flex-1 p-2 border rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) =>
                          handleDynamicChange(
                            "earnings",
                            index,
                            "amount",
                            e.target.value,
                          )
                        }
                        className="w-28 p-2 border rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeField("earnings", index)}
                      className="bg-red-500 text-white px-4 py-2 w-full hover:bg-red-700 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-red-800">
                    Deductions (Tax, Loan, etc)
                  </h4>
                  <button
                    onClick={() => addField("deductions")}
                    className="text-xs bg-red-200 hover:bg-red-300 text-red-800 px-2 py-1 rounded flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </button>
                </div>
                {formData.deductions.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2 flex-col">
                    <div className="flex gap-2 justify-between">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          handleDynamicChange(
                            "deductions",
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="flex-1 p-2 border rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) =>
                          handleDynamicChange(
                            "deductions",
                            index,
                            "amount",
                            e.target.value,
                          )
                        }
                        className="w-28 p-2 border rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeField("deductions", index)}
                      className="bg-red-500 text-white px-4 py-2 w-full hover:bg-red-700 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Preview Side ── */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payslip Preview
            </h2>
            <div
              id="payslip-preview"
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div
                className="p-6 text-white"
                style={{ backgroundColor: formData.brandColor }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {formData.companyName || "Company Name"}
                    </h1>
                    <p className="text-sm opacity-90">
                      {formData.address || "Address"}
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold uppercase tracking-wider">
                      Payslip
                    </h2>
                    <p className="text-sm opacity-90">
                      {formData.payPeriod || "YYYY-MM"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Employee Name</p>
                    <p className="font-bold text-gray-800">
                      {formData.employeeName || "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Designation</p>
                    <p className="font-bold text-gray-800">
                      {formData.employeeRole || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-bold text-gray-800">
                      {formData.bankName || "-"}{" "}
                      {formData.accountNumber
                        ? `- ${formData.accountNumber}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Payment Date</p>
                    <p className="font-bold text-gray-800">
                      {formData.paymentDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">
                      Earnings:
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Salary</span>
                        {/* ✅ Dynamic Currency Logic */}
                        <span>{formatCurrency(formData.basicSalary)}</span>
                      </div>
                      {formData.earnings.map((e, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{e.description || "-"}</span>
                          <span>{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t mt-2">
                        <span>Total Earnings</span>
                        <span className="text-green-600">
                          {formatCurrency(totalEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">
                      Deductions:
                    </h3>
                    <div className="space-y-2 text-sm">
                      {formData.deductions.map((d, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{d.description || "-"}</span>
                          <span>{formatCurrency(d.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t mt-2">
                        <span>Total Deductions</span>
                        <span className="text-red-600">
                          {formatCurrency(totalDeductions)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-6 flex justify-between items-center border-t">
                <p className="text-gray-600 font-medium">Net Payable</p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: formData.brandColor }}
                >
                  {formatCurrency(netPay)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Limit Reached</h3>
            <p className="mb-6 text-gray-600">
              Upgrade to generate unlimited payslips.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="bg-[#10b981] text-white w-full py-3 rounded hover:bg-[#059669]"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollCreator;

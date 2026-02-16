import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import {
  Search,
  Calendar,
  Plus,
  Download,
  Trash2,
  Lock,
  Loader2,
  FileImage,
} from "lucide-react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../lib/api";
// ✅ Import supported currencies for fallback logic
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const PayrollList = () => {
  const { user } = useUser();
  const { isPaid } = useSubscription();

  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, [user]);

  useEffect(() => {
    filterPayrolls();
  }, [searchText, searchMonth, payrolls]);

  const fetchPayrolls = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/payrolls");
      setPayrolls(res.data.payrolls);
      setFilteredPayrolls(res.data.payrolls);
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      toast.error("Failed to load payroll history");
    } finally {
      setLoading(false);
    }
  };

  const filterPayrolls = () => {
    let filtered = [...payrolls];
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.employeeName?.toLowerCase().includes(lower) ||
          p.companyName?.toLowerCase().includes(lower),
      );
    }
    if (searchMonth) {
      filtered = filtered.filter((p) => p.payPeriod === searchMonth);
    }
    setFilteredPayrolls(filtered);
  };

  const formatCurrencyValue = (value, currencyObj) => {
    const activeCurrency = currencyObj || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: activeCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value || 0));
  };

  const handleDelete = async (id) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }
    if (!window.confirm("Delete this payslip?")) return;

    setDeleting(id);
    try {
      await api.delete(`/payrolls/${id}`);
      setPayrolls((prev) => prev.filter((p) => p.id !== id));
      toast.success("Payslip deleted");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Delete failed");
      }
    } finally {
      setDeleting(null);
    }
  };

  // ── Download Helpers ───────────────────────────────────────────────────────

  const downloadAsImage = async (data) => {
    setDownloading(data.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generatePayslipHTML(data);
      tempDiv.style.cssText = "position:absolute;left:-9999px;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `payslip_${data.employeeName}_${data.payPeriod}.png`;
      link.click();

      document.body.removeChild(tempDiv);
      toast.success("Downloaded as Image");
    } catch (err) {
      toast.error("Image download failed");
    } finally {
      setDownloading(null);
    }
  };

  const downloadPDF = async (data) => {
    setDownloading(data.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generatePayslipHTML(data);
      tempDiv.style.cssText = "position:absolute;left:-9999px;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        imgWidth,
        (canvas.height * imgWidth) / canvas.width,
      );
      pdf.save(`payslip_${data.employeeName}_${data.payPeriod}.pdf`);
      document.body.removeChild(tempDiv);
      toast.success("Downloaded as PDF");
    } catch (err) {
      toast.error("PDF download failed");
    } finally {
      setDownloading(null);
    }
  };

  const generatePayslipHTML = (data) => {
    const curr = data.currency || SUPPORTED_CURRENCIES[0];
    const format = (val) =>
      new Intl.NumberFormat(curr.locale, {
        style: "currency",
        currency: curr.code,
        minimumFractionDigits: 2,
      }).format(parseFloat(val || 0));

    return `
      <div style="width:800px;font-family:sans-serif;background:white;color:black;border:1px solid #ddd;">
        <div style="background:${data.brandColor};color:white;padding:30px;display:flex;justify-content:space-between;">
          <div>
            <h1 style="margin:0;font-size:26px;font-weight:bold;color:white;">${data.companyName}</h1>
            <p style="margin:5px 0 0;opacity:0.9;color:white;">${data.address}</p>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0;font-size:22px;font-weight:bold;color:white;">PAYSLIP</h2>
            <p style="margin:5px 0 0;color:white;">Period: ${data.payPeriod}</p>
          </div>
        </div>
        
        <div style="padding:25px;background:#ffffff;">
          <table style="width:100%;font-size:14px;color:#000000;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#555;">Employee Name:</td>
              <td style="padding:8px 0;font-weight:bold;">${data.employeeName}</td>
              <td style="padding:8px 0;color:#555;text-align:right;">Role:</td>
              <td style="padding:8px 0;font-weight:bold;text-align:right;">${data.employeeRole}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;color:#555;">Bank:</td>
              <td style="padding:8px 0;font-weight:bold;">${data.bankName}</td>
              <td style="padding:8px 0;color:#555;text-align:right;">Account:</td>
              <td style="padding:8px 0;font-weight:bold;text-align:right;">${data.accountNumber}</td>
            </tr>
          </table>
        </div>

        <div style="padding:0 25px 25px;display:flex;gap:40px;">
          <div style="flex:1;">
            <h3 style="border-bottom:2px solid ${data.brandColor};padding-bottom:10px;color:#000000;font-size:16px;">Earnings</h3>
            <table style="width:100%;font-size:14px;color:#000000;margin-top:10px;">
              <tr><td style="padding:6px 0;">Basic Salary</td><td style="text-align:right;font-weight:600;">${format(data.basicSalary)}</td></tr>
              ${(data.earnings || [])
                .map(
                  (e) => `
                <tr><td style="padding:6px 0;">${e.description}</td><td style="text-align:right;font-weight:600;">${format(e.amount)}</td></tr>
              `,
                )
                .join("")}
              <tr style="font-weight:bold;font-size:15px;">
                <td style="padding-top:15px;border-top:1px solid #ddd;">Total Earnings</td>
                <td style="padding-top:15px;border-top:1px solid #ddd;text-align:right;color:#059669;">${format(data.totalEarnings)}</td>
              </tr>
            </table>
          </div>
          
          <div style="flex:1;">
            <h3 style="border-bottom:2px solid #ef4444;padding-bottom:10px;color:#000000;font-size:16px;">Deductions</h3>
            <table style="width:100%;font-size:14px;color:#000000;margin-top:10px;">
              ${(data.deductions || [])
                .map(
                  (d) => `
                <tr><td style="padding:6px 0;">${d.description}</td><td style="text-align:right;font-weight:600;">${format(d.amount)}</td></tr>
              `,
                )
                .join("")}
              <tr style="font-weight:bold;font-size:15px;">
                <td style="padding-top:15px;border-top:1px solid #ddd;">Total Deductions</td>
                <td style="padding-top:15px;border-top:1px solid #ddd;text-align:right;color:#dc2626;">${format(data.totalDeductions)}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background:#f9fafb;padding:30px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #eee;">
          <span style="font-weight:bold;color:#374151;font-size:16px;text-transform:uppercase;">Net Payable</span>
          <span style="font-size:28px;font-weight:bold;color:${data.brandColor};">${format(data.netPay)}</span>
        </div>
      
      </div>`;
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-[#10b981] rounded-full animate-pulse" />
          <span className="h-3 w-3 bg-[#10b981] rounded-full animate-pulse delay-200" />
          <span className="h-3 w-3 bg-[#10b981] rounded-full animate-pulse delay-400" />
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 pt-6 pb-30 text-gray-600">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payroll History</h1>
          <button
            onClick={() => (window.location.href = "/payroll")}
            className="flex items-center gap-2 bg-[#10b981] text-white px-6 py-3 rounded-lg hover:bg-[#059669] transition"
          >
            <Plus className="w-5 h-5" /> New Payslip
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employee or company..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#10b981] outline-none"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="month"
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#10b981] outline-none"
            />
          </div>
        </div>

        {filteredPayrolls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No payslips found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayrolls.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border-t-4"
                style={{ borderColor: item.brandColor || "#10b981" }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">
                      {item.employeeName}
                    </h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {item.payPeriod}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 truncate">
                    {item.companyName}
                  </p>

                  <div className="flex justify-between items-end border-t pt-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Net Pay</p>
                      <p className="text-xl font-bold text-gray-800">
                        {formatCurrencyValue(item.netPay, item.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadAsImage(item)}
                      disabled={downloading === item.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded transition disabled:opacity-50"
                    >
                      <FileImage className="w-3.5 h-3.5" /> IMAGE
                    </button>
                    <button
                      onClick={() => downloadPDF(item)}
                      disabled={downloading === item.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#10b981] text-white text-xs font-bold py-2 rounded hover:bg-[#059669] transition disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={!isPaid || deleting === item.id}
                      className={`p-2 rounded transition ${
                        !isPaid
                          ? "bg-gray-100 text-gray-400"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                    >
                      {deleting === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-2xl">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Feature Locked</h3>
            <p className="mb-6 text-gray-600">
              Upgrade to generate and manage unlimited payslips for your
              employees.
            </p>
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="bg-[#10b981] text-white w-full py-3 rounded-lg font-bold hover:bg-[#059669]"
            >
              Subscribe Now
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="mt-4 text-gray-400 hover:text-gray-600 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollList;

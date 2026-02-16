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
} from "lucide-react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../lib/api";

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

  // ✅ Fetch from backend
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

  // ✅ Delete via backend
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

  // ── Download (client-side only) ───────────────────────────────────────────
  const downloadPDF = async (data) => {
    setDownloading(data.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generatePayslipHTML(data);
      tempDiv.style.cssText = "position:absolute;left:-9999px;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 2 });
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
      toast.success("Downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const generatePayslipHTML = (data) => {
    const format = (val) =>
      parseFloat(val || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      });

    return `
      <div style="width:800px;font-family:sans-serif;background:white;border:1px solid #ccc;">
        <div style="background:${data.brandColor};color:white;padding:20px;display:flex;justify-content:space-between;">
          <div>
            <h1 style="margin:0;font-size:24px;">${data.companyName}</h1>
            <p style="margin:5px 0 0;opacity:0.9;">${data.address}</p>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0;font-size:20px;">PAYSLIP</h2>
            <p style="margin:5px 0 0;">Period: ${data.payPeriod}</p>
          </div>
        </div>
        <div style="padding:20px;background:#f8f9fa;border-bottom:1px solid #eee;">
          <table style="width:100%;font-size:14px;">
            <tr>
              <td style="color:#666;">Employee Name:</td>
              <td style="font-weight:bold;">${data.employeeName}</td>
              <td style="color:#666;text-align:right;">Role:</td>
              <td style="font-weight:bold;text-align:right;">${data.employeeRole}</td>
            </tr>
            <tr>
              <td style="color:#666;">Bank:</td>
              <td style="font-weight:bold;">${data.bankName}</td>
              <td style="color:#666;text-align:right;">Account:</td>
              <td style="font-weight:bold;text-align:right;">${data.accountNumber}</td>
            </tr>
          </table>
        </div>
        <div style="padding:20px;display:flex;gap:40px;">
          <div style="flex:1;">
            <h3 style="border-bottom:2px solid #eee;padding-bottom:10px;color:#444;">Earnings</h3>
            <table style="width:100%;font-size:14px;">
              <tr><td style="padding:5px 0;">Basic Salary</td><td style="text-align:right;">₦${format(data.basicSalary)}</td></tr>
              ${(data.earnings || []).map((e) => `<tr><td style="padding:5px 0;">${e.description}</td><td style="text-align:right;">₦${format(e.amount)}</td></tr>`).join("")}
              <tr style="font-weight:bold;">
                <td style="padding-top:10px;border-top:1px solid #eee;">Total Earnings</td>
                <td style="padding-top:10px;border-top:1px solid #eee;text-align:right;color:green;">₦${format(data.totalEarnings)}</td>
              </tr>
            </table>
          </div>
          <div style="flex:1;">
            <h3 style="border-bottom:2px solid #eee;padding-bottom:10px;color:#444;">Deductions</h3>
            <table style="width:100%;font-size:14px;">
              ${(data.deductions || []).map((d) => `<tr><td style="padding:5px 0;">${d.description}</td><td style="text-align:right;">₦${format(d.amount)}</td></tr>`).join("")}
              <tr style="font-weight:bold;">
                <td style="padding-top:10px;border-top:1px solid #eee;">Total Deductions</td>
                <td style="padding-top:10px;border-top:1px solid #eee;text-align:right;color:red;">₦${format(data.totalDeductions)}</td>
              </tr>
            </table>
          </div>
        </div>
        <div style="background:#eee;padding:20px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:bold;color:#555;">NET PAYABLE</span>
          <span style="font-size:24px;font-weight:bold;color:${data.brandColor};">₦${format(data.netPay)}</span>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payroll History</h1>
          <button
            onClick={() => (window.location.href = "/payroll")}
            className="flex items-center gap-2 bg-[#10b981] text-white px-6 py-3 rounded-lg hover:bg-[#059669]"
          >
            <Plus className="w-5 h-5" /> New Payslip
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employee or company..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="month"
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#10b981]"
            />
          </div>
        </div>

        {/* Empty state */}
        {filteredPayrolls.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No payslips found</p>
            {!searchText && !searchMonth && (
              <button
                onClick={() => (window.location.href = "/payroll")}
                className="mt-4 bg-[#10b981] text-white px-6 py-3 rounded-lg hover:bg-[#059669]"
              >
                Create Your First Payslip
              </button>
            )}
          </div>
        )}

        {/* Grid */}
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
                <p className="text-sm text-gray-500 mb-1">{item.companyName}</p>
                {item.employeeRole && (
                  <p className="text-xs text-gray-400 mb-4">
                    {item.employeeRole}
                  </p>
                )}
                <div className="flex justify-between items-end border-t pt-4">
                  <div>
                    <p className="text-xs text-gray-400">Net Pay</p>
                    <p className="text-xl font-bold text-gray-800">
                      ₦{parseFloat(item.netPay || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadPDF(item)}
                      disabled={downloading === item.id}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                    >
                      {downloading === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={!isPaid || deleting === item.id}
                      title={!isPaid ? "Upgrade to delete" : "Delete"}
                      className={`p-2 rounded transition flex items-center justify-center ${
                        !isPaid
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-50 hover:bg-red-100 text-red-500"
                      } disabled:opacity-70`}
                    >
                      {deleting === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : !isPaid ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPayrolls.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredPayrolls.length} of {payrolls.length} payslip(s)
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
                Deleting items is a <strong>Pro</strong> feature. Upgrade to
                manage your data freely.
              </p>
              <button
                onClick={() => (window.location.href = "/subscribe")}
                className="w-full bg-[#10b981] text-white py-3 rounded-lg font-semibold hover:bg-[#059669] transition"
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
    </div>
  );
};

export default PayrollList;

import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import {
  Search,
  Calendar,
  FileText,
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
// ✅ Import supported currencies for fallback logic
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const ReceiptsList = () => {
  const { user } = useUser();
  const { isPaid } = useSubscription();

  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [user]);
  useEffect(() => {
    filterReceipts();
  }, [searchText, searchDate, receipts]);

  // ✅ Fetch from backend
  const fetchReceipts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/receipts");
      setReceipts(res.data.receipts);
      setFilteredReceipts(res.data.receipts);
    } catch (err) {
      console.error("Error fetching receipts:", err);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  const filterReceipts = () => {
    let filtered = [...receipts];
    if (searchText) {
      filtered = filtered.filter(
        (r) =>
          r.businessName?.toLowerCase().includes(searchText.toLowerCase()) ||
          r.address?.toLowerCase().includes(searchText.toLowerCase()) ||
          r.clientName?.toLowerCase().includes(searchText.toLowerCase()) ||
          r.paymentMethod?.toLowerCase().includes(searchText.toLowerCase()) ||
          r.signatureName?.toLowerCase().includes(searchText.toLowerCase()) ||
          r.items?.some((item) =>
            item.details?.toLowerCase().includes(searchText.toLowerCase()),
          ),
      );
    }
    if (searchDate) {
      filtered = filtered.filter((r) => r.date === searchDate);
    }
    setFilteredReceipts(filtered);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  // ✅ Dynamic Currency Formatter with fallback to Naira
  const formatCurrencyValue = (value, currencyObj) => {
    const curr = currencyObj || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value || 0));
  };

  const calculateBalance = (total, amountPaid) =>
    (parseFloat(total) - parseFloat(amountPaid || 0)).toFixed(2);

  const calculateInterestCharges = (receipt) => {
    if (!receipt.dueDate || !receipt.interestRate) return 0;
    const today = new Date();
    const dueDate = new Date(receipt.dueDate);
    if (today <= dueDate) return 0;
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const balance = parseFloat(
      calculateBalance(receipt.total, receipt.amountPaid),
    );
    const dailyRate = parseFloat(receipt.interestRate) / 100 / 365;
    return (balance * dailyRate * daysOverdue).toFixed(2);
  };

  // ✅ Delete via backend
  const deleteReceipt = async (id) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }
    if (!window.confirm("Delete this receipt? This cannot be undone.")) return;

    setDeleting(id);
    try {
      await api.delete(`/receipts/${id}`);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      toast.success("Receipt deleted successfully!");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to delete receipt");
      }
    } finally {
      setDeleting(null);
    }
  };

  // ── Download helpers ──────────────────────────────────────────────────────
  const downloadAsImage = async (receipt) => {
    setDownloading(receipt.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateReceiptHTML(receipt);
      tempDiv.style.cssText = "position:absolute;left:-9999px;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `receipt_${receipt.date}_${receipt.businessName}.png`;
      link.click();
      document.body.removeChild(tempDiv);
      toast.success("Downloaded as image!");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAsPDF = async (receipt) => {
    setDownloading(receipt.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateReceiptHTML(receipt);
      tempDiv.style.cssText = "position:absolute;left:-9999px;";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
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
      pdf.save(`receipt_${receipt.date}_${receipt.businessName}.pdf`);
      document.body.removeChild(tempDiv);
      toast.success("Downloaded as PDF!");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const generateReceiptHTML = (receipt) => {
    const curr = receipt.currency || SUPPORTED_CURRENCIES[0];
    const formatter = new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const format = (val) => formatter.format(parseFloat(val || 0));

    return `
    <div style="width:800px;padding:40px;font-family:Arial,sans-serif;background:white;color:black;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;border-bottom:3px solid ${receipt.brandColor || "#000"};padding-bottom:16px;">
        <div style="flex:1;">
          <h1 style="font-size:24px;font-weight:bold;color:${receipt.brandColor || "#000"};margin:0;">${receipt.businessName || "Business Name"}</h1>
          <p style="font-size:14px;color:#666;margin:4px 0;">${receipt.address || "Address"}</p>
          ${receipt.contactEmail ? `<p style="font-size:14px;color:#666;margin:4px 0;">${receipt.contactEmail}</p>` : ""}
          ${receipt.contactNumber ? `<p style="font-size:14px;color:#666;margin:4px 0;">${receipt.contactNumber}</p>` : ""}
        </div>
        <div style="text-align:right;">
          <h2 style="font-size:20px;font-weight:bold;color:${receipt.brandColor || "#000"};margin:0;">RECEIPT</h2>
          <p style="font-size:14px;color:#666;margin:4px 0;">Date: ${receipt.date}</p>
        </div>
      </div>
      ${
        receipt.clientName ||
        receipt.clientContact ||
        receipt.clientLocation ||
        receipt.clientOccupation
          ? `
        <div style="margin-bottom:24px;padding:16px;background-color:#f5f5f5;border-radius:8px;">
          <h3 style="font-size:14px;font-weight:bold;color:#333;margin:0 0 8px 0;">CLIENT INFORMATION</h3>
          ${receipt.clientName ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:600;">Name:</span> ${receipt.clientName}</p>` : ""}
          ${receipt.clientContact ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:600;">Contact:</span> ${receipt.clientContact}</p>` : ""}
          ${receipt.clientLocation ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:600;">Location:</span> ${receipt.clientLocation}</p>` : ""}
          ${receipt.clientOccupation ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:600;">Occupation:</span> ${receipt.clientOccupation}</p>` : ""}
        </div>`
          : ""
      }
      <table style="width:100%;font-size:14px;margin-bottom:16px;border-collapse:collapse;">
        <thead>
          <tr style="background-color:${receipt.brandColor || "#000"};color:white;">
            <th style="padding:8px;text-align:left;border:1px solid #ddd;">Details</th>
            <th style="padding:8px;text-align:center;border:1px solid #ddd;">Qty</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Unit Price</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Amount</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Discount</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Final</th>
          </tr>
        </thead>
        <tbody>
          ${(receipt.items || [])
            .map(
              (item) => `
            <tr style="border-bottom:1px solid #ddd;">
              <td style="padding:8px;text-align:left;border:1px solid #ddd;">${item.details || "-"}</td>
              <td style="padding:8px;text-align:center;border:1px solid #ddd;">${item.qty || "-"}</td>
              <td style="padding:8px;text-align:right;border:1px solid #ddd;">${item.unitPrice ? format(item.unitPrice) : "-"}</td>
              <td style="padding:8px;text-align:right;border:1px solid #ddd;">${item.qty && item.unitPrice ? format(parseFloat(item.qty) * parseFloat(item.unitPrice)) : "-"}</td>
              <td style="padding:8px;text-align:right;border:1px solid #ddd;">${item.discount ? format(item.discount) : "-"}</td>
              <td style="padding:8px;text-align:right;font-weight:bold;border:1px solid #ddd;">${item.qty && item.unitPrice ? format(parseFloat(item.qty) * parseFloat(item.unitPrice) - (parseFloat(item.discount) || 0)) : "-"}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr style="background-color:#f5f5f5;">
            <td colspan="5" style="padding:8px;text-align:right;font-weight:bold;border:1px solid #ddd;">Total:</td>
            <td style="padding:8px;text-align:right;font-weight:bold;color:${receipt.brandColor || "#000"};border:1px solid #ddd;">${format(receipt.total)}</td>
          </tr>
          <tr>
            <td colspan="5" style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">Amount Paid:</td>
            <td style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">${format(receipt.amountPaid || "0")}${receipt.paymentMethod ? `<span style="display:block;font-size:12px;color:#666;">(${receipt.paymentMethod})</span>` : ""}</td>
          </tr>
          <tr style="background-color:#f5f5f5;">
            <td colspan="5" style="padding:8px;text-align:right;font-weight:bold;border:1px solid #ddd;">Balance Outstanding:</td>
            <td style="padding:8px;text-align:right;font-weight:bold;color:${receipt.brandColor || "#000"};border:1px solid #ddd;">${format(calculateBalance(receipt.total, receipt.amountPaid))}</td>
          </tr>
          ${receipt.dueDate ? `<tr><td colspan="5" style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">Due Date:</td><td style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">${receipt.dueDate}</td></tr>` : ""}
          ${receipt.interestRate ? `<tr><td colspan="5" style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">Interest Rate:</td><td style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">${receipt.interestRate}%</td></tr>` : ""}
          ${receipt.interestRate && calculateInterestCharges(receipt) > 0 ? `<tr><td colspan="5" style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">Interest Charges:</td><td style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">${format(calculateInterestCharges(receipt))}</td></tr>` : ""}
        </tfoot>
      </table>
      ${
        receipt.signatureName || receipt.signatoryPosition
          ? `
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #ddd;">
          <p style="font-size:14px;font-weight:600;margin:0;">${receipt.signatureName || ""}</p>
          <p style="font-size:12px;color:#666;margin:4px 0;">${receipt.signatoryPosition || ""}</p>
        </div>`
          : ""
      }
    </div>`;
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse" />
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse delay-200" />
          <span className="h-3 w-3 bg-[#5247bf] rounded-full animate-pulse delay-400" />
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-6 pb-30 text-gray-600">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600 mt-1">Manage all your receipts</p>
          </div>
          <button
            onClick={() => (window.location.href = "/receipts")}
            className="flex items-center gap-2 bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Receipt
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by business name, client, items..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredReceipts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No receipts found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchText || searchDate
                ? "Try adjusting your search filters"
                : "Create your first receipt to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border-t-4"
                style={{ borderColor: receipt.brandColor || "#5247bf" }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {receipt.businessName}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {receipt.address}
                      </p>
                      {receipt.clientName && (
                        <p className="text-xs text-gray-500 mt-2">
                          Client: {receipt.clientName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{receipt.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {receipt.items?.filter((i) => i.details).length || 0}{" "}
                        item(s)
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: receipt.brandColor || "#5247bf" }}
                      >
                        {/* ✅ Dynamic Formatting for Total */}
                        {formatCurrencyValue(receipt.total, receipt.currency)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Balance: </span>
                      <span className="font-semibold">
                        {/* ✅ Dynamic Formatting for Balance */}
                        {formatCurrencyValue(
                          calculateBalance(receipt.total, receipt.amountPaid),
                          receipt.currency,
                        )}
                      </span>
                    </div>
                    {receipt.interestRate &&
                      calculateInterestCharges(receipt) > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">
                            Interest Charges:{" "}
                          </span>
                          <span className="font-semibold">
                            {/* ✅ Dynamic Formatting for Interest */}
                            {formatCurrencyValue(
                              calculateInterestCharges(receipt),
                              receipt.currency,
                            )}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => downloadAsImage(receipt)}
                      disabled={downloading === receipt.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" /> Image
                    </button>
                    <button
                      onClick={() => downloadAsPDF(receipt)}
                      disabled={downloading === receipt.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#5247bf] hover:bg-[#4238a6] text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                    <button
                      onClick={() => deleteReceipt(receipt.id)}
                      disabled={!isPaid || deleting === receipt.id}
                      className={`flex items-center justify-center gap-1 text-sm font-medium py-2 px-3 rounded transition-colors ${
                        !isPaid
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-100 hover:bg-red-200 text-red-700"
                      } disabled:opacity-70`}
                    >
                      {deleting === receipt.id ? (
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
            ))}
          </div>
        )}

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
    </div>
  );
};

export default ReceiptsList;

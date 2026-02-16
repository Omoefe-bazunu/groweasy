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
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const QuotationsList = () => {
  const { user } = useUser();
  const { isPaid } = useSubscription();

  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, [user]);

  useEffect(() => {
    filterQuotations();
  }, [searchText, searchDate, quotations]);

  const fetchQuotations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/quotations");
      setQuotations(res.data.quotations);
      setFilteredQuotations(res.data.quotations);
    } catch (err) {
      console.error("Error fetching quotations:", err);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];
    if (searchText) {
      filtered = filtered.filter(
        (q) =>
          q.businessName?.toLowerCase().includes(searchText.toLowerCase()) ||
          q.quotationNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
          q.clientName?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
    if (searchDate) {
      filtered = filtered.filter((q) => q.date === searchDate);
    }
    setFilteredQuotations(filtered);
  };

  const deleteQuotation = async (id) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }
    if (!window.confirm("Delete this quotation?")) return;

    setDeleting(id);
    try {
      await api.delete(`/quotations/${id}`);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quotation deleted");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to delete quotation");
      }
    } finally {
      setDeleting(null);
    }
  };

  // ✅ Reusable helper for dynamic currency formatting
  const formatCurrencyValue = (value, currencyObj) => {
    const curr = currencyObj || SUPPORTED_CURRENCIES[0]; // Fallback to NGN
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const downloadAsImage = async (quotation) => {
    setDownloading(quotation.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateQuotationHTML(quotation);
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `quotation_${quotation.quotationNumber || quotation.date}.png`;
      link.click();

      document.body.removeChild(tempDiv);
      toast.success("Downloaded as image!");
    } catch (err) {
      toast.error("Failed to download image");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAsPDF = async (quotation) => {
    setDownloading(quotation.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateQuotationHTML(quotation);
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
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
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`quotation_${quotation.quotationNumber || quotation.date}.pdf`);

      document.body.removeChild(tempDiv);
      toast.success("Downloaded as PDF!");
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const generateQuotationHTML = (data) => {
    const curr = data.currency || SUPPORTED_CURRENCIES[0];

    // Internal helper to keep the template clean
    const format = (val) =>
      new Intl.NumberFormat(curr.locale, {
        style: "currency",
        currency: curr.code,
        minimumFractionDigits: 2,
      }).format(val || 0);

    return `
    <div style="width: 800px; padding: 40px; font-family: Arial, sans-serif; background: white; color: black;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; border-bottom: 3px solid ${data.brandColor}; padding-bottom: 16px;">
        <div style="flex: 1;">
          <h1 style="font-size: 24px; font-weight: bold; color: ${data.brandColor}; margin: 0;">${data.businessName || "Business Name"}</h1>
          <p style="font-size: 14px; color: #666; margin: 4px 0;">${data.address || "Address"}</p>
          ${data.contactEmail ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">${data.contactEmail}</p>` : ""}
          ${data.contactNumber ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">${data.contactNumber}</p>` : ""}
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 20px; font-weight: bold; color: ${data.brandColor}; margin: 0;">QUOTATION</h2>
          ${data.quotationNumber ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">#${data.quotationNumber}</p>` : ""}
          <p style="font-size: 14px; color: #666; margin: 4px 0;">Date: ${data.date}</p>
        </div>
      </div>

      ${
        data.clientName || data.clientContact || data.clientLocation
          ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px;">QUOTATION FOR</h3>
          ${data.clientName ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Name:</span> ${data.clientName}</p>` : ""}
          ${data.clientContact ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Contact:</span> ${data.clientContact}</p>` : ""}
          ${data.clientLocation ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Location:</span> ${data.clientLocation}</p>` : ""}
        </div>
      `
          : ""
      }

      ${
        data.accountName || data.accountNumber || data.bankName
          ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px;">PAYMENT DETAILS</h3>
          ${data.bankName ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Bank Name:</span> ${data.bankName}</p>` : ""}
          ${data.accountNumber ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Account Number:</span> ${data.accountNumber}</p>` : ""}
          ${data.accountName ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Account Name:</span> ${data.accountName}</p>` : ""}
        </div>
      `
          : ""
      }

      <table style="width: 100%; font-size: 14px; margin-bottom: 16px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: ${data.brandColor}; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Description</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Discount</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(data.items || [])
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${item.description || "-"}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.qty || "-"}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${item.unitPrice ? format(item.unitPrice) : "-"}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                ${item.qty && item.unitPrice ? format(parseFloat(item.qty) * parseFloat(item.unitPrice)) : "-"}
              </td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${item.discount ? format(item.discount) : "-"}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">
                ${item.qty && item.unitPrice ? format(parseFloat(item.qty) * parseFloat(item.unitPrice) - (parseFloat(item.discount) || 0)) : "-"}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr style="background-color: #f5f5f5;">
            <td colspan="5" style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Total Estimate:</td>
            <td style="padding: 8px; text-align: right; font-weight: bold; color: ${data.brandColor}; border: 1px solid #ddd;">
              ${format(data.total)}
            </td>
          </tr>
          ${
            data.validUntil
              ? `
            <tr>
              <td colspan="5" style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">Valid Until:</td>
              <td style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">${data.validUntil}</td>
            </tr>
          `
              : ""
          }
        </tfoot>
      </table>

      ${
        data.termsAndConditions
          ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
          <h4 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #444;">TERMS & CONDITIONS</h4>
          <p style="font-size: 12px; color: #555; white-space: pre-wrap; line-height: 1.5;">${data.termsAndConditions}</p>
        </div>
      `
          : ""
      }

      ${
        data.signatureName
          ? `
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; font-weight: 600; margin: 0;">${data.signatureName}</p>
          ${data.signatoryPosition ? `<p style="font-size: 12px; color: #666; margin: 4px 0;">${data.signatoryPosition}</p>` : ""}
        </div>
      `
          : ""
      }
    </div>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0ea5e9]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 pt-6 pb-30 text-gray-600">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
            <p className="text-gray-600 mt-1">
              Manage and track your estimates
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/quotations")}
            className="flex items-center gap-2 bg-[#0ea5e9] text-white px-6 py-3 rounded-lg hover:bg-[#0284c7] transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Quotation
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search client, business or number..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] focus:outline-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No quotations found
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotations.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border-t-4"
                style={{ borderColor: q.brandColor || "#0ea5e9" }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {q.clientName || "Unknown Client"}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{q.businessName}</p>

                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm font-medium">{q.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total Estimate</p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: q.brandColor }}
                      >
                        {/* ✅ Dynamic Currency in Grid Card */}
                        {formatCurrencyValue(q.total, q.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => downloadAsImage(q)}
                      disabled={downloading === q.id || deleting === q.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === q.id ? "..." : "Image"}
                    </button>

                    <button
                      onClick={() => downloadAsPDF(q)}
                      disabled={downloading === q.id || deleting === q.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#0ea5e9] text-white hover:bg-[#0284c7] text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === q.id ? "..." : "PDF"}
                    </button>

                    <button
                      onClick={() => deleteQuotation(q.id)}
                      disabled={
                        !isPaid || deleting === q.id || downloading === q.id
                      }
                      className={`flex items-center justify-center gap-1 text-sm font-medium py-2 px-3 rounded transition-colors ${
                        !isPaid
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-100 hover:bg-red-200 text-red-700"
                      } disabled:opacity-70`}
                      title={!isPaid ? "Upgrade to delete items" : "Delete"}
                    >
                      {deleting === q.id ? (
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
                className="w-full bg-[#0ea5e9] text-white py-3 rounded-lg font-semibold hover:bg-[#0284c7] transition"
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

export default QuotationsList;

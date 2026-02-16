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

const InvoicesList = () => {
  const { user } = useUser();
  const { isPaid } = useSubscription();

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [user]);
  useEffect(() => {
    filterInvoices();
  }, [searchText, searchDate, invoices]);

  // ✅ Fetch from backend
  const fetchInvoices = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data.invoices);
      setFilteredInvoices(res.data.invoices);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    if (searchText) {
      filtered = filtered.filter(
        (inv) =>
          inv.businessName?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.address?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.invoiceNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.clientName?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.clientContact?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.clientLocation
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          inv.clientOccupation
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          inv.accountName?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.accountNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.bankName?.toLowerCase().includes(searchText.toLowerCase()) ||
          inv.signatureName?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
    if (searchDate) {
      filtered = filtered.filter((inv) => inv.date === searchDate);
    }
    setFilteredInvoices(filtered);
  };

  const formatCurrency = (value) =>
    parseFloat(value || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ✅ Delete via backend
  const deleteInvoice = async (id) => {
    if (!isPaid) {
      setShowLimitModal(true);
      return;
    }
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;

    setDeleting(id);
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted successfully!");
    } catch (err) {
      if (err.response?.status === 403) {
        setShowLimitModal(true);
      } else {
        toast.error("Failed to delete invoice");
      }
    } finally {
      setDeleting(null);
    }
  };

  // ── Download helpers (client-side only) ──────────────────────────────────
  const downloadAsImage = async (invoice) => {
    setDownloading(invoice.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateInvoiceHTML(invoice);
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
      link.download = `invoice_${invoice.invoiceNumber || invoice.date}.png`;
      link.click();
      document.body.removeChild(tempDiv);
      toast.success("Downloaded as image!");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAsPDF = async (invoice) => {
    setDownloading(invoice.id);
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateInvoiceHTML(invoice);
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
      pdf.save(`invoice_${invoice.invoiceNumber || invoice.date}.pdf`);
      document.body.removeChild(tempDiv);
      toast.success("Downloaded as PDF!");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const generateInvoiceHTML = (invoice) => `
    <div style="width:800px;padding:40px;font-family:Arial,sans-serif;background:white;color:black;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;border-bottom:3px solid ${invoice.brandColor || "#000"};padding-bottom:16px;">
        <div style="flex:1;">
          <h1 style="font-size:24px;font-weight:bold;color:${invoice.brandColor || "#000"};margin:0;">${invoice.businessName || "Business Name"}</h1>
          <p style="font-size:14px;color:#666;margin:4px 0;">${invoice.address || "Address"}</p>
          ${invoice.contactEmail ? `<p style="font-size:14px;color:#666;margin:4px 0;">${invoice.contactEmail}</p>` : ""}
          ${invoice.contactNumber ? `<p style="font-size:14px;color:#666;margin:4px 0;">${invoice.contactNumber}</p>` : ""}
        </div>
        <div style="text-align:right;">
          <h2 style="font-size:20px;font-weight:bold;color:${invoice.brandColor || "#000"};margin:0;">INVOICE</h2>
          ${invoice.invoiceNumber ? `<p style="font-size:14px;color:#666;margin:4px 0;">#${invoice.invoiceNumber}</p>` : ""}
          <p style="font-size:14px;color:#666;margin:4px 0;">Date: ${invoice.date}</p>
        </div>
      </div>
      ${
        invoice.clientName ||
        invoice.clientContact ||
        invoice.clientLocation ||
        invoice.clientOccupation
          ? `
        <div style="margin-bottom:24px;padding:16px;background-color:#f5f5f5;border-radius:8px;">
          <h3 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px;">CLIENT INFORMATION</h3>
          ${invoice.clientName ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Name:</span> ${invoice.clientName}</p>` : ""}
          ${invoice.clientContact ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Contact:</span> ${invoice.clientContact}</p>` : ""}
          ${invoice.clientLocation ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Location:</span> ${invoice.clientLocation}</p>` : ""}
          ${invoice.clientOccupation ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Occupation:</span> ${invoice.clientOccupation}</p>` : ""}
        </div>`
          : ""
      }
      ${
        invoice.accountName || invoice.accountNumber || invoice.bankName
          ? `
        <div style="margin-bottom:24px;padding:16px;background-color:#f5f5f5;border-radius:8px;">
          <h3 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px;">BANK DETAILS</h3>
          ${invoice.accountName ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Account Name:</span> ${invoice.accountName}</p>` : ""}
          ${invoice.accountNumber ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Account Number:</span> ${invoice.accountNumber}</p>` : ""}
          ${invoice.bankName ? `<p style="font-size:14px;color:#666;margin:4px 0;"><span style="font-weight:500;">Bank Name:</span> ${invoice.bankName}</p>` : ""}
        </div>`
          : ""
      }
      <table style="width:100%;font-size:14px;margin-bottom:16px;border-collapse:collapse;">
        <thead>
          <tr style="background-color:${invoice.brandColor || "#000"};color:white;">
            <th style="padding:8px;text-align:left;border:1px solid #ddd;">Description</th>
            <th style="padding:8px;text-align:center;border:1px solid #ddd;">Qty</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Unit Price</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Amount</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Discount</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || [])
            .map(
              (item) => `
            <tr style="border-bottom:1px solid #ddd;">
              <td style="padding:8px;text-align:left;border:1px solid #ddd;">${item.description || "-"}</td>
              <td style="padding:8px;text-align:center;border:1px solid #ddd;">${item.qty || "-"}</td>
              <td style="padding:8px;text-align:right;border:1px solid #ddd;">${item.unitPrice ? `₦${parseFloat(item.unitPrice).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</td>
              <td style="padding:8px;text-align:right;border:1px solid #ddd;">${item.qty && item.unitPrice ? `₦${(parseFloat(item.qty) * parseFloat(item.unitPrice)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</td>
              <td style="padding:8px;text-align:right;border:1px solid #ddd;">${item.discount ? `₦${parseFloat(item.discount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</td>
              <td style="padding:8px;text-align:right;font-weight:bold;border:1px solid #ddd;">${item.qty && item.unitPrice ? `₦${(parseFloat(item.qty) * parseFloat(item.unitPrice) - (parseFloat(item.discount) || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr style="background-color:#f5f5f5;">
            <td colspan="5" style="padding:8px;text-align:right;font-weight:bold;border:1px solid #ddd;">Total Due:</td>
            <td style="padding:8px;text-align:right;font-weight:bold;color:${invoice.brandColor || "#000"};border:1px solid #ddd;">₦${parseFloat(invoice.total).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          ${invoice.dueDate ? `<tr><td colspan="5" style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">Due Date:</td><td style="padding:8px;text-align:right;font-weight:600;border:1px solid #ddd;">${invoice.dueDate}</td></tr>` : ""}
        </tfoot>
      </table>
      ${
        invoice.signatureName || invoice.signatoryPosition
          ? `
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #ddd;">
          <p style="font-size:14px;font-weight:600;margin:0;">${invoice.signatureName || ""}</p>
          <p style="font-size:12px;color:#666;margin:4px 0;">${invoice.signatoryPosition || ""}</p>
        </div>`
          : ""
      }
    </div>`;

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
    <div className="min-h-screen bg-gray-50 px-2 pt-6 pb-30 text-gray-600">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage all your invoices</p>
          </div>
          <button
            onClick={() => (window.location.href = "/invoices")}
            className="flex items-center gap-2 bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Invoice
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by business name, invoice number, client, bank details..."
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
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchText || searchDate
                ? "Try adjusting your search filters"
                : "Create your first invoice to get started"}
            </p>
            {!searchText && !searchDate && (
              <button
                onClick={() => (window.location.href = "/invoices")}
                className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
              >
                Create Your First Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border-t-4"
                style={{ borderColor: invoice.brandColor || "#5247bf" }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {invoice.businessName}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {invoice.address}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {invoice.clientName && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Client: </span>
                        {invoice.clientName}
                      </div>
                    )}
                    {invoice.invoiceNumber && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Invoice: </span>#
                        {invoice.invoiceNumber}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{invoice.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {invoice.items?.filter((i) => i.description).length ||
                          0}{" "}
                        item(s)
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: invoice.brandColor || "#5247bf" }}
                      >
                        ₦{formatCurrency(invoice.total)}
                      </span>
                    </div>
                    {invoice.dueDate && (
                      <div className="text-sm">
                        <span className="text-gray-600">Due: </span>
                        <span className="font-semibold">{invoice.dueDate}</span>
                      </div>
                    )}
                    {(invoice.accountName ||
                      invoice.accountNumber ||
                      invoice.bankName) && (
                      <div className="text-sm">
                        <span className="text-gray-600">Bank: </span>
                        <span className="font-semibold">
                          {[
                            invoice.accountName,
                            invoice.accountNumber,
                            invoice.bankName,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    )}
                    {invoice.signatureName && (
                      <div className="text-sm">
                        <span className="text-gray-600">Signed by: </span>
                        <span className="font-semibold">
                          {invoice.signatureName}
                        </span>
                        {invoice.signatoryPosition && (
                          <span className="text-gray-500">
                            {" "}
                            ({invoice.signatoryPosition})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => downloadAsImage(invoice)}
                      disabled={
                        downloading === invoice.id || deleting === invoice.id
                      }
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === invoice.id ? "..." : "Image"}
                    </button>
                    <button
                      onClick={() => downloadAsPDF(invoice)}
                      disabled={
                        downloading === invoice.id || deleting === invoice.id
                      }
                      className="flex-1 flex items-center justify-center gap-1 bg-[#5247bf] hover:bg-[#4238a6] text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === invoice.id ? "..." : "PDF"}
                    </button>
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      disabled={
                        !isPaid ||
                        downloading === invoice.id ||
                        deleting === invoice.id
                      }
                      className={`flex items-center justify-center gap-1 text-sm font-medium py-2 px-3 rounded transition-colors ${
                        !isPaid
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-red-100 hover:bg-red-200 text-red-700"
                      } disabled:opacity-70`}
                      title={!isPaid ? "Upgrade to delete" : "Delete"}
                    >
                      {deleting === invoice.id ? (
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

        {filteredInvoices.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoice(s)
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

export default InvoicesList;

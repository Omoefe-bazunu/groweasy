import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Search,
  Calendar,
  FileText,
  Plus,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const InvoicesList = () => {
  const { user } = useUser();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  useEffect(() => {
    filterInvoices();
  }, [searchText, searchDate, invoices]);

  const fetchInvoices = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "invoices"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchText) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.businessName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.address?.toLowerCase().includes(searchText.toLowerCase()) ||
          invoice.invoiceNumber
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.clientName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.clientContact
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.clientLocation
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.clientOccupation
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.accountName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.accountNumber
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          invoice.bankName?.toLowerCase().includes(searchText.toLowerCase()) ||
          invoice.signatureName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter((invoice) => invoice.date === searchDate);
    }

    setFilteredInvoices(filtered);
  };

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const deleteInvoice = async (invoiceId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(invoiceId);
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
      setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
      setFilteredInvoices(
        filteredInvoices.filter((inv) => inv.id !== invoiceId)
      );
      toast.success("Invoice deleted successfully!");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeleting(null);
    }
  };

  const downloadAsImage = async (invoice) => {
    setDownloading(invoice.id);
    try {
      const invoiceHTML = generateInvoiceHTML(invoice);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = invoiceHTML;
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
      link.download = `invoice_${invoice.invoiceNumber || invoice.date}.png`;
      link.click();

      document.body.removeChild(tempDiv);
      toast.success("Invoice downloaded as image!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAsPDF = async (invoice) => {
    setDownloading(invoice.id);
    try {
      const invoiceHTML = generateInvoiceHTML(invoice);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = invoiceHTML;
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
      pdf.save(`invoice_${invoice.invoiceNumber || invoice.date}.pdf`);

      document.body.removeChild(tempDiv);
      toast.success("Invoice downloaded as PDF!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <div style="width: 800px; padding: 40px; font-family: Arial, sans-serif; background: white; color: black;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; border-bottom: 3px solid ${invoice.brandColor || "#000"}; padding-bottom: 16px;">
          <div style="flex: 1;">
            <h1 style="font-size: 24px; font-weight: bold; color: ${invoice.brandColor || "#000"}; margin: 0;">
              ${invoice.businessName || "Business Name"}
            </h1>
            <p style="font-size: 14px; color: #666; margin: 4px 0;">
              ${invoice.address || "Address"}
            </p>
            ${
              invoice.contactEmail
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">${invoice.contactEmail}</p>`
                : ""
            }
            ${
              invoice.contactNumber
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">${invoice.contactNumber}</p>`
                : ""
            }
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 20px; font-weight: bold; color: ${invoice.brandColor || "#000"}; margin: 0;">INVOICE</h2>
            ${
              invoice.invoiceNumber
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">#${invoice.invoiceNumber}</p>`
                : ""
            }
            <p style="font-size: 14px; color: #666; margin: 4px 0;">Date: ${invoice.date}</p>
          </div>
        </div>

        ${
          invoice.clientName ||
          invoice.clientContact ||
          invoice.clientLocation ||
          invoice.clientOccupation
            ? `
          <div style="margin-bottom: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px;">CLIENT INFORMATION</h3>
            ${
              invoice.clientName
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Name:</span> ${invoice.clientName}</p>`
                : ""
            }
            ${
              invoice.clientContact
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Contact:</span> ${invoice.clientContact}</p>`
                : ""
            }
            ${
              invoice.clientLocation
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Location:</span> ${invoice.clientLocation}</p>`
                : ""
            }
            ${
              invoice.clientOccupation
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Occupation:</span> ${invoice.clientOccupation}</p>`
                : ""
            }
          </div>
        `
            : ""
        }

        ${
          invoice.accountName || invoice.accountNumber || invoice.bankName
            ? `
          <div style="margin-bottom: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px;">BANK DETAILS</h3>
            ${
              invoice.accountName
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Account Name:</span> ${invoice.accountName}</p>`
                : ""
            }
            ${
              invoice.accountNumber
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Account Number:</span> ${invoice.accountNumber}</p>`
                : ""
            }
            ${
              invoice.bankName
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 500;">Bank Name:</span> ${invoice.bankName}</p>`
                : ""
            }
          </div>
        `
            : ""
        }

        <table style="width: 100%; font-size: 14px; margin-bottom: 16px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${invoice.brandColor || "#000"}; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Description</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Discount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              ?.map(
                (item) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${item.description || "-"}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.qty || "-"}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                  ${item.unitPrice ? `₦${parseFloat(item.unitPrice).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                  ${
                    item.qty && item.unitPrice
                      ? `₦${(parseFloat(item.qty) * parseFloat(item.unitPrice)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "-"
                  }
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                  ${item.discount ? `₦${parseFloat(item.discount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                </td>
                <td style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">
                  ${
                    item.qty && item.unitPrice
                      ? `₦${(parseFloat(item.qty) * parseFloat(item.unitPrice) - (parseFloat(item.discount) || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "-"
                  }
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f5f5f5;">
              <td colspan="5" style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Total Due:</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: ${invoice.brandColor || "#000"}; border: 1px solid #ddd;">₦${parseFloat(invoice.total).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            ${
              invoice.dueDate
                ? `
              <tr>
                <td colspan="5" style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">Due Date:</td>
                <td style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">${invoice.dueDate}</td>
              </tr>
            `
                : ""
            }
          </tfoot>
        </table>

        ${
          invoice.signatureName || invoice.signatoryPosition
            ? `
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #ddd;">
            <p style="font-size: 14px; font-weight: 600; margin: 0;">${invoice.signatureName || ""}</p>
            <p style="font-size: 12px; color: #666; margin: 4px 0;">${invoice.signatoryPosition || ""}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  };

  if (loading) {
    return (
      <section
        id="blog-details-loading"
        className="flex flex-col items-center justify-center min-h-screen bg-white py-20"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex space-x-2">
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
          </div>
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
            className="flex items-center gap-2 bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by business name, invoice number, client info, bank details, or signatory..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoices Grid */}
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
                className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
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
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-semibold">Client: </span>
                        <span className="ml-1">{invoice.clientName}</span>
                      </div>
                    )}
                    {invoice.invoiceNumber && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-semibold">Invoice: </span>
                        <span className="ml-1">#{invoice.invoiceNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{invoice.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {invoice.items?.filter((item) => item.description)
                          .length || 0}{" "}
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
                        <span className="text-gray-600">Bank Details: </span>
                        <span className="font-semibold">
                          {invoice.accountName || ""}{" "}
                          {invoice.accountNumber || ""} {invoice.bankName || ""}
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
                      className="flex-1 flex items-center justify-center gap-1 bg-[#5247bf] hover:bg-blue-900 text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === invoice.id ? "..." : "PDF"}
                    </button>
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      disabled={
                        downloading === invoice.id || deleting === invoice.id
                      }
                      className="flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium py-2 px-3 rounded transition-colors disabled:opacity-50"
                      title="Delete invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting === invoice.id ? "..." : ""}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredInvoices.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoice(s)
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesList;

import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Search, Calendar, FileText, Plus, Download } from "lucide-react";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const ReceiptsList = () => {
  const { user } = useUser();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, [user]);

  useEffect(() => {
    filterReceipts();
  }, [searchText, searchDate, receipts]);

  const fetchReceipts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "receipts"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const receiptsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReceipts(receiptsData);
      setFilteredReceipts(receiptsData);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  const filterReceipts = () => {
    let filtered = [...receipts];

    if (searchText) {
      filtered = filtered.filter(
        (receipt) =>
          receipt.businessName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          receipt.address?.toLowerCase().includes(searchText.toLowerCase()) ||
          receipt.clientName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          receipt.items?.some((item) =>
            item.details?.toLowerCase().includes(searchText.toLowerCase())
          )
      );
    }

    if (searchDate) {
      filtered = filtered.filter((receipt) => receipt.date === searchDate);
    }

    setFilteredReceipts(filtered);
  };

  const calculateTotal = (items) => {
    if (!items) return "0.00";
    return items
      .reduce((sum, item) => {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        return sum + qty * price - discount;
      }, 0)
      .toFixed(2);
  };

  const calculateBalance = (total, amountPaid) => {
    return (parseFloat(total) - parseFloat(amountPaid || 0)).toFixed(2);
  };

  const calculateInterestCharges = (receipt) => {
    if (!receipt.dueDate || !receipt.interestRate) return 0;

    const today = new Date();
    const dueDate = new Date(receipt.dueDate);

    if (today <= dueDate) return 0;

    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const balance = parseFloat(
      calculateBalance(receipt.total, receipt.amountPaid)
    );
    const dailyRate = parseFloat(receipt.interestRate) / 100 / 365;

    return (balance * dailyRate * daysOverdue).toFixed(2);
  };

  const downloadAsImage = async (receipt) => {
    setDownloading(receipt.id);
    try {
      const receiptHTML = generateReceiptHTML(receipt);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = receiptHTML;
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
      link.download = `receipt_${receipt.date}_${receipt.businessName}.png`;
      link.click();

      document.body.removeChild(tempDiv);
      toast.success("Receipt downloaded as image!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    } finally {
      setDownloading(null);
    }
  };

  const downloadAsPDF = async (receipt) => {
    setDownloading(receipt.id);
    try {
      const receiptHTML = generateReceiptHTML(receipt);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = receiptHTML;
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
      pdf.save(`receipt_${receipt.date}_${receipt.businessName}.pdf`);

      document.body.removeChild(tempDiv);
      toast.success("Receipt downloaded as PDF!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(null);
    }
  };

  const generateReceiptHTML = (receipt) => {
    return `
     <div style="width: 800px; padding: 40px; font-family: Arial, sans-serif; background: white; color: black;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; border-bottom: 3px solid black; padding-bottom: 16px;">
          <div style="flex: 1;">
            ${
              receipt.businessLogo
                ? `<img src="${receipt.businessLogo}" alt="Logo" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 8px;" />`
                : ""
            }
            <h1 style="font-size: 24px; font-weight: bold; color: black; margin: 0;">
              ${receipt.businessName || "Business Name"}
            </h1>
            <p style="font-size: 14px; color: #666; margin: 4px 0;">
              ${receipt.address || "Address"}
            </p>
            ${
              receipt.contactEmail
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">${receipt.contactEmail}</p>`
                : ""
            }
            ${
              receipt.contactNumber
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">${receipt.contactNumber}</p>`
                : ""
            }
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 20px; font-weight: bold; color: black; margin: 0;">RECEIPT</h2>
            <p style="font-size: 14px; color: #666; margin: 4px 0;">Date: ${receipt.date}</p>
          </div>
        </div>

        ${
          receipt.clientName || receipt.clientContact || receipt.clientLocation
            ? `
          <div style="margin-bottom: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: bold; color: #333; margin: 0 0 8px 0;">CLIENT INFORMATION</h3>
            ${
              receipt.clientName
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 600;">Name:</span> ${receipt.clientName}</p>`
                : ""
            }
            ${
              receipt.clientContact
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 600;">Contact:</span> ${receipt.clientContact}</p>`
                : ""
            }
            ${
              receipt.clientLocation
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 600;">Location:</span> ${receipt.clientLocation}</p>`
                : ""
            }
            ${
              receipt.clientOccupation
                ? `<p style="font-size: 14px; color: #666; margin: 4px 0;"><span style="font-weight: 600;">Occupation:</span> ${receipt.clientOccupation}</p>`
                : ""
            }
          </div>
        `
            : ""
        }

        <table style="width: 100%; font-size: 14px; margin-bottom: 16px; border-collapse: collapse;">
          <thead>
            <tr style="background-color: black; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Details</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Discount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Final</th>
            </tr>
          </thead>
          <tbody>
            ${receipt.items
              ?.map(
                (item) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${item.details || "-"}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.qty || "-"}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                  ${item.unitPrice ? `$${item.unitPrice}` : "-"}
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                  ${
                    item.qty && item.unitPrice
                      ? `$${(parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)}`
                      : "-"
                  }
                </td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">
                  ${item.discount ? `$${item.discount}` : "-"}
                </td>
                <td style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">
                  ${
                    item.qty && item.unitPrice
                      ? `$${(parseFloat(item.qty) * parseFloat(item.unitPrice) - (parseFloat(item.discount) || 0)).toFixed(2)}`
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
              <td colspan="5" style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Total:</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: black; border: 1px solid #ddd;">$${receipt.total}</td>
            </tr>
            <tr>
              <td colspan="5" style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">Amount Paid:</td>
              <td style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">$${receipt.amountPaid || "0.00"}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td colspan="5" style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Balance Outstanding:</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: black; border: 1px solid #ddd;">$${calculateBalance(receipt.total, receipt.amountPaid)}</td>
            </tr>
            ${
              receipt.dueDate
                ? `
              <tr>
                <td colspan="5" style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">Due Date:</td>
                <td style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">${receipt.dueDate}</td>
              </tr>
            `
                : ""
            }
            ${
              receipt.interestRate && calculateInterestCharges(receipt) > 0
                ? `
              <tr>
                <td colspan="5" style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">Interest Charges:</td>
                <td style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #ddd;">${calculateInterestCharges(receipt)}</td>
              </tr>
            `
                : ""
            }
          </tfoot>
        </table>

        ${
          receipt.signatureName
            ? `
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #ddd;">
            ${
              receipt.signature
                ? `<img src="${receipt.signature}" alt="Signature" style="width: 128px; height: 64px; object-fit: contain; margin-bottom: 8px;" />`
                : ""
            }
            <p style="font-size: 14px; font-weight: 600; margin: 0;">${receipt.signatureName}</p>
            <p style="font-size: 12px; color: #666; margin: 4px 0;">${receipt.signatoryPosition || ""}</p>
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
    <div className="min-h-screen bg-gray-50 px-6 pt-6 pb-30 text-gray-600">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600 mt-1">Manage all your receipts</p>
          </div>
          <button
            onClick={() => (window.location.href = "/receipts/new")}
            className="flex items-center gap-2 bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Receipt
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by business name, client, address, or items..."
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

        {/* Receipts Grid */}
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
            {!searchText && !searchDate && (
              <button
                onClick={() => (window.location.href = "/receipts/new")}
                className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition-colors"
              >
                Create Your First Receipt
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border-t-4 border-blue-600"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {receipt.businessLogo && (
                        <img
                          src={receipt.businessLogo}
                          alt="Logo"
                          className="w-12 h-12 object-contain mb-2"
                        />
                      )}
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
                        {receipt.items?.filter((item) => item.details).length ||
                          0}{" "}
                        item(s)
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ${receipt.total}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Balance: </span>
                      <span className="font-semibold">
                        ${calculateBalance(receipt.total, receipt.amountPaid)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => downloadAsImage(receipt)}
                      disabled={downloading === receipt.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === receipt.id ? "..." : "Image"}
                    </button>
                    <button
                      onClick={() => downloadAsPDF(receipt)}
                      disabled={downloading === receipt.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#5247bf] hover:bg-blue-900 text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === receipt.id ? "..." : "PDF"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredReceipts.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredReceipts.length} of {receipts.length} receipt(s)
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptsList;

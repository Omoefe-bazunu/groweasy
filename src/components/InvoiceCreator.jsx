import { useState } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { RotateCcw, Save } from "lucide-react";

const InvoiceCreator = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    contactEmail: "",
    contactNumber: "",
    date: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    clientName: "",
    clientContact: "",
    clientLocation: "",
    clientOccupation: "",
    items: Array(5).fill({
      description: "",
      qty: "",
      unitPrice: "",
      discount: "",
    }),
    signatureName: "",
    signatoryPosition: "",
    dueDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const calculateAmount = (qty, unitPrice) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(unitPrice) || 0;
    return (q * p).toFixed(2);
  };

  const calculateFinalAmount = (qty, unitPrice, discount) => {
    const amount = parseFloat(calculateAmount(qty, unitPrice));
    const disc = parseFloat(discount) || 0;
    return (amount - disc).toFixed(2);
  };

  const calculateTotal = () => {
    return formData.items
      .reduce((total, item) => {
        return (
          total +
          parseFloat(
            calculateFinalAmount(item.qty, item.unitPrice, item.discount)
          )
        );
      }, 0)
      .toFixed(2);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.businessName || !formData.address) {
      toast.error("Business name and address are required");
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        userId: user.uid,
        businessName: formData.businessName,
        address: formData.address,
        contactEmail: formData.contactEmail,
        contactNumber: formData.contactNumber,
        date: formData.date,
        invoiceNumber: formData.invoiceNumber,
        clientName: formData.clientName,
        clientContact: formData.clientContact,
        clientLocation: formData.clientLocation,
        clientOccupation: formData.clientOccupation,
        items: formData.items.filter(
          (item) => item.description && item.qty && item.unitPrice
        ),
        signatureName: formData.signatureName,
        signatoryPosition: formData.signatoryPosition,
        dueDate: formData.dueDate || "",
        total: calculateTotal(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "invoices"), invoiceData);
      toast.success("Invoice saved successfully!");
      setFormData({
        businessName: "",
        address: "",
        contactEmail: "",
        contactNumber: "",
        date: new Date().toISOString().split("T")[0],
        invoiceNumber: "",
        clientName: "",
        clientContact: "",
        clientLocation: "",
        clientOccupation: "",
        items: Array(5).fill({
          description: "",
          qty: "",
          unitPrice: "",
          discount: "",
        }),
        signatureName: "",
        signatoryPosition: "",
        dueDate: "",
      });
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      businessName: "",
      address: "",
      contactEmail: "",
      contactNumber: "",
      date: new Date().toISOString().split("T")[0],
      invoiceNumber: "",
      clientName: "",
      clientContact: "",
      clientLocation: "",
      clientOccupation: "",
      items: Array(5).fill({
        description: "",
        qty: "",
        unitPrice: "",
        discount: "",
      }),
      signatureName: "",
      signatoryPosition: "",
      dueDate: "",
    });
    toast.info("Form cleared");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 px-2 py-6 text-gray-600">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6 gap-4 flex-col">
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <div className="flex gap-3 ">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-[#5247bf] text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Invoice Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows="2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Client Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client/Customer Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="clientContact"
                      value={formData.clientContact}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="clientLocation"
                      value={formData.clientLocation}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation (Optional)
                  </label>
                  <input
                    type="text"
                    name="clientOccupation"
                    value={formData.clientOccupation}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
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
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows="2"
                      maxLength="350"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(index, "qty", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(index, "discount", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Signatory</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="signatureName"
                  placeholder="Signatory Name"
                  value={formData.signatureName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="signatoryPosition"
                  placeholder="Position"
                  value={formData.signatoryPosition}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div
              id="invoice-preview"
              className="bg-white p-8 border border-gray-200 rounded-lg"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b-4 border-black pb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-black">
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
                  <h2 className="text-xl font-bold text-black">INVOICE</h2>
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

              {/* Client Information */}
              {(formData.clientName ||
                formData.clientContact ||
                formData.clientLocation) && (
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-[600px] w-full text-sm">
                  <thead>
                    <tr className="bg-black text-white">
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
                          {item.unitPrice ? `$${item.unitPrice}` : "-"}
                        </td>
                        <td className="p-2 text-right">
                          {item.qty && item.unitPrice
                            ? `$${calculateAmount(item.qty, item.unitPrice)}`
                            : "-"}
                        </td>
                        <td className="p-2 text-right">
                          {item.discount ? `$${item.discount}` : "-"}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {item.qty && item.unitPrice
                            ? `$${calculateFinalAmount(item.qty, item.unitPrice, item.discount)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td colSpan="5" className="p-2 text-right font-bold">
                        Total Due:
                      </td>
                      <td className="p-2 text-right font-bold text-black">
                        ${calculateTotal()}
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

              {/* Signatory */}
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
    </div>
  );
};

export default InvoiceCreator;

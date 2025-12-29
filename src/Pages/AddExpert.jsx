import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db, storage } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  UserCheck,
  Loader2,
  LayoutList,
} from "lucide-react";

const AddExpert = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("add"); // 'add' or 'list'

  // ADD FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    image: null,
    chatLink: "",
    specialty: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LIST & EDIT STATE
  const [experts, setExperts] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);

  const documentTypes = [
    "Business Registration Certificate",
    "Tax Identification Number",
    "Proof of Address",
    "Business License",
    "SMEDAN Certificate",
    "SCUML Certificate",
  ];

  // --- ADD TAB FUNCTIONS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("You must be logged in.");
    if (
      !formData.name ||
      !formData.contact ||
      !formData.image ||
      !formData.chatLink ||
      !formData.specialty
    ) {
      return setError("Please fill in all required fields.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const imageRef = ref(
        storage,
        `experts/${Date.now()}_${formData.image.name}`
      );
      await uploadBytes(imageRef, formData.image);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "experts"), {
        ...formData,
        image: imageUrl,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });

      setSuccess("Expert added successfully!");
      setFormData({
        name: "",
        contact: "",
        image: null,
        chatLink: "",
        specialty: "",
      });
    } catch (err) {
      setError("Failed to add expert.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- MANAGE TAB FUNCTIONS ---
  const fetchExperts = async () => {
    setFetching(true);
    try {
      const querySnapshot = await getDocs(collection(db, "experts"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExperts(items);
    } catch (error) {
      console.error("Error fetching experts:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      fetchExperts();
    }
  }, [activeTab]);

  const handleEditClick = (expert) => {
    setEditingId(expert.id);
    setEditForm(expert); // Populate edit form with current data
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setUpdating(true);
    try {
      const expertRef = doc(db, "experts", editingId);
      await updateDoc(expertRef, {
        name: editForm.name,
        contact: editForm.contact,
        chatLink: editForm.chatLink,
        specialty: editForm.specialty,
      });

      // Update local state immediately
      setExperts((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...editForm } : item
        )
      );
      setEditingId(null);
      alert("Expert updated successfully");
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update expert");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expert?")) return;
    try {
      await deleteDoc(doc(db, "experts", id));
      setExperts((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete expert");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-8 pb-25">
      <div className="max-w-4xl mx-auto">
        {/* Header & Tabs */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-[#5247bf] mb-2">
            Expert Management
          </h1>
          <p className="text-gray-600 mb-6">
            Add new experts or manage existing profiles.
          </p>

          <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab("add")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "add"
                  ? "bg-[#5247bf] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "list"
                  ? "bg-[#5247bf] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutList className="w-4 h-4" /> Manage List
            </button>
          </div>
        </div>

        {/* --- TAB 1: ADD EXPERT --- */}
        {activeTab === "add" && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf] outline-none transition"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role / Contact
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf] outline-none transition"
                    placeholder="e.g. Senior Consultant"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#5247bf]/10 file:text-[#5247bf] hover:file:bg-[#5247bf]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chat Link
                </label>
                <input
                  type="url"
                  name="chatLink"
                  value={formData.chatLink}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf] outline-none transition"
                  placeholder="https://wa.me/..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf] outline-none transition"
                  required
                >
                  <option value="" disabled>
                    Select Specialty
                  </option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5247bf] text-white py-3 rounded-lg font-semibold hover:bg-[#4238a6] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
                {loading ? "Adding..." : "Save Expert"}
              </button>
            </form>
          </div>
        )}

        {/* --- TAB 2: MANAGE EXPERTS --- */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {fetching ? (
              <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
                <div className="flex space-x-2">
                  <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
                  <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
                  <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
                </div>
              </section>
            ) : experts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500">
                  No experts found. Switch to the "Add" tab to create one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experts.map((expert) => (
                  <div
                    key={expert.id}
                    className="bg-white text-gray-700 rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4 transition-shadow hover:shadow-md"
                  >
                    {/* Image Section */}
                    <div className="shrink-0">
                      <img
                        src={expert.image}
                        alt={expert.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                      {editingId === expert.id ? (
                        /* EDIT MODE */
                        <div className="space-y-3 animate-in fade-in">
                          <input
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-[#5247bf] outline-none"
                            placeholder="Name"
                          />
                          <input
                            name="contact"
                            value={editForm.contact}
                            onChange={handleEditChange}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-[#5247bf] outline-none"
                            placeholder="Contact/Role"
                          />
                          <input
                            name="chatLink"
                            value={editForm.chatLink}
                            onChange={handleEditChange}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-[#5247bf] outline-none"
                            placeholder="Link"
                          />
                          <select
                            name="specialty"
                            value={editForm.specialty}
                            onChange={handleEditChange}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-[#5247bf] outline-none"
                          >
                            {documentTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleUpdate}
                              disabled={updating}
                              className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                            >
                              {updating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}{" "}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium hover:bg-gray-300 flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* VIEW MODE */
                        <>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900 truncate">
                                {expert.name}
                              </h3>
                              <p className="text-xs text-[#5247bf] font-medium uppercase tracking-wide mt-0.5">
                                {expert.specialty}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditClick(expert)}
                                className="p-1.5 text-gray-400 hover:text-[#5247bf] hover:bg-purple-50 rounded-md transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(expert.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-2 truncate">
                              <span className="font-medium text-gray-500 text-xs">
                                Role:
                              </span>{" "}
                              {expert.contact}
                            </p>
                            <p className="flex items-center gap-2 truncate">
                              <span className="font-medium text-gray-500 text-xs">
                                Link:
                              </span>
                              <a
                                href={expert.chatLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:underline truncate block max-w-[150px]"
                              >
                                {expert.chatLink}
                              </a>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExpert;

import { useState } from "react";
import { useUser } from "../context/UserContext";
import { db, storage } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AddExpert = () => {
  const { user } = useUser();
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

  const documentTypes = [
    "Business Registration Certificate",
    "Tax Identification Number",
    "Proof of Address",
    "Business License",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to add an expert.");
      return;
    }
    if (
      !formData.name ||
      !formData.contact ||
      !formData.image ||
      !formData.chatLink ||
      !formData.specialty
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Upload expert image
      const imageRef = ref(
        storage,
        `experts/${Date.now()}_${formData.image.name}`
      );
      await uploadBytes(imageRef, formData.image);
      const imageUrl = await getDownloadURL(imageRef);

      // Save expert to Firestore
      await addDoc(collection(db, "experts"), {
        name: formData.name,
        contact: formData.contact,
        image: imageUrl,
        chatLink: formData.chatLink,
        specialty: formData.specialty,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
        Add Expert
      </h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-500 mb-4 text-center">{success}</p>}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-gray-700 font-medium mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
              placeholder="e.g., John Doe"
              required
            />
          </div>
          <div>
            <label
              htmlFor="contact"
              className="block text-gray-700 font-medium mb-1"
            >
              Contact
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
              placeholder="e.g., +1 123-456-7890"
              required
            />
          </div>
          <div>
            <label
              htmlFor="image"
              className="block text-gray-700 font-medium mb-1"
            >
              Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
              required
            />
          </div>
          <div>
            <label
              htmlFor="chatLink"
              className="block text-gray-700 font-medium mb-1"
            >
              Chat Link (WhatsApp or Website URL)
            </label>
            <input
              type="url"
              id="chatLink"
              name="chatLink"
              value={formData.chatLink}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
              placeholder="e.g., https://wa.me/1234567890"
              required
            />
          </div>
          <div>
            <label
              htmlFor="specialty"
              className="block text-gray-700 font-medium mb-1"
            >
              Specialty
            </label>
            <select
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
              required
            >
              <option value="" disabled>
                Select specialty
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
            className="w-full bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Expert"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpert;

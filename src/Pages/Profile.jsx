import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Share2,
  MapPin,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

const Profile = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: "",
    motto: "",
    contactAddress: "",
    contactEmail: "",
    contactNumber: "",
    description: "",
    modeOfService: "",
    logoImage: null,
    registrationNumber: "",
    productsServices: [{ image: null, description: "" }],
    socialLinks: [""],
  });

  // Fetch profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setError("You must be logged in to view your profile.");
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
          setFormData(profileSnap.data());
        }
      } catch (err) {
        setError("Failed to fetch profile.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const steps = [
    {
      label: "Business Name",
      field: "businessName",
      type: "text",
      placeholder: "e.g., Tech Innovators",
      required: true,
    },
    {
      label: "Motto/Tagline (Optional)",
      field: "motto",
      type: "text",
      placeholder: "e.g., Innovate the Future",
    },
    {
      label: "Contact Address",
      field: "contactAddress",
      type: "textarea",
      placeholder: "e.g., 123 Tech Street, Innovation City",
      required: true,
    },
    {
      label: "Contact Email",
      field: "contactEmail",
      type: "email",
      placeholder: "e.g., contact@techinnovators.com",
      required: true,
    },
    {
      label: "Contact Number (with Country Code)",
      field: "contactNumber",
      type: "tel",
      placeholder: "e.g., +1 123-456-7890",
      required: true,
    },
    {
      label: "Business Description",
      field: "description",
      type: "textarea",
      placeholder: "e.g., We provide AI solutions for startups.",
      required: true,
    },
    {
      label: "Mode of Service",
      field: "modeOfService",
      type: "select",
      options: ["Remote", "Physical", "Physical & Remote"],
      required: true,
    },
    {
      label: "Business Logo or Owner’s Image",
      field: "logoImage",
      type: "file",
      required: true,
    },
    {
      label: "Business Registration Number (Optional)",
      field: "registrationNumber",
      type: "text",
      placeholder: "e.g., ABC123456",
    },
    {
      label: "Products/Services (Max 6)",
      field: "productsServices",
      type: "productsServices",
    },
    {
      label: "Social Links (Max 3)",
      field: "socialLinks",
      type: "socialLinks",
    },
  ];

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    if (name === "productsServices") {
      const updatedProducts = [...formData.productsServices];
      updatedProducts[index].description = value;
      setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
    } else if (name.startsWith("socialLinks-")) {
      const linkIndex = parseInt(name.split("-")[1]);
      const updatedLinks = [...formData.socialLinks];
      updatedLinks[linkIndex] = value;
      setFormData((prev) => ({ ...prev, socialLinks: updatedLinks }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, field, index) => {
    const file = e.target.files[0];
    if (field === "logoImage") {
      setFormData((prev) => ({ ...prev, logoImage: file }));
    } else if (field === "productsServices") {
      const updatedProducts = [...formData.productsServices];
      updatedProducts[index].image = file;
      setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
    }
  };

  const addProductService = () => {
    if (formData.productsServices.length < 6) {
      setFormData((prev) => ({
        ...prev,
        productsServices: [
          ...prev.productsServices,
          { image: null, description: "" },
        ],
      }));
    }
  };

  const removeProductService = (index) => {
    const updatedProducts = formData.productsServices.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
  };

  const addSocialLink = () => {
    if (formData.socialLinks.length < 3) {
      setFormData((prev) => ({
        ...prev,
        socialLinks: [...prev.socialLinks, ""],
      }));
    }
  };

  const removeSocialLink = (index) => {
    const updatedLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, socialLinks: updatedLinks }));
  };

  const handleNext = () => {
    const step = steps[currentStep];
    if (
      step.required &&
      !formData[step.field] &&
      step.field !== "logoImage" &&
      step.field !== "productsServices"
    ) {
      setError(`${step.label} is required.`);
      return;
    }
    if (step.field === "logoImage" && step.required && !formData.logoImage) {
      setError("Business Logo or Owner’s Image is required.");
      return;
    }
    if (step.field === "productsServices") {
      const invalidProduct = formData.productsServices.some(
        (product) => !product.image || !product.description
      );
      if (invalidProduct) {
        setError("Each product/service must have an image and description.");
        return;
      }
    }
    setError("");
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    try {
      // Upload logo image
      let logoUrl = "";
      if (formData.logoImage instanceof File) {
        const logoRef = ref(storage, `profiles/${user.uid}/logo`);
        await uploadBytes(logoRef, formData.logoImage);
        logoUrl = await getDownloadURL(logoRef);
      } else {
        logoUrl = formData.logoImage || "";
      }

      // Upload product/service images
      const productsServices = await Promise.all(
        formData.productsServices.map(async (product, index) => {
          if (product.image instanceof File) {
            const imageRef = ref(
              storage,
              `profiles/${user.uid}/products/${index}`
            );
            await uploadBytes(imageRef, product.image);
            const imageUrl = await getDownloadURL(imageRef);
            return { ...product, image: imageUrl };
          }
          return product;
        })
      );

      const profileData = {
        businessName: formData.businessName,
        motto: formData.motto,
        contactAddress: formData.contactAddress,
        contactEmail: formData.contactEmail,
        contactNumber: formData.contactNumber,
        description: formData.description,
        modeOfService: formData.modeOfService,
        logoImage: logoUrl,
        registrationNumber: formData.registrationNumber,
        productsServices,
        socialLinks: formData.socialLinks.filter((link) => link),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "profiles", user.uid), profileData);
      setProfile(profileData);
      setIsModalOpen(false);
      setCurrentStep(0);
    } catch (err) {
      setError("Failed to save profile.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "profiles", user.uid));
      setProfile(null);
      setFormData({
        businessName: "",
        motto: "",
        contactAddress: "",
        contactEmail: "",
        contactNumber: "",
        description: "",
        modeOfService: "",
        logoImage: null,
        registrationNumber: "",
        productsServices: [{ image: null, description: "" }],
        socialLinks: [""],
      });
    } catch (err) {
      setError("Failed to delete profile.");
      console.error(err);
    }
  };

  const handleEditProfile = () => {
    setIsModalOpen(true);
    setCurrentStep(0);
    setError("");
  };

  const handleShareProfile = () => {
    navigate(`/public-profile/${user.uid}`);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({
      businessName: "",
      motto: "",
      contactAddress: "",
      contactEmail: "",
      contactNumber: "",
      description: "",
      modeOfService: "",
      logoImage: null,
      registrationNumber: "",
      productsServices: [{ image: null, description: "" }],
      socialLinks: [""],
    });
    setCurrentStep(0);
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 pb-20">
      <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
        Business Profile
      </h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {profile ? (
        <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 border-t-2 border-[#5247bf]">
            <div className="flex flex-col items-center mb-6">
              {profile.logoImage && (
                <img
                  src={profile.logoImage}
                  alt="Logo"
                  className="w-32 h-32 object-cover rounded-full mb-4  shadow-md"
                />
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.businessName}
              </h2>
              {profile.motto && (
                <p className="text-gray-500 italic text-sm mt-1">
                  {profile.motto}
                </p>
              )}
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-[#5247bf] mt-1" />
                  <div>
                    <p className="text-gray-800 font-medium">Contact Address</p>
                    <p className="text-gray-600">{profile.contactAddress}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-[#5247bf] mt-1" />
                  <div>
                    <p className="text-gray-800 font-medium">Contact Email</p>
                    <p className="text-gray-600">{profile.contactEmail}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-[#5247bf] mt-1" />
                  <div>
                    <p className="text-gray-800 font-medium">Contact Number</p>
                    <p className="text-gray-600">{profile.contactNumber}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-[#5247bf] mt-1" />
                  <div>
                    <p className="text-gray-800 font-medium">Mode of Service</p>
                    <p className="text-gray-600">{profile.modeOfService}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-gray-800 font-medium">Description</p>
                <p className="text-gray-600">{profile.description}</p>
              </div>
              {profile.registrationNumber && (
                <div>
                  <p className="text-gray-800 font-medium">
                    Registration Number
                  </p>
                  <p className="text-gray-600">{profile.registrationNumber}</p>
                </div>
              )}
              {profile.productsServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Products/Services
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {profile.productsServices.map((item, index) => (
                      <div
                        key={index}
                        className="flex space-x-4 bg-gray-50 p-4 rounded-lg"
                      >
                        <img
                          src={item.image}
                          alt={`Product ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <p className="text-gray-600 flex-1">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profile.socialLinks.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Social Links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full text-sm"
                      >
                        Link {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-gray-800 font-medium">Created At</p>
                <p className="text-gray-600">{profile.createdAt}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-1 space-x-3 w-full space-y-3 mt-6">
              <button
                onClick={handleEditProfile}
                className="flex-1 w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteProfile}
                className="flex-1 w-full bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={handleShareProfile}
                className="flex-1 w-full bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={handleOpenModal}
            className="bg-[#5247bf] text-white px-6 py-2 rounded-lg hover:bg-[#4238a6] transition-all duration-200"
          >
            Create Profile
          </button>
          <p className="text-gray-600 mt-4 max-w-md mx-auto">
            Creating a Profile for your business is a great way to enforce trust
            and credibility in potential clients, partners or investors and
            increase your revenue.
          </p>
        </div>
      )}

      {/* Multi-Step Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold text-[#5247bf] mb-4">
              {steps[currentStep].label}
            </h2>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            <form
              onSubmit={
                currentStep === steps.length - 1 ? handleSubmit : undefined
              }
            >
              {steps[currentStep].type === "text" && (
                <input
                  type="text"
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field]}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "textarea" && (
                <textarea
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field]}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                  rows="3"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "email" && (
                <input
                  type="email"
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field]}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "tel" && (
                <input
                  type="tel"
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field]}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "select" && (
                <select
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field]}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                  required={steps[currentStep].required}
                >
                  <option value="" disabled>
                    Select {steps[currentStep].label.toLowerCase()}
                  </option>
                  {steps[currentStep].options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {steps[currentStep].type === "file" && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(e, steps[currentStep].field)
                    }
                    className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                    required={
                      steps[currentStep].required && !formData.logoImage
                    }
                  />
                  {formData.logoImage && (
                    <p className="text-gray-600 mt-2">
                      {typeof formData.logoImage === "string"
                        ? "Current image uploaded"
                        : formData.logoImage.name}
                    </p>
                  )}
                </div>
              )}
              {steps[currentStep].type === "productsServices" && (
                <div className="space-y-4">
                  {formData.productsServices.map((product, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="mb-2">
                        <label className="block text-gray-700 font-medium mb-1">
                          Product/Service Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(e, "productsServices", index)
                          }
                          className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                          required={!product.image}
                        />
                        {product.image && (
                          <p className="text-gray-600 mt-2">
                            {typeof product.image === "string"
                              ? "Current image uploaded"
                              : product.image.name}
                          </p>
                        )}
                      </div>
                      <div className="mb-2">
                        <label className="block text-gray-700 font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          name="productsServices"
                          value={product.description}
                          onChange={(e) => handleInputChange(e, index)}
                          className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                          rows="2"
                          placeholder="Describe this product/service"
                          required
                        />
                      </div>
                      {formData.productsServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductService(index)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.productsServices.length < 6 && (
                    <button
                      type="button"
                      onClick={addProductService}
                      className="text-[#5247bf] hover:underline text-sm"
                    >
                      Add Another Product/Service
                    </button>
                  )}
                </div>
              )}
              {steps[currentStep].type === "socialLinks" && (
                <div className="space-y-4">
                  {formData.socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        name={`socialLinks-${index}`}
                        value={link}
                        onChange={handleInputChange}
                        className="flex-1 p-3 rounded-lg bg-gray-50 text-gray-600"
                        placeholder={`e.g., https://twitter.com/yourprofile`}
                      />
                      {formData.socialLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSocialLink(index)}
                          className="text-white bg-red-500 p-2 rounded hover:underline text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.socialLinks.length < 3 && (
                    <button
                      type="button"
                      onClick={addSocialLink}
                      className="text-[#5247bf] hover:underline text-sm"
                    >
                      Add Another Social Link
                    </button>
                  )}
                </div>
              )}
              <div className="flex space-x-4 mt-6">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 cursor-pointer text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Previous
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-[#5247bf] cursor-pointer text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 flex items-center justify-center"
                  >
                    Next
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

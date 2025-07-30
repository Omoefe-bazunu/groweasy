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
  MessageCircle,
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
    productsServices: [{ title: "", description: "", images: [] }],
    socialLinks: [{ title: "", url: "" }],
  });
  const [imageIndices, setImageIndices] = useState({}); // Track current image index per product

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
          const data = profileSnap.data();
          const formattedData = {
            ...data,
            productsServices: Array.isArray(data.productsServices)
              ? data.productsServices
              : [{ title: "", description: "", images: [] }],
            socialLinks: Array.isArray(data.socialLinks)
              ? data.socialLinks
              : [{ title: "", url: "" }],
          };
          setProfile(formattedData);
          setFormData(formattedData);
          // Initialize image indices for each product
          setImageIndices(
            formattedData.productsServices.reduce(
              (acc, _, index) => ({
                ...acc,
                [index]: 0,
              }),
              {}
            )
          );
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

  const handleInputChange = (e, index, subfield, subfieldType) => {
    const { name, value } = e.target;
    if (name === "productsServices") {
      const updatedProducts = [...formData.productsServices];
      updatedProducts[index][subfield] = value;
      setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
    } else if (name.startsWith("socialLinks-")) {
      const linkIndex = parseInt(name.split("-")[1]);
      const updatedLinks = [...formData.socialLinks];
      updatedLinks[linkIndex][subfieldType] = value;
      setFormData((prev) => ({ ...prev, socialLinks: updatedLinks }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, field, index, imageIndex) => {
    const file = e.target.files[0];
    if (field === "logoImage") {
      setFormData((prev) => ({ ...prev, logoImage: file }));
    } else if (field === "productsServices") {
      const updatedProducts = [...formData.productsServices];
      const images = updatedProducts[index].images || [];
      if (imageIndex !== undefined) {
        images[imageIndex] = file;
      } else {
        images.push(file);
      }
      updatedProducts[index].images = images.slice(0, 3); // Limit to 3 images
      setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
    }
  };

  const addProductService = () => {
    if (formData.productsServices.length < 6) {
      setFormData((prev) => ({
        ...prev,
        productsServices: [
          ...prev.productsServices,
          { title: "", description: "", images: [] },
        ],
      }));
      setImageIndices((prev) => ({
        ...prev,
        [formData.productsServices.length]: 0,
      }));
    }
  };

  const removeProductService = (index) => {
    const updatedProducts = formData.productsServices.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
    setImageIndices((prev) => {
      const newIndices = { ...prev };
      delete newIndices[index];
      return newIndices;
    });
  };

  const addSocialLink = () => {
    if (formData.socialLinks.length < 3) {
      setFormData((prev) => ({
        ...prev,
        socialLinks: [...prev.socialLinks, { title: "", url: "" }],
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
        (product) =>
          !product.title || !product.description || product.images.length === 0
      );
      if (invalidProduct) {
        setError(
          "Each product/service must have a title, description, and at least one image."
        );
        return;
      }
    }
    if (step.field === "socialLinks") {
      const invalidLink = formData.socialLinks.some(
        (link) => !link.title || !link.url
      );
      if (invalidLink) {
        setError("Each social link must have a title and URL.");
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
          const imageUrls = await Promise.all(
            (product.images || []).map(async (image, imgIndex) => {
              if (image instanceof File) {
                const imageRef = ref(
                  storage,
                  `profiles/${user.uid}/products/${index}/${imgIndex}`
                );
                await uploadBytes(imageRef, image);
                return await getDownloadURL(imageRef);
              }
              return image;
            })
          );
          return { ...product, images: imageUrls };
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
        socialLinks: formData.socialLinks.filter(
          (link) => link.title && link.url
        ),
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
        productsServices: [{ title: "", description: "", images: [] }],
        socialLinks: [{ title: "", url: "" }],
      });
      setImageIndices({});
    } catch (err) {
      setError("Failed to delete profile.");
      console.error(err);
    }
  };

  const handleEditProfile = () => {
    setIsModalOpen(true);
    setCurrentStep(0);
    setError("");
    setFormData({
      businessName: profile?.businessName || "",
      motto: profile?.motto || "",
      contactAddress: profile?.contactAddress || "",
      contactEmail: profile?.contactEmail || "",
      contactNumber: profile?.contactNumber || "",
      description: profile?.description || "",
      modeOfService: profile?.modeOfService || "",
      logoImage: profile?.logoImage || null,
      registrationNumber: profile?.registrationNumber || "",
      productsServices: Array.isArray(profile?.productsServices)
        ? profile.productsServices
        : [{ title: "", description: "", images: [] }],
      socialLinks: Array.isArray(profile?.socialLinks)
        ? profile.socialLinks
        : [{ title: "", url: "" }],
    });
    setImageIndices(
      profile?.productsServices?.reduce(
        (acc, _, index) => ({
          ...acc,
          [index]: 0,
        }),
        {}
      ) || {}
    );
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
      productsServices: [{ title: "", description: "", images: [] }],
      socialLinks: [{ title: "", url: "" }],
    });
    setCurrentStep(0);
    setError("");
    setImageIndices({});
  };

  const handleImageNavigation = (productIndex, direction) => {
    setImageIndices((prev) => {
      const currentIndex = prev[productIndex] || 0;
      const images = profile.productsServices[productIndex].images || [];
      const maxIndex = images.length - 1;
      let newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = maxIndex;
      if (newIndex > maxIndex) newIndex = 0;
      return { ...prev, [productIndex]: newIndex };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-25 bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="pt-8 pb-2 px-6 text-center">
        <h1 className="text-4xl md:text-3xl font-extrabold text-[#5247bf] mb-2">
          {profile ? profile.businessName : "Create Your Business Profile"}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          {profile
            ? profile.motto || "Showcase your business to the world!"
            : "Build a professional profile to attract clients, partners, and investors."}
        </p>
        {!profile && (
          <button
            onClick={handleOpenModal}
            className="bg-[#5247bf] text-white px-8 py-3 rounded-full hover:bg-[#4238a6] transition-all duration-300 text-lg font-semibold"
          >
            Create Profile Now
          </button>
        )}
      </section>

      {/* Profile Content */}
      {profile && (
        <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto">
          {/* About Section */}
          <section className="mb-16">
            <div className="flex flex-col items-center gap-8">
              {profile.logoImage && (
                <img
                  src={profile.logoImage}
                  alt="Business Logo"
                  className="w-40 h-40 border-4 border-white object-cover rounded-full"
                />
              )}
              <div>
                <h2 className="text-3xl text-center font-bold text-gray-900 mb-4">
                  About Us
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {profile.description}
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
                <MapPin className="w-6 h-6 text-[#5247bf]" />
                <div>
                  <p className="text-gray-800 font-medium">Address</p>
                  <p className="text-gray-600">{profile.contactAddress}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
                <Mail className="w-6 h-6 text-[#5247bf]" />
                <div>
                  <p className="text-gray-800 font-medium">Email</p>
                  <p className="text-gray-600">{profile.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
                <Phone className="w-6 h-6 text-[#5247bf]" />
                <div>
                  <p className="text-gray-800 font-medium">Phone</p>
                  <p className="text-gray-600">{profile.contactNumber}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
                <Globe className="w-6 h-6 text-[#5247bf]" />
                <div>
                  <p className="text-gray-800 font-medium">Service Mode</p>
                  <p className="text-gray-600">{profile.modeOfService}</p>
                </div>
              </div>
            </div>
            {profile.registrationNumber && (
              <div className="mt-6 text-center">
                <p className="text-gray-800 font-medium">Registration Number</p>
                <p className="text-gray-600">{profile.registrationNumber}</p>
              </div>
            )}
          </section>

          {/* Products/Services */}
          {Array.isArray(profile.productsServices) &&
            profile.productsServices.length > 0 && (
              <section className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                  What we Offer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.productsServices.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white p-6 flex flex-col rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 flex-grow mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      {Array.isArray(item.images) && item.images.length > 0 && (
                        <div className="relative">
                          <img
                            src={item.images[imageIndices[index] || 0]}
                            alt={`${item.title} ${imageIndices[index] + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          {item.images.length > 1 && (
                            <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 transform -translate-y-1/2">
                              <button
                                onClick={() => handleImageNavigation(index, -1)}
                                className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleImageNavigation(index, 1)}
                                className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Social Links */}
          {Array.isArray(profile.socialLinks) &&
            profile.socialLinks.length > 0 && (
              <section className="mb-16 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Connect With Us
                </h2>
                <div className="flex justify-center gap-4 flex-wrap">
                  {profile.socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#5247bf] text-white px-4 py-2 rounded-full hover:bg-[#4238a6] transition-all duration-300"
                    >
                      {link.title || `Social Link ${index + 1}`}
                    </a>
                  ))}
                </div>
              </section>
            )}

          {/* CTA Section */}
          <section className="text-center py-12 bg-[#5247bf] text-white rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
            <p className="text-lg mb-6 max-w-xl mx-auto">
              Get in touch today to discuss how we can help your business grow!
            </p>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white text-[#5247bf] px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 text-lg font-semibold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Now
            </a>
          </section>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8 mb-10 flex-wrap">
            <button
              onClick={handleEditProfile}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleDeleteProfile}
              className="bg-red-100 text-red-800 px-6 py-2 rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Profile</span>
            </button>
            <button
              onClick={handleShareProfile}
              className="bg-blue-100 text-blue-800 px-6 py-2 rounded-lg hover:bg-blue-200 transition-all duration-200 flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Step Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            <form onSubmit={handleSubmit}>
              {steps[currentStep].type === "text" && (
                <input
                  type="text"
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "textarea" && (
                <textarea
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                  rows="3"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "email" && (
                <input
                  type="email"
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "tel" && (
                <input
                  type="tel"
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "select" && (
                <select
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
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
                    className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200"
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
              {steps[currentStep].type === "productsServices" &&
                Array.isArray(formData.productsServices) && (
                  <div className="space-y-4">
                    {formData.productsServices.map((product, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded-lg bg-gray-50"
                      >
                        <div className="mb-2">
                          <label className="block text-gray-700 font-medium mb-1">
                            Product/Service Title
                          </label>
                          <input
                            type="text"
                            name="productsServices"
                            value={product.title || ""}
                            onChange={(e) =>
                              handleInputChange(e, index, "title")
                            }
                            className="w-full p-3 rounded-lg bg-white text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                            placeholder="e.g., Web Development"
                            required
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-gray-700 font-medium mb-1">
                            Description (50 words max)
                          </label>
                          <textarea
                            name="productsServices"
                            value={product.description || ""}
                            onChange={(e) =>
                              handleInputChange(e, index, "description")
                            }
                            className="w-full p-3 rounded-lg bg-white text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                            rows="2"
                            placeholder="Describe this product/service"
                            maxLength="350" // Approx 50 words
                            required
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-gray-700 font-medium mb-1">
                            Images (Up to 3)
                          </label>
                          {[...Array(3)].map((_, imgIndex) => (
                            <div key={imgIndex} className="mb-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    "productsServices",
                                    index,
                                    imgIndex
                                  )
                                }
                                className="w-full p-3 rounded-lg bg-white text-gray-600 border border-gray-200"
                                required={
                                  imgIndex === 0 && !product.images[imgIndex]
                                }
                              />
                              {product.images[imgIndex] && (
                                <p className="text-gray-600 mt-2">
                                  {typeof product.images[imgIndex] === "string"
                                    ? `Image ${imgIndex + 1} uploaded`
                                    : product.images[imgIndex].name}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {formData.productsServices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProductService(index)}
                            className="text-white bg-red-500 p-2 rounded hover:bg-red-600 text-sm"
                          >
                            Remove Product/Service
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.productsServices.length < 6 && (
                      <button
                        type="button"
                        onClick={addProductService}
                        className="text-white bg-[#5247bf] p-2 rounded hover:bg-[#4238a6] text-sm"
                      >
                        Add Another Product/Service
                      </button>
                    )}
                  </div>
                )}
              {steps[currentStep].type === "socialLinks" &&
                Array.isArray(formData.socialLinks) && (
                  <div className="space-y-4">
                    {formData.socialLinks.map((link, index) => (
                      <div key={index} className="space-y-2">
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">
                            Social Platform (e.g., X, Facebook)
                          </label>
                          <input
                            type="text"
                            name={`socialLinks-${index}-title`}
                            value={link.title || ""}
                            onChange={(e) =>
                              handleInputChange(e, index, "title", "title")
                            }
                            className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                            placeholder="e.g., X"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">
                            Social Link URL
                          </label>
                          <input
                            type="text"
                            name={`socialLinks-${index}-url`}
                            value={link.url || ""}
                            onChange={(e) =>
                              handleInputChange(e, index, "url", "url")
                            }
                            className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                            placeholder="e.g., https://twitter.com/yourprofile"
                            required
                          />
                        </div>
                        {formData.socialLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="text-white bg-red-500 p-2 rounded hover:bg-red-600 text-sm"
                          >
                            Remove Social Link
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.socialLinks.length < 3 && (
                      <button
                        type="button"
                        onClick={addSocialLink}
                        className="text-white bg-[#5247bf] p-2 rounded hover:bg-[#4238a6] text-sm"
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
                    className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Previous
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 flex items-center justify-center"
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

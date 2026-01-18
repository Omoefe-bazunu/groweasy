import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import ProfileCard from "../components/ProfileCard";

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
    productsServices: [{ title: "", description: "", price: "", images: [] }], // Added Price
    socialLinks: [{ title: "", url: "" }],
  });

  const [imageIndices, setImageIndices] = useState({});

  // Fetch profile
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
              : [{ title: "", description: "", price: "", images: [] }],
            socialLinks: Array.isArray(data.socialLinks)
              ? data.socialLinks
              : [{ title: "", url: "" }],
          };
          setProfile(formattedData);
          setFormData(formattedData);
          setImageIndices(
            formattedData.productsServices.reduce(
              (acc, _, index) => ({ ...acc, [index]: 0 }),
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
      label: "Contact Number (WhatsApp)",
      field: "contactNumber",
      type: "tel",
      placeholder: "e.g., +2349043970401",
      required: true,
    },
    {
      label: "Business Description",
      field: "description",
      type: "textarea",
      placeholder: "Tell us about your business...",
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
      label: "Business Logo",
      field: "logoImage",
      type: "file",
      required: true,
    },
    {
      label: "Reg. Number (Optional)",
      field: "registrationNumber",
      type: "text",
      placeholder: "e.g., ABC123456",
    },
    {
      label: "Products/Services (Max 15)",
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
      updatedProducts[index].images = images.slice(0, 3);
      setFormData((prev) => ({ ...prev, productsServices: updatedProducts }));
    }
  };

  const addProductService = () => {
    if (formData.productsServices.length < 15) {
      // INCREASED LIMIT TO 15
      setFormData((prev) => ({
        ...prev,
        productsServices: [
          ...prev.productsServices,
          { title: "", description: "", price: "", images: [] },
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
      setError("Business Logo is required.");
      return;
    }
    if (step.field === "productsServices") {
      const invalidProduct = formData.productsServices.some(
        (product) =>
          !product.title || !product.description || product.images.length === 0
      );
      if (invalidProduct) {
        setError(
          "Each product must have a title, description, and at least one image."
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
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      let logoUrl = "";
      if (formData.logoImage instanceof File) {
        const logoRef = ref(storage, `profiles/${user.uid}/logo`);
        await uploadBytes(logoRef, formData.logoImage);
        logoUrl = await getDownloadURL(logoRef);
      } else {
        logoUrl = formData.logoImage || "";
      }

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
        ...formData,
        logoImage: logoUrl,
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
    if (!user || !window.confirm("Are you sure?")) return;
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
        productsServices: [
          { title: "", description: "", price: "", images: [] },
        ],
        socialLinks: [{ title: "", url: "" }],
      });
    } catch (err) {
      setError("Failed to delete profile.");
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
        : [{ title: "", description: "", price: "", images: [] }],
      socialLinks: Array.isArray(profile?.socialLinks)
        ? profile.socialLinks
        : [{ title: "", url: "" }],
    });
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/public-profile/${user.uid}`;
    navigator.clipboard.writeText(url);
    alert("Profile link copied to clipboard!");
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
      productsServices: [{ title: "", description: "", price: "", images: [] }],
      socialLinks: [{ title: "", url: "" }],
    });
    setCurrentStep(0);
    setError("");
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

  if (loading)
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );

  return (
    <div className="min-h-screen bg-white text-gray-700">
      {!profile && (
        <section className="pt-20 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            No Profile Created Yet
          </h2>
          <button
            onClick={handleOpenModal}
            className="bg-[#5247bf] text-white px-8 py-3 rounded-full hover:bg-[#4238a6] transition-all duration-300 text-lg font-semibold shadow-lg"
          >
            Create Business Profile
          </button>
        </section>
      )}

      {profile && (
        <ProfileCard
          profile={profile}
          imageIndices={imageIndices}
          onImageNavigation={handleImageNavigation}
          isOwner={true} // OWNER MODE
          actions={{
            onEdit: handleEditProfile,
            onDelete: handleDeleteProfile,
            onShare: handleShareProfile,
          }}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold text-[#5247bf] mb-1">
              {steps[currentStep].label}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Step {currentStep + 1} of {steps.length}
            </p>
            {error && (
              <p className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              {/* --- STANDARD FIELDS (Text, Textarea, etc - same logic as before) --- */}
              {["text", "email", "tel"].includes(steps[currentStep].type) && (
                <input
                  type={steps[currentStep].type}
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf]"
                  placeholder={steps[currentStep].placeholder}
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "textarea" && (
                <textarea
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf]"
                  rows="4"
                  required={steps[currentStep].required}
                />
              )}
              {steps[currentStep].type === "select" && (
                <select
                  name={steps[currentStep].field}
                  value={formData[steps[currentStep].field] || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf]"
                >
                  <option value="" disabled>
                    Select option
                  </option>
                  {steps[currentStep].options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {steps[currentStep].type === "file" && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, steps[currentStep].field)
                  }
                  className="w-full p-3 border rounded-lg"
                  required={steps[currentStep].required && !formData.logoImage}
                />
              )}

              {/* --- UPDATED PRODUCTS SECTION --- */}
              {steps[currentStep].type === "productsServices" && (
                <div className="space-y-6">
                  {formData.productsServices.map((product, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 p-4 rounded-lg bg-gray-50 relative"
                    >
                      <div className="absolute top-2 right-2 text-xs font-bold text-gray-400">
                        #{index + 1}
                      </div>
                      <div className="grid gap-3">
                        <input
                          type="text"
                          name="productsServices" /* FIX: Name attribute added */
                          placeholder="Title"
                          value={product.title}
                          onChange={(e) => handleInputChange(e, index, "title")}
                          className="w-full p-2 border rounded"
                          required
                        />
                        <textarea
                          name="productsServices" /* FIX: Name attribute added */
                          placeholder="Description"
                          value={product.description}
                          onChange={(e) =>
                            handleInputChange(e, index, "description")
                          }
                          className="w-full p-2 border rounded"
                          rows="2"
                          required
                        />
                        <input
                          type="number"
                          name="productsServices" /* FIX: Name attribute added */
                          placeholder="Price (Optional)"
                          value={product.price}
                          onChange={(e) => handleInputChange(e, index, "price")}
                          className="w-full p-2 border rounded"
                        />

                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500 mb-1">
                            Images (Max 3)
                          </p>
                          {[0, 1, 2].map((imgIdx) => (
                            <input
                              key={imgIdx}
                              type="file"
                              accept="image/*"
                              className="text-xs mb-1 w-full"
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  "productsServices",
                                  index,
                                  imgIdx
                                )
                              }
                              required={imgIdx === 0 && !product.images[0]}
                            />
                          ))}
                        </div>
                      </div>
                      {formData.productsServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductService(index)}
                          className="text-red-500 text-xs mt-2 underline"
                        >
                          Remove Item
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.productsServices.length < 15 && (
                    <button
                      type="button"
                      onClick={addProductService}
                      className="w-full py-2 border-2 border-dashed border-[#5247bf] text-[#5247bf] rounded-lg hover:bg-purple-50 font-medium"
                    >
                      + Add Item
                    </button>
                  )}
                </div>
              )}

              {/* --- SOCIAL LINKS --- */}
              {steps[currentStep].type === "socialLinks" && (
                <div className="space-y-3">
                  {formData.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Platform (e.g. X)"
                        value={link.title}
                        onChange={(e) =>
                          handleInputChange(e, idx, "title", "title")
                        }
                        className="w-1/3 p-2 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) =>
                          handleInputChange(e, idx, "url", "url")
                        }
                        className="w-2/3 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialLink(idx)}
                        className="text-red-500"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  {formData.socialLinks.length < 3 && (
                    <button
                      type="button"
                      onClick={addSocialLink}
                      className="text-[#5247bf] text-sm"
                    >
                      + Add Link
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Back
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 bg-[#5247bf] text-white rounded-lg hover:bg-[#4238a6]"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-[#5247bf] text-white rounded-lg hover:bg-[#4238a6] disabled:opacity-50"
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

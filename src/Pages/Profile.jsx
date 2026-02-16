// import { useState, useEffect } from "react";
// import { useUser } from "../context/UserContext";
// import { storage } from "../lib/firebase";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { X, Plus, Trash2 } from "lucide-react";
// import { toast } from "react-toastify";
// import api from "../lib/api";
// import ProfileCard from "../components/ProfileCard";

// const Profile = () => {
//   const { user } = useUser();
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [error, setError] = useState("");

//   const [formData, setFormData] = useState({
//     businessName: "",
//     motto: "",
//     contactAddress: "",
//     contactEmail: "",
//     contactNumber: "",
//     description: "",
//     modeOfService: "",
//     bannerImage: null,
//     registrationNumber: "",
//     brandColor: "#5247bf",
//     productsServices: [
//       {
//         title: "",
//         description: "",
//         price: "",
//         images: [],
//         ctaTitle: "",
//         ctaUrl: "",
//         ctaColor: "#1a1a1a",
//       },
//     ],
//     socialLinks: [{ title: "", url: "" }],
//   });

//   const [imageIndices, setImageIndices] = useState({});

//   // ── Fetch profile from backend ────────────────────────────────────────────

//   useEffect(() => {
//     const fetchProfile = async () => {
//       if (!user) {
//         setLoading(false);
//         return;
//       }
//       try {
//         const res = await api.get("/profiles/me");
//         const data = res.data.profile;

//         if (!data) {
//           return;
//         }

//         const formattedData = {
//           ...data,
//           brandColor: data.brandColor || "#5247bf",
//           productsServices: Array.isArray(data.productsServices)
//             ? data.productsServices.map((p) => ({
//                 ...p,
//                 ctaTitle: p.ctaTitle || "",
//                 ctaUrl: p.ctaUrl || "",
//                 ctaColor: p.ctaColor || "#1a1a1a",
//               }))
//             : [
//                 {
//                   title: "",
//                   description: "",
//                   price: "",
//                   images: [],
//                   ctaTitle: "",
//                   ctaUrl: "",
//                   ctaColor: "#1a1a1a",
//                 },
//               ],
//           socialLinks: Array.isArray(data.socialLinks)
//             ? data.socialLinks
//             : [{ title: "", url: "" }],
//         };
//         setProfile(formattedData);
//         setFormData(formattedData);
//         setImageIndices(
//           formattedData.productsServices.reduce(
//             (acc, _, index) => ({ ...acc, [index]: 0 }),
//             {},
//           ),
//         );
//       } catch (err) {
//         toast.error("Failed to load profile");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProfile();
//   }, [user]);

//   const steps = [
//     {
//       label: "Business Name",
//       field: "businessName",
//       type: "text",
//       placeholder: "e.g., Tech Innovators",
//       required: true,
//     },
//     {
//       label: "Motto / Tagline",
//       field: "motto",
//       type: "text",
//       placeholder: "e.g., Innovate the Future",
//     },
//     {
//       label: "Contact Address",
//       field: "contactAddress",
//       type: "textarea",
//       placeholder: "e.g., 123 Tech Street, Innovation City",
//       required: true,
//     },
//     {
//       label: "Contact Email",
//       field: "contactEmail",
//       type: "email",
//       placeholder: "e.g., contact@techinnovators.com",
//       required: true,
//     },
//     {
//       label: "Contact Number (WhatsApp)",
//       field: "contactNumber",
//       type: "tel",
//       placeholder: "e.g., +2349043970401",
//       required: true,
//     },
//     {
//       label: "Business Description",
//       field: "description",
//       type: "textarea",
//       placeholder: "Tell us about your business...",
//       required: true,
//     },
//     {
//       label: "Mode of Service",
//       field: "modeOfService",
//       type: "select",
//       options: ["Remote", "Physical", "Physical & Remote"],
//       required: true,
//     },
//     {
//       label: "Cover Banner",
//       field: "bannerImage",
//       type: "file",
//       required: true,
//       helpText: "Recommended: 1200x300px, Max 2MB",
//     },
//     {
//       label: "Brand Color",
//       field: "brandColor",
//       type: "color",
//       required: true,
//     },
//     {
//       label: "Reg. Number (Optional)",
//       field: "registrationNumber",
//       type: "text",
//       placeholder: "e.g., ABC123456",
//     },
//     {
//       label: "Products / Services (Max 15)",
//       field: "productsServices",
//       type: "productsServices",
//     },
//     {
//       label: "Social Links (Max 3)",
//       field: "socialLinks",
//       type: "socialLinks",
//     },
//   ];

//   // ── Input handlers ────────────────────────────────────────────────────────

//   const handleInputChange = (e, index, subfield, subfieldType) => {
//     const { name, value } = e.target;
//     if (name === "productsServices") {
//       const updated = [...formData.productsServices];
//       updated[index][subfield] = value;
//       setFormData((prev) => ({ ...prev, productsServices: updated }));
//     } else if (name.startsWith("socialLinks-")) {
//       const linkIndex = parseInt(name.split("-")[1]);
//       const updated = [...formData.socialLinks];
//       updated[linkIndex][subfieldType] = value;
//       setFormData((prev) => ({ ...prev, socialLinks: updated }));
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleFileChange = (e, field, index, imageIndex) => {
//     const file = e.target.files[0];

//     // Validate banner size
//     if (field === "bannerImage" && file) {
//       if (file.size > 2 * 1024 * 1024) {
//         toast.error("Banner image must be less than 2MB");
//         return;
//       }
//       setFormData((prev) => ({ ...prev, bannerImage: file }));
//     } else if (field === "productsServices") {
//       const updated = [...formData.productsServices];
//       const images = updated[index].images || [];
//       if (imageIndex !== undefined) {
//         images[imageIndex] = file;
//       } else {
//         images.push(file);
//       }
//       updated[index].images = images.slice(0, 3);
//       setFormData((prev) => ({ ...prev, productsServices: updated }));
//     }
//   };

//   // ── Product/Service handlers ──────────────────────────────────────────────

//   const addProductService = () => {
//     if (formData.productsServices.length < 15) {
//       setFormData((prev) => ({
//         ...prev,
//         productsServices: [
//           ...prev.productsServices,
//           {
//             title: "",
//             description: "",
//             price: "",
//             images: [],
//             ctaTitle: "",
//             ctaUrl: "",
//             ctaColor: "#1a1a1a",
//           },
//         ],
//       }));
//       setImageIndices((prev) => ({
//         ...prev,
//         [formData.productsServices.length]: 0,
//       }));
//     }
//   };

//   const removeProductService = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       productsServices: prev.productsServices.filter((_, i) => i !== index),
//     }));
//     setImageIndices((prev) => {
//       const n = { ...prev };
//       delete n[index];
//       return n;
//     });
//   };

//   // ── Social link handlers ──────────────────────────────────────────────────

//   const addSocialLink = () => {
//     if (formData.socialLinks.length < 3) {
//       setFormData((prev) => ({
//         ...prev,
//         socialLinks: [...prev.socialLinks, { title: "", url: "" }],
//       }));
//     }
//   };

//   const removeSocialLink = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       socialLinks: prev.socialLinks.filter((_, i) => i !== index),
//     }));
//   };

//   // ── Step navigation ───────────────────────────────────────────────────────

//   const handleNext = () => {
//     const step = steps[currentStep];
//     if (
//       step.required &&
//       !formData[step.field] &&
//       step.field !== "bannerImage" &&
//       step.field !== "productsServices"
//     ) {
//       setError(`${step.label} is required.`);
//       return;
//     }
//     if (
//       step.field === "bannerImage" &&
//       step.required &&
//       !formData.bannerImage
//     ) {
//       setError("Cover Banner is required.");
//       return;
//     }
//     if (step.field === "productsServices") {
//       const invalid = formData.productsServices.some(
//         (p) => !p.title || !p.description || p.images.length === 0,
//       );
//       if (invalid) {
//         setError(
//           "Each product must have a title, description, and at least one image.",
//         );
//         return;
//       }
//     }
//     if (step.field === "socialLinks") {
//       const invalid = formData.socialLinks.some((l) => !l.title || !l.url);
//       if (invalid) {
//         setError("Each social link must have a title and URL.");
//         return;
//       }
//     }
//     setError("");
//     if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
//   };

//   const handleBack = () => {
//     if (currentStep > 0) setCurrentStep(currentStep - 1);
//     setError("");
//   };

//   // ── Submit — upload files to Storage, save data to backend ───────────────

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!user) return;
//     setLoading(true);
//     setError("");

//     try {
//       // Upload banner if it's a new File
//       let bannerUrl = "";
//       if (formData.bannerImage instanceof File) {
//         const bannerRef = ref(storage, `profiles/${user.uid}/banner`);
//         await uploadBytes(bannerRef, formData.bannerImage);
//         bannerUrl = await getDownloadURL(bannerRef);
//       } else {
//         bannerUrl = formData.bannerImage || "";
//       }

//       // Upload product images that are still File objects
//       const productsServices = await Promise.all(
//         formData.productsServices.map(async (product, index) => {
//           const imageUrls = await Promise.all(
//             (product.images || []).map(async (image, imgIndex) => {
//               if (image instanceof File) {
//                 const imageRef = ref(
//                   storage,
//                   `profiles/${user.uid}/products/${index}/${imgIndex}`,
//                 );
//                 await uploadBytes(imageRef, image);
//                 return await getDownloadURL(imageRef);
//               }
//               return image;
//             }),
//           );
//           return {
//             ...product,
//             images: imageUrls,
//             ctaTitle: product.ctaTitle || "",
//             ctaUrl: product.ctaUrl || "",
//             ctaColor: product.ctaColor || "#1a1a1a",
//           };
//         }),
//       );

//       // Send all data (with resolved URLs) to backend
//       await api.post("/profiles", {
//         ...formData,
//         bannerImage: bannerUrl,
//         brandColor: formData.brandColor,
//         productsServices,
//         socialLinks: formData.socialLinks.filter((l) => l.title && l.url),
//       });

//       // Refresh profile from backend
//       const res = await api.get("/profiles/me");
//       setProfile(res.data.profile);
//       setIsModalOpen(false);
//       setCurrentStep(0);
//       toast.success("Profile saved successfully!");
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.error || "Failed to save profile");
//       setError(err.response?.data?.error || "Failed to save profile.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Profile actions ───────────────────────────────────────────────────────

//   const handleDeleteProfile = async () => {
//     if (
//       !user ||
//       !window.confirm("Are you sure you want to delete your profile?")
//     )
//       return;
//     try {
//       await api.delete("/profiles/me");
//       setProfile(null);
//       setFormData({
//         businessName: "",
//         motto: "",
//         contactAddress: "",
//         contactEmail: "",
//         contactNumber: "",
//         description: "",
//         modeOfService: "",
//         bannerImage: null,
//         registrationNumber: "",
//         brandColor: "#5247bf",
//         productsServices: [
//           {
//             title: "",
//             description: "",
//             price: "",
//             images: [],
//             ctaTitle: "",
//             ctaUrl: "",
//             ctaColor: "#1a1a1a",
//           },
//         ],
//         socialLinks: [{ title: "", url: "" }],
//       });
//       toast.success("Profile deleted");
//     } catch (err) {
//       toast.error("Failed to delete profile");
//     }
//   };

//   const handleEditProfile = () => {
//     setIsModalOpen(true);
//     setCurrentStep(0);
//     setError("");
//     setFormData({
//       businessName: profile?.businessName || "",
//       motto: profile?.motto || "",
//       contactAddress: profile?.contactAddress || "",
//       contactEmail: profile?.contactEmail || "",
//       contactNumber: profile?.contactNumber || "",
//       description: profile?.description || "",
//       modeOfService: profile?.modeOfService || "",
//       bannerImage: profile?.bannerImage || null,
//       registrationNumber: profile?.registrationNumber || "",
//       brandColor: profile?.brandColor || "#5247bf",
//       productsServices: Array.isArray(profile?.productsServices)
//         ? profile.productsServices.map((p) => ({
//             ...p,
//             ctaTitle: p.ctaTitle || "",
//             ctaUrl: p.ctaUrl || "",
//             ctaColor: p.ctaColor || "#1a1a1a",
//           }))
//         : [
//             {
//               title: "",
//               description: "",
//               price: "",
//               images: [],
//               ctaTitle: "",
//               ctaUrl: "",
//               ctaColor: "#1a1a1a",
//             },
//           ],
//       socialLinks: Array.isArray(profile?.socialLinks)
//         ? profile.socialLinks
//         : [{ title: "", url: "" }],
//     });
//   };

//   const handleShareProfile = () => {
//     const url = `${window.location.origin}/public-profile/${user.uid}`;
//     navigator.clipboard.writeText(url);
//     toast.success("Profile link copied!");
//   };

//   const handleOpenModal = () => {
//     setIsModalOpen(true);
//     setFormData({
//       businessName: "",
//       motto: "",
//       contactAddress: "",
//       contactEmail: "",
//       contactNumber: "",
//       description: "",
//       modeOfService: "",
//       bannerImage: null,
//       registrationNumber: "",
//       brandColor: "#5247bf",
//       productsServices: [
//         {
//           title: "",
//           description: "",
//           price: "",
//           images: [],
//           ctaTitle: "",
//           ctaUrl: "",
//           ctaColor: "#1a1a1a",
//         },
//       ],
//       socialLinks: [{ title: "", url: "" }],
//     });
//     setCurrentStep(0);
//     setError("");
//   };

//   const handleImageNavigation = (productIndex, direction) => {
//     setImageIndices((prev) => {
//       const currentIndex = prev[productIndex] || 0;
//       const images = profile.productsServices[productIndex].images || [];
//       const maxIndex = images.length - 1;
//       let newIndex = currentIndex + direction;
//       if (newIndex < 0) newIndex = maxIndex;
//       if (newIndex > maxIndex) newIndex = 0;
//       return { ...prev, [productIndex]: newIndex };
//     });
//   };

//   if (loading)
//     return (
//       <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
//         <div className="flex space-x-2">
//           <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
//           <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
//           <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
//         </div>
//       </section>
//     );

//   return (
//     <div className="min-h-screen bg-white text-gray-700">
//       {!profile && (
//         <section className="pt-12 text-center px-4">
//           <h2 className="text-3xl font-bold mb-4 text-gray-800">
//             No Profile Created Yet
//           </h2>
//           <p className="text-gray-500 mb-8">
//             Create your business storefront and share it with customers.
//           </p>
//           <button
//             onClick={handleOpenModal}
//             className="bg-[#1a1a1a] text-white px-8 py-3 rounded-full hover:bg-[#333] transition-all duration-300 text-base font-semibold shadow-lg"
//           >
//             Create Business Profile
//           </button>
//         </section>
//       )}

//       {profile && (
//         <ProfileCard
//           profile={profile}
//           imageIndices={imageIndices}
//           onImageNavigation={handleImageNavigation}
//           isOwner={true}
//           actions={{
//             onEdit: handleEditProfile,
//             onDelete: handleDeleteProfile,
//             onShare: handleShareProfile,
//           }}
//         />
//       )}

//       {/* ── Wizard Modal ── */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
//             <button
//               onClick={() => setIsModalOpen(false)}
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
//             >
//               <X className="w-5 h-5" />
//             </button>

//             {/* Progress bar */}
//             <div className="mb-5">
//               <div className="flex justify-between text-xs text-gray-400 mb-1.5">
//                 <span
//                   className="font-medium"
//                   style={{ color: formData.brandColor }}
//                 >
//                   {steps[currentStep].label}
//                 </span>
//                 <span>
//                   {currentStep + 1} / {steps.length}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-100 rounded-full h-1.5">
//                 <div
//                   className="h-1.5 rounded-full transition-all duration-300"
//                   style={{
//                     width: `${((currentStep + 1) / steps.length) * 100}%`,
//                     backgroundColor: formData.brandColor,
//                   }}
//                 />
//               </div>
//             </div>

//             {error && (
//               <p className="text-red-600 mb-4 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
//                 {error}
//               </p>
//             )}

//             <form onSubmit={handleSubmit}>
//               {/* ── Standard fields ── */}
//               {["text", "email", "tel"].includes(steps[currentStep].type) && (
//                 <input
//                   type={steps[currentStep].type}
//                   name={steps[currentStep].field}
//                   value={formData[steps[currentStep].field] || ""}
//                   onChange={handleInputChange}
//                   className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:outline-none text-gray-800"
//                   style={{
//                     "--tw-ring-color": formData.brandColor,
//                   }}
//                   placeholder={steps[currentStep].placeholder}
//                   required={steps[currentStep].required}
//                 />
//               )}
//               {steps[currentStep].type === "textarea" && (
//                 <textarea
//                   name={steps[currentStep].field}
//                   value={formData[steps[currentStep].field] || ""}
//                   onChange={handleInputChange}
//                   className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:outline-none text-gray-800"
//                   style={{
//                     "--tw-ring-color": formData.brandColor,
//                   }}
//                   rows="4"
//                   placeholder={steps[currentStep].placeholder}
//                   required={steps[currentStep].required}
//                 />
//               )}
//               {steps[currentStep].type === "select" && (
//                 <select
//                   name={steps[currentStep].field}
//                   value={formData[steps[currentStep].field] || ""}
//                   onChange={handleInputChange}
//                   className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:outline-none text-gray-800"
//                   style={{
//                     "--tw-ring-color": formData.brandColor,
//                   }}
//                 >
//                   <option value="" disabled>
//                     Select option
//                   </option>
//                   {steps[currentStep].options.map((opt) => (
//                     <option key={opt} value={opt}>
//                       {opt}
//                     </option>
//                   ))}
//                 </select>
//               )}
//               {steps[currentStep].type === "color" && (
//                 <div>
//                   <input
//                     type="color"
//                     name={steps[currentStep].field}
//                     value={formData[steps[currentStep].field] || "#5247bf"}
//                     onChange={handleInputChange}
//                     className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
//                   />
//                   <p className="text-xs text-gray-500 mt-2">
//                     Choose your brand color - this will be used throughout your
//                     profile
//                   </p>
//                 </div>
//               )}
//               {steps[currentStep].type === "file" && (
//                 <div>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) =>
//                       handleFileChange(e, steps[currentStep].field)
//                     }
//                     className="w-full p-3 border border-gray-300 rounded-lg text-sm"
//                     required={
//                       steps[currentStep].required && !formData.bannerImage
//                     }
//                   />
//                   {steps[currentStep].helpText && (
//                     <p className="text-xs text-gray-500 mt-2">
//                       {steps[currentStep].helpText}
//                     </p>
//                   )}
//                   {formData.bannerImage &&
//                     typeof formData.bannerImage === "string" && (
//                       <div className="mt-3">
//                         <img
//                           src={formData.bannerImage}
//                           alt="Current banner"
//                           className="w-full h-24 rounded-lg object-cover border border-gray-200"
//                         />
//                         <span className="text-xs text-gray-500 block mt-2">
//                           Current banner — upload a new one to replace
//                         </span>
//                       </div>
//                     )}
//                 </div>
//               )}

//               {/* ── Products/Services ── */}
//               {steps[currentStep].type === "productsServices" && (
//                 <div className="space-y-5">
//                   {formData.productsServices.map((product, index) => (
//                     <div
//                       key={index}
//                       className="border border-gray-200 p-4 rounded-xl bg-gray-50 relative"
//                     >
//                       <span className="absolute top-3 right-3 text-xs font-bold text-gray-300">
//                         #{index + 1}
//                       </span>
//                       <div className="grid gap-2.5">
//                         <input
//                           type="text"
//                           name="productsServices"
//                           placeholder="Title"
//                           value={product.title}
//                           onChange={(e) => handleInputChange(e, index, "title")}
//                           className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
//                           style={{
//                             "--tw-ring-color": formData.brandColor,
//                           }}
//                           required
//                         />
//                         <textarea
//                           name="productsServices"
//                           placeholder="Description"
//                           value={product.description}
//                           onChange={(e) =>
//                             handleInputChange(e, index, "description")
//                           }
//                           className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
//                           style={{
//                             "--tw-ring-color": formData.brandColor,
//                           }}
//                           rows="2"
//                           required
//                         />
//                         <input
//                           type="text"
//                           name="productsServices"
//                           placeholder="Price (e.g., ₦50,000 or $100)"
//                           value={product.price}
//                           onChange={(e) => handleInputChange(e, index, "price")}
//                           className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
//                           style={{
//                             "--tw-ring-color": formData.brandColor,
//                           }}
//                         />

//                         {/* CTA Section */}
//                         <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
//                           <p className="text-xs text-gray-400 font-medium">
//                             Call-to-Action Button (Optional)
//                           </p>
//                           <input
//                             type="text"
//                             placeholder="Button text (e.g., Order Now, Book Service)"
//                             value={product.ctaTitle}
//                             onChange={(e) =>
//                               handleInputChange(e, index, "ctaTitle")
//                             }
//                             className="w-full p-2 text-xs border border-gray-300 rounded-lg"
//                           />
//                           <input
//                             type="url"
//                             placeholder="Button URL (e.g., https://...)"
//                             value={product.ctaUrl}
//                             onChange={(e) =>
//                               handleInputChange(e, index, "ctaUrl")
//                             }
//                             className="w-full p-2 text-xs border border-gray-300 rounded-lg"
//                           />
//                           <div className="flex items-center gap-2">
//                             <label className="text-xs text-gray-500">
//                               Button Color:
//                             </label>
//                             <input
//                               type="color"
//                               value={product.ctaColor}
//                               onChange={(e) =>
//                                 handleInputChange(e, index, "ctaColor")
//                               }
//                               className="w-12 h-8 rounded cursor-pointer border border-gray-300"
//                             />
//                           </div>
//                         </div>

//                         <div className="bg-white p-3 rounded-lg border border-gray-200">
//                           <p className="text-xs text-gray-400 font-medium mb-2">
//                             Images (Max 3, at least 1 required)
//                           </p>
//                           {[0, 1, 2].map((imgIdx) => (
//                             <input
//                               key={imgIdx}
//                               type="file"
//                               accept="image/*"
//                               className="text-xs mb-1.5 w-full"
//                               onChange={(e) =>
//                                 handleFileChange(
//                                   e,
//                                   "productsServices",
//                                   index,
//                                   imgIdx,
//                                 )
//                               }
//                               required={imgIdx === 0 && !product.images[0]}
//                             />
//                           ))}
//                         </div>
//                       </div>
//                       {formData.productsServices.length > 1 && (
//                         <button
//                           type="button"
//                           onClick={() => removeProductService(index)}
//                           className="mt-2.5 text-red-500 text-xs flex items-center gap-1 hover:text-red-700"
//                         >
//                           <Trash2 className="w-3 h-3" /> Remove Item
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                   {formData.productsServices.length < 15 && (
//                     <button
//                       type="button"
//                       onClick={addProductService}
//                       className="w-full py-2.5 border-2 border-dashed rounded-xl hover:bg-purple-50 text-sm font-medium flex items-center justify-center gap-2"
//                       style={{
//                         borderColor: `${formData.brandColor}66`,
//                         color: formData.brandColor,
//                       }}
//                     >
//                       <Plus className="w-4 h-4" />
//                       Add Item
//                     </button>
//                   )}
//                 </div>
//               )}

//               {/* ── Social Links ── */}
//               {steps[currentStep].type === "socialLinks" && (
//                 <div className="space-y-3">
//                   {formData.socialLinks.map((link, idx) => (
//                     <div key={idx} className="flex gap-2 items-center">
//                       <input
//                         type="text"
//                         placeholder="Platform (e.g. Instagram)"
//                         value={link.title}
//                         onChange={(e) =>
//                           handleInputChange(e, idx, "title", "title")
//                         }
//                         className="w-1/3 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
//                         style={{
//                           "--tw-ring-color": formData.brandColor,
//                         }}
//                       />
//                       <input
//                         type="text"
//                         placeholder="URL"
//                         value={link.url}
//                         onChange={(e) =>
//                           handleInputChange(e, idx, "url", "url")
//                         }
//                         className="flex-1 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
//                         style={{
//                           "--tw-ring-color": formData.brandColor,
//                         }}
//                       />
//                       <button
//                         type="button"
//                         onClick={() => removeSocialLink(idx)}
//                         className="text-red-400 hover:text-red-600"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ))}
//                   {formData.socialLinks.length < 3 && (
//                     <button
//                       type="button"
//                       onClick={addSocialLink}
//                       className="text-sm flex items-center gap-1.5"
//                       style={{ color: formData.brandColor }}
//                     >
//                       <Plus className="w-4 h-4" /> Add Link
//                     </button>
//                   )}
//                 </div>
//               )}

//               {/* ── Navigation ── */}
//               <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
//                 {currentStep > 0 && (
//                   <button
//                     type="button"
//                     onClick={handleBack}
//                     className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
//                   >
//                     Back
//                   </button>
//                 )}
//                 {currentStep < steps.length - 1 ? (
//                   <button
//                     type="button"
//                     onClick={handleNext}
//                     className="flex-1 py-3 text-white rounded-xl font-medium text-sm transition-colors"
//                     style={{ backgroundColor: formData.brandColor }}
//                   >
//                     Next
//                   </button>
//                 ) : (
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="flex-1 py-3 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
//                     style={{ backgroundColor: formData.brandColor }}
//                   >
//                     {loading ? "Saving..." : "Save Profile"}
//                   </button>
//                 )}
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Profile;

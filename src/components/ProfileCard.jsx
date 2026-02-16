// import { useState, useEffect } from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Edit,
//   Trash2,
//   Share2,
//   MessageCircle,
// } from "lucide-react";

// const ProfileCard = ({
//   profile,
//   imageIndices,
//   onImageNavigation,
//   isOwner,
//   actions,
// }) => {
//   const [autoRotateTimers, setAutoRotateTimers] = useState({});

//   // Auto-rotate product images every 3 seconds
//   useEffect(() => {
//     if (!profile?.productsServices) return;

//     const timers = {};
//     profile.productsServices.forEach((product, index) => {
//       if (product.images && product.images.length > 1) {
//         timers[index] = setInterval(() => {
//           onImageNavigation(index, 1);
//         }, 3000);
//       }
//     });

//     setAutoRotateTimers(timers);

//     return () => {
//       Object.values(timers).forEach((timer) => clearInterval(timer));
//     };
//   }, [profile]);

//   const brandColor = profile?.brandColor || "#5247bf";

//   const handleWhatsAppClick = () => {
//     const message = encodeURIComponent(
//       `Hi! I'm interested in your services at ${profile.businessName}`,
//     );
//     window.open(
//       `https://wa.me/${profile.contactNumber.replace(/\D/g, "")}?text=${message}`,
//       "_blank",
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Cover Banner */}
//       <div className="relative w-full h-48 md:h-64 bg-gray-200">
//         {profile.bannerImage ? (
//           <img
//             src={profile.bannerImage}
//             alt={`${profile.businessName} banner`}
//             className="w-full h-full object-cover"
//           />
//         ) : (
//           <div
//             className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
//             style={{ backgroundColor: brandColor }}
//           >
//             {profile.businessName}
//           </div>
//         )}
//       </div>

//       {/* Main Content Container */}
//       <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
//         {/* Owner Controls - Fixed for Mobile */}
//         {isOwner && actions && (
//           <div className="flex justify-end gap-2 mb-4">
//             <button
//               onClick={actions.onEdit}
//               className="p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
//               title="Edit Profile"
//             >
//               <Edit className="w-4 h-4 text-gray-700" />
//             </button>
//             <button
//               onClick={actions.onShare}
//               className="p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
//               title="Share Profile"
//             >
//               <Share2 className="w-4 h-4 text-gray-700" />
//             </button>
//             <button
//               onClick={actions.onDelete}
//               className="p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
//               title="Delete Profile"
//             >
//               <Trash2 className="w-4 h-4 text-red-500" />
//             </button>
//           </div>
//         )}

//         {/* Business Info Card */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
//           <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
//             {profile.businessName}
//           </h1>
//           {profile.motto && (
//             <p className="text-lg text-gray-500 mb-4 italic">
//               "{profile.motto}"
//             </p>
//           )}

//           <div className="flex flex-wrap gap-3 mb-6">
//             <span
//               className="px-4 py-1.5 rounded-full text-sm font-medium text-white"
//               style={{ backgroundColor: brandColor }}
//             >
//               {profile.modeOfService}
//             </span>
//             {profile.registrationNumber && (
//               <span className="px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
//                 Reg: {profile.registrationNumber}
//               </span>
//             )}
//           </div>

//           <p className="text-gray-700 leading-relaxed mb-6">
//             {profile.description}
//           </p>

//           {/* Contact Info */}
//           <div className="grid md:grid-cols-2 gap-3 text-sm">
//             <div className="flex items-start gap-2">
//               <span className="text-gray-500 font-medium min-w-[80px]">
//                 Email:
//               </span>
//               <a
//                 href={`mailto:${profile.contactEmail}`}
//                 className="text-blue-600 hover:underline break-all"
//               >
//                 {profile.contactEmail}
//               </a>
//             </div>
//             <div className="flex items-start gap-2">
//               <span className="text-gray-500 font-medium min-w-[80px]">
//                 Phone:
//               </span>
//               <a
//                 href={`tel:${profile.contactNumber}`}
//                 className="text-blue-600 hover:underline"
//               >
//                 {profile.contactNumber}
//               </a>
//             </div>
//             <div className="flex items-start gap-2 md:col-span-2">
//               <span className="text-gray-500 font-medium min-w-[80px]">
//                 Address:
//               </span>
//               <span className="text-gray-700">{profile.contactAddress}</span>
//             </div>
//           </div>

//           {/* Social Links */}
//           {profile.socialLinks && profile.socialLinks.length > 0 && (
//             <div className="mt-6 pt-6 border-t border-gray-100">
//               <p className="text-sm font-medium text-gray-500 mb-3">
//                 Connect with us:
//               </p>
//               <div className="flex flex-wrap gap-3">
//                 {profile.socialLinks.map((link, idx) => (
//                   <a
//                     key={idx}
//                     href={link.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
//                   >
//                     {link.title}
//                   </a>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Products/Services Portfolio */}
//         {profile.productsServices && profile.productsServices.length > 0 && (
//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">
//               Our Portfolio
//             </h2>
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {profile.productsServices.map((product, index) => {
//                 const currentImageIndex = imageIndices[index] || 0;
//                 const currentImage = product.images[currentImageIndex];

//                 return (
//                   <div
//                     key={index}
//                     className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
//                   >
//                     {/* Image Carousel */}
//                     <div className="relative h-56 bg-gray-100">
//                       {currentImage && (
//                         <img
//                           src={currentImage}
//                           alt={product.title}
//                           className="w-full h-full object-cover"
//                         />
//                       )}

//                       {/* Manual Navigation Controls */}
//                       {product.images.length > 1 && (
//                         <>
//                           <button
//                             onClick={() => onImageNavigation(index, -1)}
//                             className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
//                             aria-label="Previous image"
//                           >
//                             <ChevronLeft className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => onImageNavigation(index, 1)}
//                             className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
//                             aria-label="Next image"
//                           >
//                             <ChevronRight className="w-4 h-4" />
//                           </button>

//                           {/* Image Indicators */}
//                           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
//                             {product.images.map((_, imgIdx) => (
//                               <div
//                                 key={imgIdx}
//                                 className={`w-1.5 h-1.5 rounded-full transition-all ${
//                                   imgIdx === currentImageIndex
//                                     ? "bg-white w-4"
//                                     : "bg-white/50"
//                                 }`}
//                               />
//                             ))}
//                           </div>
//                         </>
//                       )}
//                     </div>

//                     {/* Product Info */}
//                     <div className="p-5">
//                       <div className="flex justify-between items-start mb-2">
//                         <h3 className="text-lg font-bold text-gray-900">
//                           {product.title}
//                         </h3>
//                         {product.price && (
//                           <span
//                             className="text-lg font-bold px-3 py-1 rounded-lg text-white ml-2 whitespace-nowrap"
//                             style={{ backgroundColor: brandColor }}
//                           >
//                             {product.price}
//                           </span>
//                         )}
//                       </div>
//                       <p className="text-sm text-gray-600 leading-relaxed mb-4">
//                         {product.description}
//                       </p>

//                       {/* Product CTA Button */}
//                       {product.ctaTitle && product.ctaUrl && (
//                         <a
//                           href={product.ctaUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="block w-full text-center px-4 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
//                           style={{
//                             backgroundColor: product.ctaColor || "#1a1a1a",
//                           }}
//                         >
//                           {product.ctaTitle}
//                         </a>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* WhatsApp Contact Section */}
//         <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">
//             Get in Touch
//           </h2>
//           <p className="text-gray-600 mb-6">
//             Have questions or want to learn more? Chat with us on WhatsApp!
//           </p>
//           <button
//             onClick={handleWhatsAppClick}
//             className="w-full md:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-lg hover:shadow-xl"
//           >
//             <MessageCircle className="w-5 h-5" />
//             Chat on WhatsApp
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileCard;

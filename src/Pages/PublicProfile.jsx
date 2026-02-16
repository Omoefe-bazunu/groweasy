// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import api from "../lib/api";
// import ProfileCard from "../components/ProfileCard";

// const PublicProfile = () => {
//   const { userId } = useParams();
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [imageIndices, setImageIndices] = useState({});

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await api.get(`/profiles/public/${userId}`);
//         const data = res.data.profile;
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
//             : [],
//           socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
//         };
//         setProfile(formattedData);
//         setImageIndices(
//           formattedData.productsServices.reduce(
//             (acc, _, index) => ({ ...acc, [index]: 0 }),
//             {},
//           ),
//         );
//       } catch (err) {
//         setError("Profile not found.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProfile();
//   }, [userId]);

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
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="flex space-x-2">
//           <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
//           <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
//           <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
//         </div>
//       </div>
//     );

//   if (error || !profile) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
//         <h2 className="text-2xl font-bold text-gray-800 mb-2">
//           Oops! Profile Not Found
//         </h2>
//         <p className="text-gray-500">
//           The business profile you are looking for does not exist or has been
//           removed.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <ProfileCard
//       profile={profile}
//       imageIndices={imageIndices}
//       onImageNavigation={handleImageNavigation}
//       isOwner={false}
//     />
//   );
// };

// export default PublicProfile;

// import { useState } from "react";
// import { generateImage, imageStyles, imageSizes } from "../lib/generateImage";
// import { Download } from "lucide-react";

// export default function ImageGenerator() {
//   const [prompt, setPrompt] = useState("");
//   const [style, setStyle] = useState(imageStyles[0].name);
//   const [sizeLabel, setSizeLabel] = useState("Instagram Post");
//   const [imageUrl, setImageUrl] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleGenerate = async () => {
//     setLoading(true);
//     setImageUrl(null);
//     setError("");
//     try {
//       const selectedStyle = imageStyles.find((s) => s.name === style);
//       const size = imageSizes[sizeLabel];
//       const url = await generateImage({ prompt, style: selectedStyle, size });
//       setImageUrl(url);
//     } catch (err) {
//       setError(
//         err.message ||
//           "Failed to generate image. Please try a different prompt or check your API key."
//       );
//       console.error("Generate image error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const downloadImage = (format) => {
//     const link = document.createElement("a");
//     link.href = imageUrl;
//     link.download = `generated-image.${format}`;
//     link.click();
//   };

//   return (
//     <div
//       className="min-h-screen flex flex-col justify-start max-w-4xl mx-auto px-6 pb-20 pt-6 space-y-6 text-gray-500 bg-white bg-cover bg-center bg-no-repeat"
//       style={{ backgroundImage: `url('/gebg.jpg')` }}
//     >
//       <h1 className="text-3xl font-bold text-center text-[#5247bf]">
//         🎨 Create an Image
//       </h1>

//       {error && (
//         <div className="text-center">
//           <p className="text-red-500 mb-4">{error}</p>
//         </div>
//       )}

//       <div className="space-y-6">
//         {/* Prompt Input */}
//         <div className="flex flex-col gap-2">
//           <label className="text-gray-700 font-medium">Enter a Prompt</label>
//           <input
//             type="text"
//             placeholder="Describe the image (e.g., A futuristic cityscape with neon lights and flying cars)"
//             className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//           />
//           <p className="text-sm text-gray-500">
//             Tip: Be descriptive for best results with Gemini 2.0 Flash.
//           </p>
//         </div>

//         {/* Style Selection with Previews */}
//         <div className="flex flex-col gap-2">
//           <label className="text-gray-700 font-medium">Choose a Style</label>
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             {imageStyles.map((s) => (
//               <div
//                 key={s.name}
//                 className={`relative p-2 border rounded-xl cursor-pointer transition-all duration-200 ${
//                   style === s.name
//                     ? "border-[#5247bf] bg-purple-50"
//                     : "border-gray-200 hover:bg-gray-50"
//                 }`}
//                 onClick={() => setStyle(s.name)}
//               >
//                 <img
//                   src={s.src}
//                   alt={`${s.name} style`}
//                   className="w-full h-24 object-cover rounded-lg"
//                 />
//                 <div className="mt-2 text-center">
//                   <p className="text-sm font-semibold text-gray-800">
//                     {s.name}
//                   </p>
//                   <p className="text-xs text-gray-500">{s.description}</p>
//                 </div>
//                 {style === s.name && (
//                   <div className="absolute top-2 right-2 w-6 h-6 bg-[#5247bf] rounded-full flex items-center justify-center">
//                     <svg
//                       className="w-4 h-4 text-white"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Size Selection */}
//         <div className="flex flex-col gap-2">
//           <label className="text-gray-700 font-medium">Choose Image Size</label>
//           <select
//             className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
//             value={sizeLabel}
//             onChange={(e) => setSizeLabel(e.target.value)}
//           >
//             {Object.keys(imageSizes).map((label) => (
//               <option key={label} value={label}>
//                 {label}
//               </option>
//             ))}
//           </select>
//           <p className="text-sm text-gray-500">
//             Note: Images are generated with a longer dimension of 1024 pixels.{" "}
//             {imageSizes[sizeLabel].note}
//           </p>
//         </div>

//         {/* Generate Button */}
//         <button
//           className={`w-full py-3 rounded-xl text-white transition-all duration-200 ${
//             loading || !prompt
//               ? "bg-gray-400 cursor-not-allowed"
//               : "bg-[#5247bf] hover:bg-[#4238a6]"
//           }`}
//           onClick={handleGenerate}
//           disabled={loading || !prompt}
//         >
//           {loading ? (
//             <span className="flex items-center justify-center gap-2">
//               <svg
//                 className="animate-spin h-5 w-5 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                 />
//               </svg>
//               Generating...
//             </span>
//           ) : (
//             "Generate Image"
//           )}
//         </button>
//       </div>

//       {/* Generated Image */}
//       {imageUrl && (
//         <div className="space-y-4 mb-10">
//           <img
//             src={imageUrl}
//             alt="Generated"
//             className="rounded-xl w-full border shadow-md"
//           />
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {["png", "jpg"].map((format) => (
//               <button
//                 key={format}
//                 className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-200"
//                 onClick={() => downloadImage(format)}
//               >
//                 <Download className="w-4 h-4" />
//                 <span>{format.toUpperCase()}</span>
//               </button>
//             ))}
//           </div>
//           <p className="text-sm text-gray-500 text-center">
//             Note: Images are generated in PNG format. Other formats may require
//             conversion.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { generateImage, imageStyles, imageSizes } from "../lib/generateImage";
import { Download } from "lucide-react";

export default function ImageGenerator() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(imageStyles[0].name);
  const [sizeLabel, setSizeLabel] = useState("Instagram Post");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const subData = userData.subscription || {};
          // Reset attempts monthly
          const now = new Date();
          const startDate = subData.startDate?.toDate();
          if (!startDate || now - startDate > 30 * 24 * 60 * 60 * 1000) {
            await updateDoc(userDocRef, {
              subscription: {
                ...subData,
                imageAttempts: 0,
                contentPlanAttempts: 0,
                videoAttempts: 0,
                startDate: serverTimestamp(),
              },
            });
            subData.imageAttempts = 0;
            subData.contentPlanAttempts = 0;
            subData.videoAttempts = 0;
            subData.startDate = new Date();
          }
          setSubscription(subData);
        } else {
          const initialSub = {
            plan: "Free",
            status: "active",
            startDate: serverTimestamp(),
            imageAttempts: 0,
            contentPlanAttempts: 0,
            videoAttempts: 0,
          };
          await setDoc(userDocRef, { subscription: initialSub });
          setSubscription(initialSub);
        }
      } else {
        setUser(null);
        setSubscription(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkImageLimit = () => {
    if (!user) return "Please sign in to generate images.";
    if (!subscription) return "Loading subscription data...";

    const { plan, imageAttempts } = subscription;
    let maxImages;
    if (plan === "Free") maxImages = 5;
    else if (plan === "Growth") maxImages = 30;
    else if (plan === "Enterprise") maxImages = 70;

    if (imageAttempts >= maxImages) {
      return `You have reached the limit of ${maxImages} image creations this month. Upgrade your plan to continue.`;
    }
    return null;
  };

  const incrementImageAttempts = async () => {
    if (!user || !subscription) return;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      "subscription.imageAttempts": subscription.imageAttempts + 1,
    });
    setSubscription((prev) => ({
      ...prev,
      imageAttempts: prev.imageAttempts + 1,
    }));
  };

  const handleGenerate = async () => {
    const limitMessage = checkImageLimit();
    if (limitMessage) {
      setError(limitMessage);
      return;
    }

    setLoading(true);
    setImageUrl(null);
    setError("");
    try {
      const selectedStyle = imageStyles.find((s) => s.name === style);
      const size = imageSizes[sizeLabel];
      const url = await generateImage({ prompt, style: selectedStyle, size });
      setImageUrl(url);
      await incrementImageAttempts();
    } catch (err) {
      setError(
        err.message ||
          "Failed to generate image. Please try a different prompt or check your API key."
      );
      console.error("Generate image error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (format) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-image.${format}`;
    link.click();
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-start max-w-4xl mx-auto  px-6 pb-20 pt-6 space-y-6 text-gray-500 bg-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <h1 className="text-3xl font-bold text-center text-[#5247bf]">
        🎨 Create an Image
      </h1>

      {error && (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      )}

      {user && subscription && (
        <div className="text-center text-gray-700">
          <p>Plan: {subscription.plan}</p>
          <p>
            Image Creations Used: {subscription.imageAttempts}/
            {subscription.plan === "Free"
              ? 5
              : subscription.plan === "Growth"
              ? 50
              : 100}
          </p>
          {subscription.imageAttempts >=
            (subscription.plan === "Free"
              ? 5
              : subscription.plan === "Growth"
              ? 50
              : 100) && (
            <p>
              <button
                onClick={() => navigate("/subscribe")}
                className="text-blue-600 underline"
              >
                Upgrade Plan
              </button>
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Enter a Prompt</label>
          <input
            type="text"
            placeholder="Describe the image (e.g., A futuristic cityscape with neon lights and flying cars)"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Tip: Be descriptive for best results with Gemini 2.0 Flash.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Choose a Style</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imageStyles.map((s) => (
              <div
                key={s.name}
                className={`relative p-2 border rounded-xl cursor-pointer transition-all duration-200 ${
                  style === s.name
                    ? "border-[#5247bf] bg-purple-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setStyle(s.name)}
              >
                <img
                  src={s.src}
                  alt={`${s.name} style`}
                  className="w-full h-36 object-cover rounded-lg"
                />
                <div className="mt-2 text-center">
                  <p className="text-sm font-semibold text-gray-800">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
                {style === s.name && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[#5247bf] rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-700 font-medium">Choose Image Size</label>
          <select
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
            value={sizeLabel}
            onChange={(e) => setSizeLabel(e.target.value)}
          >
            {Object.keys(imageSizes).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">
            Note: Images are generated with a longer dimension of 1024 pixels.{" "}
            {imageSizes[sizeLabel].note}
          </p>
        </div>

        <button
          className={`w-full mb-12 py-3 rounded-xl text-white transition-all duration-200 ${
            loading || !prompt
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#5247bf] hover:bg-[#4238a6]"
          }`}
          onClick={handleGenerate}
          disabled={loading || !prompt}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Image"
          )}
        </button>
      </div>

      {imageUrl && (
        <div className="space-y-4 mb-10">
          <img
            src={imageUrl}
            alt="Generated"
            className="rounded-xl w-full border shadow-md"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["png", "jpg"].map((format) => (
              <button
                key={format}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-200"
                onClick={() => downloadImage(format)}
              >
                <Download className="w-4 h-4" />
                <span>{format.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center">
            Note: Images are generated in PNG format. Other formats may require
            conversion.
          </p>
        </div>
      )}
    </div>
  );
}

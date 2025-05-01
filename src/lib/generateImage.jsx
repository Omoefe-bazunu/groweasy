// export const imageStyles = [
//   {
//     name: "Ghibli",
//     description: "Studio Ghibli-inspired, whimsical and hand-drawn",
//     src: "./studio ghibli.jpg",
//   },
//   {
//     name: "Pixar",
//     description: "Pixar-style, vibrant 3D animation",
//     src: "./pixar style.jpg",
//   },
//   {
//     name: "Cyberpunk",
//     description: "Futuristic, neon-lit cyberpunk aesthetic",
//     src: "./cyber.jpg",
//   },
//   {
//     name: "Watercolor",
//     description: "Soft, painterly watercolor style",
//     src: "./watercolor.jpg",
//   },
//   {
//     name: "Anime",
//     description: "Classic Japanese anime style",
//     src: "./anime.jpg",
//   },
//   {
//     name: "Realistic",
//     description: "Photorealistic rendering",
//     src: "./Photorealistic.jpg",
//   },
// ];

// // Gemini 2.0 Flash generates images with a longer dimension of 1024 pixels
// export const imageSizes = {
//   "Instagram Post": { width: 1024, height: 1024, note: "Cropped to 1080x1080" },
//   "Instagram Story": {
//     width: 1024,
//     height: 1024,
//     note: "Cropped to 1080x1920",
//   },
//   "Twitter Post": { width: 1024, height: 1024, note: "Cropped to 1200x675" },
//   "Facebook Post": { width: 1024, height: 1024, note: "Cropped to 1200x630" },
//   "Custom (512x512)": { width: 1024, height: 1024, note: "Cropped to 512x512" },
// };

// export const generateImage = async ({ prompt, style, size }) => {
//   const API_KEY = import.meta.env.VITE_APP_GEMINI_API_KEY;
//   if (!API_KEY) {
//     throw new Error(
//       "Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment variables."
//     );
//   }

//   // Explicitly instruct the model to generate an image
//   const styledPrompt = `Generate an image of ${prompt}, in the style of ${style.name.toLowerCase()}`;

//   try {
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 {
//                   text: styledPrompt,
//                 },
//               ],
//             },
//           ],
//           generationConfig: {
//             response_modalities: ["text", "image"],
//           },
//         }),
//       }
//     );

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error?.message || "Failed to generate image");
//     }

//     const data = await response.json();

//     // Try to find the image in the response
//     const parts = data.candidates?.[0]?.content?.parts || [];
//     let imageData;

//     // Check for inlineData (common structure for image responses)
//     const inlineDataPart = parts.find((part) =>
//       part.inlineData?.mimeType?.startsWith("image/")
//     );
//     if (inlineDataPart) {
//       imageData = inlineDataPart.inlineData.data;
//     }

//     // Fallback: Check for image field (alternative structure)
//     if (!imageData) {
//       const imagePart = parts.find((part) => part.image);
//       imageData = imagePart?.image?.data;
//     }

//     // If no image data, check for a text response to provide feedback
//     if (!imageData) {
//       const textPart = parts.find((part) => part.text);
//       if (textPart) {
//         throw new Error(`Image generation failed: ${textPart.text}`);
//       }
//       throw new Error("No image data returned from the API");
//     }

//     // Convert base64 image data to a URL
//     const imageUrl = `data:image/png;base64,${imageData}`;
//     return imageUrl;
//   } catch (err) {
//     console.error("Image generation error:", err);
//     throw err;
//   }
// };

export const imageStyles = [
  {
    name: "Ghibli",
    description: "Studio Ghibli-inspired, whimsical and hand-drawn",
    src: "./ghibli.jpg",
  },
  {
    name: "Pixar",
    description: "Pixar-style, vibrant 3D animation",
    src: "./pixar.jpg",
  },
  {
    name: "Cyberpunk",
    description: "Futuristic, neon-lit cyberpunk aesthetic",
    src: "./cyberpunk.jpg",
  },
  {
    name: "Watercolor",
    description: "Soft, painterly watercolor style",
    src: "./watercolor.jpg",
  },
  {
    name: "Anime",
    description: "Classic Japanese anime style",
    src: "./anime.jpg",
  },
  {
    name: "Realistic",
    description: "Photorealistic rendering",
    src: "./realistic.jpg",
  },
];

// Gemini 2.0 Flash generates images with a longer dimension of 1024 pixels
export const imageSizes = {
  "Instagram Post": { width: 1024, height: 1024, note: "Cropped to 1080x1080" },
  "Instagram Story": {
    width: 1024,
    height: 1024,
    note: "Cropped to 1080x1920",
  },
  "Twitter Post": { width: 1024, height: 1024, note: "Cropped to 1200x675" },
  "Facebook Post": { width: 1024, height: 1024, note: "Cropped to 1200x630" },
  "Custom (512x512)": { width: 1024, height: 1024, note: "Cropped to 512x512" },
};

export const generateImage = async ({ prompt, style, size }) => {
  const API_KEY = import.meta.env.VITE_APP_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error(
      "Gemini API key is missing. Please set VITE_APP_GEMINI_API_KEY in your environment variables."
    );
  }

  // Log the style and size for debugging
  console.log("Generating image with:", { prompt, style: style.name, size });

  // Explicitly instruct the model to generate an image
  const styledPrompt = `Generate an image of ${prompt}, in the style of ${style.name.toLowerCase()}. Make sure to use Engish for all spellings, with no spelling errors, clear font, and accurate text layout. Lastly, make sure the images perfectly match the descriptions and the style. Do a neat job`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: styledPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            response_modalities: ["text", "image"],
            // Note: Gemini 2.0 Flash generates images with a longer dimension of 1024 pixels.
            // The 'size' parameter ({ width: ${size.width}, height: ${size.height} }) is not used in the API request
            // as the API does not support custom dimensions in this context.
            // The 'note' field in imageSizes (${size.note}) indicates the intended crop size for the frontend.
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate image");
    }

    const data = await response.json();

    // Try to find the image in the response
    const parts = data.candidates?.[0]?.content?.parts || [];
    let imageData;

    // Check for inlineData (common structure for image responses)
    const inlineDataPart = parts.find((part) =>
      part.inlineData?.mimeType?.startsWith("image/")
    );
    if (inlineDataPart) {
      imageData = inlineDataPart.inlineData.data;
    }

    // Fallback: Check for image field (alternative structure)
    if (!imageData) {
      const imagePart = parts.find((part) => part.image);
      imageData = imagePart?.image?.data;
    }

    // If no image data, check for a text response to provide feedback
    if (!imageData) {
      const textPart = parts.find((part) => part.text);
      if (textPart) {
        throw new Error(`Image generation failed: ${textPart.text}`);
      }
      throw new Error("No image data returned from the API");
    }

    // Convert base64 image data to a URL
    const imageUrl = `data:image/png;base64,${imageData}`;
    return imageUrl;
  } catch (err) {
    console.error("Image generation error:", err);
    throw err;
  }
};

// // utils/geminiUtils.js

// export const imageStyles = [
//     'Studio Ghibli',
//     'Pixar Art',
//     'Simpsons',
//     'Photorealistic',
//     'Watercolor',
//     'Cyberpunk',
//     'Low Poly',
//     'Anime'
//   ];

//   export const imageSizes = {
//     'Facebook Post': { width: 1200, height: 630 },
//     'Facebook Cover': { width: 820, height: 312 },
//     'Instagram Post': { width: 1080, height: 1080 },
//     'YouTube Thumbnail': { width: 1280, height: 720 }
//   };

//   export async function generateImage({ prompt, style, size }) {
//     const formattedPrompt = `Generate a ${style} image for: ${prompt}`;

//     const response = await fetch('/api/generate-image', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ prompt: formattedPrompt, size })
//     });

//     if (!response.ok) {
//       throw new Error('Image generation failed');
//     }

//     const data = await response.json();
//     return data.imageUrl; // Expected response from backend: { imageUrl: "https://..." }
//   }

// pages/api/generate-image.js

// utils/geminiUtils.js (mocked version for testing)

export const imageStyles = [
  "Studio Ghibli",
  "Pixar Art",
  "Simpsons",
  "Photorealistic",
  "Watercolor",
  "Cyberpunk",
  "Low Poly",
  "Anime",
];

export const imageSizes = {
  "Facebook Post": { width: 1200, height: 630 },
  "Facebook Cover": { width: 820, height: 312 },
  "Instagram Post": { width: 1080, height: 1080 },
  "YouTube Thumbnail": { width: 1280, height: 720 },
};

// Simulated function for image generation
export async function generateImage({ prompt, style, size }) {
  const formattedPrompt = `Generate a ${style} image for: ${prompt}`;

  // Simulated API call using DeepAI placeholder or static image
  const simulatedImageURL = `https://via.placeholder.com/${size.width}x${
    size.height
  }.png?text=${encodeURIComponent(style)}`;

  // Fake delay to simulate network request
  await new Promise((res) => setTimeout(res, 1000));

  return simulatedImageURL;
}

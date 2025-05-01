// const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
//   import.meta.env.VITE_APP_GEMINI_API_KEY
// }`;

// export const generateContentPlan = async (formData) => {
//   try {
//     // Validate API key
//     const apiKey = import.meta.env.VITE_APP_GEMINI_API_KEY;
//     if (!apiKey) {
//       throw new Error("Gemini API key is missing (VITE_APP_GEMINI_API_KEY)");
//     }

//     // Ensure contentTypes is a string
//     const contentTypes = Array.isArray(formData.contentTypes)
//       ? formData.contentTypes.join(", ")
//       : formData.contentTypes || "Not specified";

//     // Parse numberOfDays and ensure it's an integer
//     const numberOfDays = parseInt(formData.numberOfDays, 10);
//     if (isNaN(numberOfDays) || numberOfDays < 1) {
//       throw new Error("Number of days must be a positive integer");
//     }

//     // Calculate the number of posts and their due dates based on posting frequency
//     let postDates = [];
//     const startDate = new Date("2025-05-01");
//     let frequencyDays;

//     switch (formData.postingFrequency) {
//       case "Daily":
//         frequencyDays = 1;
//         break;
//       case "Every Other Day":
//         frequencyDays = 2;
//         break;
//       case "Weekly":
//         frequencyDays = 7;
//         break;
//       case "Bi-Weekly":
//         frequencyDays = 14;
//         break;
//       default:
//         throw new Error("Invalid posting frequency");
//     }

//     // Generate post dates based on frequency and numberOfDays
//     for (let day = 1; day <= numberOfDays; day += frequencyDays) {
//       const postDate = new Date(startDate);
//       postDate.setDate(startDate.getDate() + (day - 1));
//       postDates.push(postDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
//     }

//     // Stricter prompt to enforce JSON-only output
//     const prompt = `
// You are a content marketing strategist. Based on the following details, generate a content plan as a JSON array. **Return ONLY the JSON array** with no additional text, markdown, explanations, or comments. The output must be pure JSON, parsable by JSON.parse(), with no prefix, suffix, or markdown (e.g., no \`\`\`json markers). Do not include any introductory text, code blocks, or trailing text.

// Format:
// [
//   {
//     "id": 1,
//     "dueDate": "2025-05-01",
//     "bestPostingTime": "10:00 AM",
//     "content": "A detailed description of the post",
//     "imagePrompt": "A prompt for generating an image (if applicable)",
//     "videoPrompt": "A prompt for generating a video (if applicable)"
//   },
//   {...},
//   {...}
// ]

// Details:
// - Business Name: ${formData.businessName}
// - Nature: ${formData.nature}
// - Description: ${formData.description}
// - Goals: ${formData.businessGoals}
// - Target Audience: ${formData.targetAudience}
// - Content Types: ${contentTypes}
// - Posting Frequency: ${formData.postingFrequency}
// - Tone of Voice: ${formData.toneOfVoice}
// - Extra Notes: ${formData.extraNotes || "None"}
// - Duration: ${numberOfDays} days
// - Post Dates: ${postDates.join(", ")}

// Generate exactly ${
//       postDates.length
//     } posts, scheduling them on the following dates: ${postDates.join(
//       ", "
//     )}. Ensure due dates are in "YYYY-MM-DD" format, matching the provided post dates. Include imagePrompt and videoPrompt only if the content type includes "Social Media Campaigns". Use the tone of voice specified and tailor the content to the target audience and business goals.

// **Output only the JSON array, nothing else. No markdown, no \`\`\`json, no extra text.**
// `;

//     console.log("Sending request to Gemini API with prompt:", prompt);

//     const response = await fetch(GEMINI_API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [
//               {
//                 text: prompt,
//               },
//             ],
//           },
//         ],
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("Gemini API response error:", response.status, errorText);
//       throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
//     }

//     const data = await response.json();
//     console.log("Raw Gemini API response:", data);

//     const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//     if (!text) {
//       console.error("No content received from Gemini API:", data);
//       throw new Error("No content received from Gemini API");
//     }

//     console.log("Extracted text from Gemini API:", text);

//     // Preprocess the response to remove markdown code blocks
//     let cleanedText = text.trim();
//     cleanedText = cleanedText.replace(/```json\n?/, "").replace(/```\n?/, "");
//     cleanedText = cleanedText.trim();

//     console.log("Cleaned text after removing markdown:", cleanedText);

//     // Attempt to parse the response as JSON
//     let jsonArray;
//     try {
//       jsonArray = JSON.parse(cleanedText);
//     } catch (parseError) {
//       console.error("Failed to parse Gemini API response as JSON:", parseError);
//       console.error("Cleaned response text:", cleanedText);

//       // Fallback: Attempt to extract JSON array using regex
//       const match = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);
//       if (!match) {
//         throw new Error("Failed to extract valid JSON array from response");
//       }

//       try {
//         jsonArray = JSON.parse(match[0]);
//       } catch (secondParseError) {
//         console.error(
//           "Failed to parse extracted JSON array:",
//           secondParseError
//         );
//         throw new Error("Invalid JSON array in Gemini API response");
//       }
//     }

//     // Validate that the result is an array
//     if (!Array.isArray(jsonArray)) {
//       console.error("Gemini API response is not an array:", jsonArray);
//       throw new Error("Gemini API response is not a valid JSON array");
//     }

//     // Ensure the number of posts matches the expected count
//     if (jsonArray.length !== postDates.length) {
//       console.warn(
//         `Expected ${postDates.length} posts, but received ${jsonArray.length}. Adjusting...`
//       );
//       // Truncate or pad the array as needed
//       jsonArray = jsonArray.slice(0, postDates.length);
//       while (jsonArray.length < postDates.length) {
//         jsonArray.push({
//           id: jsonArray.length + 1,
//           dueDate: postDates[jsonArray.length],
//           bestPostingTime: "10:00 AM",
//           content: "Default content (placeholder)",
//           imagePrompt: "",
//           videoPrompt: "",
//         });
//       }
//     }

//     // Ensure each item has required fields and correct due dates
//     const validatedArray = jsonArray.map((item, index) => ({
//       id: item.id || index + 1,
//       dueDate: postDates[index] || "2025-05-01",
//       bestPostingTime: item.bestPostingTime || "10:00 AM",
//       content: item.content || "Default content",
//       imagePrompt: item.imagePrompt || "",
//       videoPrompt: item.videoPrompt || "",
//     }));

//     console.log("Validated content plan:", validatedArray);
//     return validatedArray;
//   } catch (error) {
//     console.error("Gemini REST API error:", error);
//     return []; // Return an empty array as a fallback to prevent breaking the UI
//   }
// };

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
  import.meta.env.VITE_APP_GEMINI_API_KEY
}`;

export const generateContentPlan = async (formData) => {
  try {
    // Validate API key
    const apiKey = import.meta.env.VITE_APP_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing (VITE_APP_GEMINI_API_KEY)");
    }

    // Ensure contentTypes is a string
    const contentTypes = Array.isArray(formData.contentTypes)
      ? formData.contentTypes.join(", ")
      : formData.contentTypes || "Not specified";

    // Parse numberOfDays and ensure it's an integer
    const numberOfDays = parseInt(formData.numberOfDays, 10);
    if (isNaN(numberOfDays) || numberOfDays < 1) {
      throw new Error("Number of days must be a positive integer");
    }

    // Calculate the number of posts and their due dates based on posting frequency
    let postDates = [];
    const startDate = new Date("2025-05-01");
    let frequencyDays;

    switch (formData.postingFrequency) {
      case "Daily":
        frequencyDays = 1;
        break;
      case "Every Other Day":
        frequencyDays = 2;
        break;
      case "Weekly":
        frequencyDays = 7;
        break;
      case "Bi-Weekly":
        frequencyDays = 14;
        break;
      default:
        throw new Error("Invalid posting frequency");
    }

    // Generate post dates based on frequency and numberOfDays
    for (let day = 1; day <= numberOfDays; day += frequencyDays) {
      const postDate = new Date(startDate);
      postDate.setDate(startDate.getDate() + (day - 1));
      postDates.push(postDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }

    // Stricter prompt to enforce JSON-only output
    const prompt = `
You are a content marketing strategist. Based on the following details, generate a content plan as a JSON array. **Return ONLY the JSON array** with no additional text, markdown, explanations, or comments. The output must be pure JSON, parsable by JSON.parse(), with no prefix, suffix, or markdown (e.g., no \`\`\`json markers). Do not include any introductory text, code blocks, or trailing text.

Format:
[
  {
    "id": 1,
    "dueDate": "2025-05-01",
    "bestPostingTime": "10:00 AM",
    "content": "A detailed description of the post",
    "imagePrompt": "A prompt for generating an image (if applicable)",
    "videoPrompt": "A prompt for generating a video (if applicable)"
  },
  {...},
  {...}
]

Details:
- Business Name: ${formData.businessName}
- Nature: ${formData.nature}
- Description: ${formData.description}
- Goals: ${formData.businessGoals}
- Target Audience: ${formData.targetAudience}
- Content Types: ${contentTypes}
- Posting Frequency: ${formData.postingFrequency}
- Tone of Voice: ${formData.toneOfVoice}
- Extra Notes: ${formData.extraNotes || "None"}
- Duration: ${numberOfDays} days
- Post Dates: ${postDates.join(", ")}

Generate exactly ${
      postDates.length
    } posts, scheduling them on the following dates: ${postDates.join(
      ", "
    )}. Ensure due dates are in "YYYY-MM-DD" format, matching the provided post dates. Include imagePrompt and videoPrompt only if the content type includes "Social Media Campaigns" and let the image and video prompts be really descriptive and relate to the text contents for uniformity and flow. Use the tone of voice specified and tailor the content to the target audience and business goals. Give me complete content I can post directly without editing and it would give me best results.

**Output only the JSON array, nothing else. No markdown, no \`\`\`json, no extra text.**
`;

    console.log("Sending request to Gemini API with prompt:", prompt);

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API response error:", response.status, errorText);
      throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Raw Gemini API response:", data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("No content received from Gemini API:", data);
      throw new Error("No content received from Gemini API");
    }

    console.log("Extracted text from Gemini API:", text);

    // Preprocess the response to remove markdown code blocks
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\n?/, "").replace(/```\n?/, "");
    cleanedText = cleanedText.trim();

    console.log("Cleaned text after removing markdown:", cleanedText);

    // Attempt to parse the response as JSON
    let jsonArray;
    try {
      jsonArray = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini API response as JSON:", parseError);
      console.error("Cleaned response text:", cleanedText);

      // Fallback: Attempt to extract JSON array using regex
      const match = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (!match) {
        throw new Error("Failed to extract valid JSON array from response");
      }

      try {
        jsonArray = JSON.parse(match[0]);
      } catch (secondParseError) {
        console.error(
          "Failed to parse extracted JSON array:",
          secondParseError
        );
        throw new Error("Invalid JSON array in Gemini API response");
      }
    }

    // Validate that the result is an array
    if (!Array.isArray(jsonArray)) {
      console.error("Gemini API response is not an array:", jsonArray);
      throw new Error("Gemini API response is not a valid JSON array");
    }

    // Ensure the number of posts matches the expected count
    if (jsonArray.length !== postDates.length) {
      console.warn(
        `Expected ${postDates.length} posts, but received ${jsonArray.length}. Adjusting...`
      );
      // Truncate or pad the array as needed
      jsonArray = jsonArray.slice(0, postDates.length);
      while (jsonArray.length < postDates.length) {
        jsonArray.push({
          id: jsonArray.length + 1,
          dueDate: postDates[jsonArray.length],
          bestPostingTime: "10:00 AM",
          content: "Default content (placeholder)",
          imagePrompt: "",
          videoPrompt: "",
        });
      }
    }

    // Ensure each item has required fields and correct due dates
    const validatedArray = jsonArray.map((item, index) => ({
      id: item.id || index + 1,
      dueDate: postDates[index] || "2025-05-01",
      bestPostingTime: item.bestPostingTime || "10:00 AM",
      content: item.content || "Default content",
      imagePrompt: item.imagePrompt || "",
      videoPrompt: item.videoPrompt || "",
    }));

    console.log("Validated content plan:", validatedArray);
    return validatedArray;
  } catch (error) {
    console.error("Gemini REST API error:", error);
    return []; // Return an empty array as a fallback to prevent breaking the UI
  }
};

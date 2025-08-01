const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
  import.meta.env.VITE_APP_GEMINI_API_KEY
}`;

// Helper function to make API calls
const callGeminiAPI = async (prompt) => {
  try {
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
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No content received from API");

    // Clean and parse the response
    let cleanedText = text.trim();
    cleanedText = cleanedText
      .replace(/```json\n?/, "")
      .replace(/```\n?/, "")
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      // Fallback: Try to extract JSON from the response
      const match = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      console.error("Failed to parse API response:", error, cleanedText);
      throw new Error("Failed to parse API response as JSON");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// Content Strategy Generator
export const generateContentStrategy = async (formData) => {
  const prompt = `
  Create a comprehensive content strategy based on the following details. 
  Return a JSON object with these keys: overview, goals, targetAudience, contentTypes, 
  toneGuidelines, contentCalendar, distributionChannels, metrics.
  
  Details:
  - Brand Name: ${formData.brandName}
  - Industry: ${formData.industry || "Not specified"}
  - Business Goals: ${formData.businessGoals}
  - Target Audience: ${formData.targetAudience}
  - Competitors: ${formData.competitors || "Not specified"}
  - Unique Value Proposition: ${
    formData.uniqueValueProposition || "Not specified"
  }
  - Content Types: ${formData.contentTypes.join(", ") || "Not specified"}
  - Tone of Voice: ${formData.toneOfVoice}
  - Key Messages: ${formData.keyMessages || "Not specified"}
  - Success Metrics: ${formData.metrics || "Not specified"}

  Make the strategy detailed, actionable, and tailored to the brand's needs.
  Return only the JSON object with no additional text or markdown.
  `;

  return await callGeminiAPI(prompt);
};

// Blog Post Generator
export const generateBlogPost = async (formData) => {
  const prompt = `
  Write a comprehensive blog post based on the following details.
  Return a JSON object with these keys: title, slug, excerpt, contentBody, hashtags.
  
  Requirements:
  - Topic: ${formData.topic}
  - Description: ${formData.description || "Not specified"}
  - Category: ${formData.category || "General"}
  - Region: ${formData.region || "Global"}
  - Tone: ${formData.tone}
  - Length: ${formData.length}
  - Keywords: ${formData.keywords || "None"}

  The post should be well-structured with headings, subheadings, and paragraphs.
  Include at least 5 relevant hashtags. Make the content original, fresh, and engaging.
  Return only the JSON object with no additional text or markdown.
  `;

  return await callGeminiAPI(prompt);
};

// Content Repurposer
export const repurposeContent = async (originalContent, platform) => {
  const platformInstructions = {
    twitter:
      "Convert this into a concise, engaging tweet with 4 threads separated by a line spacing and a subheading (max 280 chars). Include relevant hashtags and a call-to-action.",
    linkedin:
      "Repurpose this into a professional LinkedIn post (max 1300 chars). Use a more formal tone and include relevant hashtags.",
    instagram:
      "Adapt this for an Instagram caption (max 2200 chars). Make it engaging and include relevant hashtags and emojis.",
    facebook:
      "Repurpose this for a Facebook post (max 63206 chars). Make it conversational and engaging.",
    whatsapp:
      "Convert this into a concise WhatsApp message (max 65536 chars). Keep it simple and direct.",
  };

  const prompt = `
  Repurpose the following content for ${platform}:
  ${platformInstructions[platform]}
  
  Original Content:
  ${originalContent}

  Return only the repurposed content as a plain text string with no additional formatting or explanations.
  `;

  return await callGeminiAPI(prompt);
};

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

    // Calculate the number of posts based on posting frequency
    let postDays = [];
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

    // Generate post days based on frequency and numberOfDays
    for (let day = 1; day <= numberOfDays; day += frequencyDays) {
      postDays.push(day);
    }

    // Stricter prompt to enforce JSON-only output and fresh content
    const prompt = `
You are a content marketing strategist. Based on the following details, generate a content plan as a JSON array containing **fresh, original, never-before-used content** that is unique and not recycled from any existing sources. **Return ONLY the JSON array** with no additional text, markdown, explanations, or comments. The output must be pure JSON, parsable by JSON.parse(), with no prefix, suffix, or markdown (e.g., no \`\`\`json markers). Do not include any introductory text, code blocks, or trailing text.

Format:
[
  {
    "Day": 1,
    "content": "A detailed description of the post",
    "imagePrompt": "A prompt for generating an image (if applicable)"
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
- Post Days: ${postDays.join(", ")}

Generate exactly ${
      postDays.length
    } posts, scheduling them on the following days: ${postDays.join(
      ", "
    )}. Include imagePrompt only if the content type includes "Social Media Campaigns" and let the image prompt be highly descriptive, unique, and directly related to the text content for uniformity and flow. Use the specified tone of voice and tailor the content to the pain points of the target audience and the social media goal(s). Provide complete, ready-to-post content that requires no editing for optimal results. Include a compelling CTA at the end and a minimum of 4 strong hashtag keywords. Each content piece should be a minimum of 35 words. Ensure all content is entirely original, created specifically for this request, and not based on any previously generated or existing material.

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
    cleanedText = cleanedText
      .replace(/```json\n?/, "")
      .replace(/```\n?/, "")
      .trim();
    console.log("Cleaned text after removing markdown:", cleanedText);

    // Attempt to parse the response as JSON
    let jsonArray;
    try {
      jsonArray = JSON.parse(cleanedText);
    } catch (error) {
      console.error(
        "Failed to parse Gemini API response as JSON:",
        error,
        cleanedText
      );

      // Fallback: Attempt to extract JSON array using regex
      const match = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (!match) {
        throw new Error("Failed to extract valid JSON array from response");
      }

      try {
        jsonArray = JSON.parse(match[0]);
      } catch (secondError) {
        console.error("Failed to parse extracted JSON array:", secondError);
        throw new Error("Invalid JSON array in Gemini API response");
      }
    }

    // Validate that the result is an array
    if (!Array.isArray(jsonArray)) {
      console.error("Gemini API response is not an array:", jsonArray);
      throw new Error("Gemini API response is not a valid JSON array");
    }

    // Ensure the number of posts matches the expected count
    if (jsonArray.length !== postDays.length) {
      console.warn(
        `Expected ${postDays.length} posts, but received ${jsonArray.length}. Adjusting...`
      );
      jsonArray = jsonArray.slice(0, postDays.length);
      while (jsonArray.length < postDays.length) {
        jsonArray.push({
          Day: postDays[jsonArray.length],
          content: "Default content (placeholder)",
          imagePrompt: "",
        });
      }
    }

    // Ensure each item has required fields
    const validatedArray = jsonArray.map((item, index) => ({
      Day: item.Day || postDays[index],
      content: item.content || "Default content",
      imagePrompt: item.imagePrompt || "",
    }));

    console.log("Validated content plan:", validatedArray);
    return validatedArray;
  } catch (error) {
    console.error("Gemini REST API error:", error);
    return []; // Return an empty array as a fallback to prevent breaking the UI
  }
};

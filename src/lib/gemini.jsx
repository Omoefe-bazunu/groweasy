const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
  import.meta.env.VITE_APP_GEMINI_API_KEY
}`;

// Helper function to make API calls
const callGeminiAPI = async (prompt) => {
  const entropy = Math.random().toString(36).substring(2, 10); // unique ID
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${prompt}\n\nUniqueness Identifier: ${entropy}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          candidateCount: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No content received from API");

    let cleanedText = text.trim();
    cleanedText = cleanedText
      .replace(/```json\n?/, "")
      .replace(/```\n?/, "")
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      const match = cleanedText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
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

**The content must be entirely original, fresh, never-before-used, and unique to this request. Avoid repetition in structure, phrasing, or examples.**

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

Ensure the strategy is tailored and unique, with no reused elements. Return only the JSON object with no additional text or markdown.
`;
  return await callGeminiAPI(prompt);
};

// Blog Post Generator
export const generateBlogPost = async (formData) => {
  const prompt = `
You are a content creation expert. Generate a comprehensive blog post based on the following details. The content must be entirely original, never-before-used, and freshly generated. Avoid using phrasing or examples that have been generated before or that resemble previous outputs.

Return a JSON object with these keys: title, slug, excerpt, contentBody, hashtags.

Requirements:
- Topic: ${formData.topic}
- Description: ${formData.description || "Not specified"}
- Category: ${formData.category || "General"}
- Region: ${formData.region || "Global"}
- Tone: ${formData.tone}
- Length: ${formData.length}
- Keywords: ${formData.keywords || "None"}

Additional Instructions:
- Use clear structure: headings, subheadings, and at least 3 informative sections.
- Include 5+ relevant hashtags aligned with the topic.
- Generate a unique slug based on the topic (lowercase, hyphenated).
- Excerpt should be a 100–250 character summary.
- Include recent, credible insights where applicable.
- Output must be plain JSON with no formatting or markdown.
`;
  try {
    const result = await callGeminiAPI(prompt);

    if (!result.slug && formData.topic) {
      result.slug = formData.topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    }

    const validatedResult = {
      title: result.title || formData.topic || "Untitled Blog Post",
      slug: result.slug || "untitled-blog-post",
      excerpt: result.excerpt || "No excerpt provided.",
      contentBody: result.contentBody || "No content provided.",
      hashtags:
        Array.isArray(result.hashtags) && result.hashtags.length >= 5
          ? result.hashtags
          : ["#Blog", "#Content", "#Default", "#Post", "#Generated"],
    };

    return validatedResult;
  } catch (error) {
    throw new Error("Failed to generate blog post: " + error.message);
  }
};

// Content Repurposer
export const repurposeContent = async (originalContent, platform) => {
  const entropy = Math.random().toString(36).substring(2, 10);
  const platformInstructions = {
    twitter:
      "Convert into a concise tweet with 4 threads and a subheading (max 280 chars each). Use emojis and hashtags.",
    linkedin:
      "Rewrite as a professional LinkedIn post (max 1300 chars). Use a formal tone and clear CTA.",
    instagram:
      "Make it an Instagram caption (max 2200 chars) with emojis, hashtags, and engaging language.",
    facebook:
      "Adapt for Facebook (max 63206 chars). Make it informal, engaging, and CTA-driven.",
    whatsapp:
      "Convert to a short, direct WhatsApp message. No fluff. Include CTA.",
  };

  const prompt = `
Repurpose the following content for ${platform}. Ensure the tone fits the platform and the content is unique, not reused. Avoid repetition or structural similarity.

${platformInstructions[platform]}

Original Content:
${originalContent}

Uniqueness ID: ${entropy}

Return only the repurposed content as plain text.
`;

  return await callGeminiAPI(prompt);
};

// Content Plan Generator
export const generateContentPlan = async (formData) => {
  try {
    const apiKey = import.meta.env.VITE_APP_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing (VITE_APP_GEMINI_API_KEY)");
    }

    const contentTypes = Array.isArray(formData.contentTypes)
      ? formData.contentTypes.join(", ")
      : formData.contentTypes || "Not specified";

    const numberOfDays = parseInt(formData.numberOfDays, 10);
    if (isNaN(numberOfDays) || numberOfDays < 1) {
      throw new Error("Number of days must be a positive integer");
    }

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

    for (let day = 1; day <= numberOfDays; day += frequencyDays) {
      postDays.push(day);
    }

    const prompt = `
You are a content strategist. Generate a JSON array of ${
      postDays.length
    } fresh, **non-repetitive**, original content ideas. No reused language or prior formatting. Avoid duplication in structure, wording, or hashtags. Make each post unique.

Format:
[
  {
    "Day": 1,
    "content": "Full, ready-to-post content here (min 35 words)",
    "imagePrompt": "Highly descriptive image idea"
  },
  ...
]

Details:
- Business: ${formData.businessName}
- Description: ${formData.description}
- Industry: ${formData.nature}
- Goals: ${formData.businessGoals}
- Target Audience: ${formData.targetAudience}
- Content Types: ${contentTypes}
- Frequency: ${formData.postingFrequency}
- Tone: ${formData.toneOfVoice}
- Duration: ${numberOfDays} days
- Extra Notes: ${formData.extraNotes || "None"}
- Post Days: ${postDays.join(", ")}

Include imagePrompt only if content includes "Social Media Campaigns". Add compelling CTA and 4+ hashtags per post.

**Return ONLY the JSON array. No markdown, no \`\`\`, no explanation.**
`;

    const data = await callGeminiAPI(prompt);

    let validatedArray = Array.isArray(data)
      ? data.slice(0, postDays.length)
      : [];

    while (validatedArray.length < postDays.length) {
      validatedArray.push({
        Day: postDays[validatedArray.length],
        content: "Default content (placeholder)",
        imagePrompt: "",
      });
    }

    return validatedArray;
  } catch (error) {
    console.error("Gemini REST API error:", error);
    return [];
  }
};

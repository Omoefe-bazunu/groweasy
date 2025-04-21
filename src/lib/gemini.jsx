import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client with the API key from .env
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Function to generate a content plan using Gemini 1.5 Flash
export const generateContentPlan = async (contentInfo) => {
  try {
    // Get the Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a prompt for generating a content plan
    const prompt = `
      Generate a detailed content plan based on the following details:
      - Business Name: ${contentInfo.businessName || "Generic Business"}
      - Nature of Business: ${contentInfo.nature || "Not specified"}
      - Description: ${
        contentInfo.description || "A business providing innovative solutions."
      }
      - Business Goals: ${
        contentInfo.businessGoals || "Increase brand awareness"
      }
      - Target Audience: ${contentInfo.targetAudience || "General audience"}
      - Preferred Content Type: ${contentInfo.contentTypes || "Blog posts"}
      - Duration of Plan: ${contentInfo.numberOfDays || "30"} days

      The content plan should include 3 content items, each with:
      - A due date (e.g., "2025-05-01") within the specified duration starting from today (April 20, 2025).
      - The best posting time for the content (e.g., "10:00 AM").
      - The full content text or ad copy to be used (not just a title).
      - For Social Media campaigns (Instagram, Twitter, LinkedIn), tailor the content for the specified platform and include:
        - An image prompt for generating accompanying images (e.g., "A vibrant image of a tech startup team working together").
        - A video prompt for generating accompanying videos (e.g., "A 15-second video showing a product demo with upbeat music").
      - Do NOT include a status field.

      Return the result in the following JSON format:
      [
        {
          "id": 1,
          "dueDate": "2025-05-01",
          "bestPostingTime": "10:00 AM",
          "content": "Full text or ad copy for the content item",
          "imagePrompt": "Optional image prompt for social media",
          "videoPrompt": "Optional video prompt for social media"
        },
        ...
      ]
    `;

    // Generate content using the Gemini API
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    // Parse the response as JSON
    const contentPlan = JSON.parse(responseText);

    return contentPlan;
  } catch (error) {
    console.error("Error generating content plan with Gemini:", error);
    // Fallback to dummy data in case of an error
    return [
      {
        id: 1,
        dueDate: "2025-05-01",
        bestPostingTime: "10:00 AM",
        content:
          "Blog Post: Discover the latest tech trends for 2025 to stay ahead in the industry.",
      },
      {
        id: 2,
        dueDate: "2025-05-15",
        bestPostingTime: "2:00 PM",
        content:
          'Instagram Post: "🚀 Exciting Product Launch! Check out our new AI tool designed for startups. #TechInnovators #ProductLaunch"',
        imagePrompt:
          "A sleek image of our new AI tool in action with a startup team in the background.",
        videoPrompt:
          "A 15-second video showcasing the AI tool’s features with upbeat music and a startup office setting.",
      },
      {
        id: 3,
        dueDate: "2025-05-10",
        bestPostingTime: "9:00 AM",
        content:
          "Email Newsletter: Subject: Your Monthly Tech Update - May 2025\n\nHello [Name],\n\nThis month, we’re excited to share the latest updates in tech...",
      },
    ];
  }
};

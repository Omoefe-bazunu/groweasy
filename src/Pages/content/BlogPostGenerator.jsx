import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { generateBlogPost } from "../../lib/gemini";
import { Save, Copy, ChevronDown, ChevronUp } from "lucide-react";

const BlogPostGenerator = () => {
  const { user, userData, incrementUsage } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    category: "",
    region: "",
    tone: "Informative",
    length: "Medium",
    keywords: "",
  });
  const [blogPost, setBlogPost] = useState(null);
  const [postTitle, setPostTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const subData = userData.subscription || {};
          const now = new Date();
          const currentMonth = now.toISOString().slice(0, 7);
          if (subData.month !== currentMonth) {
            await updateDoc(userDocRef, {
              subscription: {
                ...subData,
                contentPlans: 0,
                contentStrategies: 0,
                blogPosts: 0,
                imageGenerations: 0,
                month: currentMonth,
                startDate: serverTimestamp(),
              },
            });
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const checkBlogPostLimit = () => {
    if (!user) return "Please sign in to generate a blog post.";
    if (!userData?.subscription) return "Loading subscription data...";

    const { plan, blogPosts } = userData.subscription;
    let maxPosts;
    if (plan === "Free") maxPosts = 3;
    else if (plan === "Growth") maxPosts = 10;
    else if (plan === "Enterprise") maxPosts = 30;

    if (blogPosts >= maxPosts) {
      return `You have reached the limit of ${maxPosts} blog post creations this month. Upgrade your plan to continue.`;
    }
    return null;
  };

  const categoryOptions = [
    "Technology",
    "Business",
    "Health",
    "Travel",
    "Food",
    "Lifestyle",
    "Finance",
    "Education",
    "Entertainment",
    "Other",
  ];

  const toneOptions = [
    "Informative",
    "Casual",
    "Professional",
    "Humorous",
    "Inspirational",
    "Authoritative",
  ];

  const lengthOptions = [
    { value: "Short", label: "Short (300-500 words)" },
    { value: "Medium", label: "Medium (500-1000 words)" },
    { value: "Long", label: "Long (1000-2000 words)" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleGenerate = async () => {
    const limitMessage = checkBlogPostLimit();
    if (limitMessage) {
      setError(limitMessage);
      return;
    }

    if (!formData.topic) {
      setError("Blog topic is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const generatedPost = await generateBlogPost(formData);
      await incrementUsage("blogPosts");
      setBlogPost(generatedPost);
      setPostTitle(generatedPost.title || formData.topic);
    } catch (err) {
      setError("Failed to generate blog post: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!postTitle || !blogPost) {
      setError("Please generate a post and provide a title before saving");
      return;
    }

    if (!user) {
      setError("You must be logged in to save a blog post");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "blogPosts"), {
        userId: user.uid,
        title: postTitle,
        topic: formData.topic,
        post: blogPost,
        formData,
        createdAt: serverTimestamp(),
      });
      setSuccess("Blog post saved successfully!");
      setTimeout(() => navigate("/blog-posts"), 2000);
    } catch (err) {
      setError("Failed to save blog post: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const prev = document.activeElement;
        const btn = document.createElement("button");
        btn.textContent = "Copied!";
        btn.className =
          "absolute bg-green-500 text-white text-xs px-2 py-1 rounded";
        btn.style.top = "0";
        btn.style.right = "0";
        prev.parentNode.style.position = "relative";
        prev.parentNode.appendChild(btn);
        setTimeout(() => btn.remove(), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto p-6 pb-32">
      <h1 className="text-2xl font-bold text-[#5247bf] text-center mb-6">
        Blog Post Generator
      </h1>

      {user && userData?.subscription && (
        <div className="text-center text-gray-700 mb-4">
          <p>Plan: {userData.subscription.plan || "Free"}</p>
          <p>
            Blog Posts Created: {userData.subscription.blogPosts || 0}/
            {userData.subscription.plan === "Free"
              ? 3
              : userData.subscription.plan === "Growth"
              ? 10
              : 30}
          </p>
          {userData.subscription.blogPosts >=
            (userData.subscription.plan === "Free"
              ? 3
              : userData.subscription.plan === "Growth"
              ? 10
              : 30) && (
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

      {!blogPost ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blog Topic*
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="What is your blog post about?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="Provide more details about what you want in the post"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select category (optional)</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region (Optional)
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., Nigeria, Global, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                name="tone"
                value={formData.tone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {toneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length
              </label>
              <select
                name="length"
                value={formData.length}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {lengthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (Optional)
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Comma-separated keywords to include"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? "Generating..." : "Generate Blog Post"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Generated Blog Post
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setBlogPost(null)}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full text-xl text-[#5247bf] font-semibold mb-2 p-1 border-b border-gray-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Post title"
            />
            <p className="text-sm text-gray-600 mb-4">
              {formData.topic} • {new Date().toLocaleDateString()}
            </p>

            {/* Slug Section */}
            <div className="mb-6 border-b border-gray-100 pb-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("slug")}
              >
                <h3 className="text-lg font-medium text-gray-800">Slug</h3>
                {expandedSections["slug"] ? (
                  <ChevronUp size={20} className="text-gray-600" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600" />
                )}
              </div>
              {expandedSections["slug"] && (
                <div className="mt-2 relative">
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {blogPost.slug || "No slug available"}
                  </div>
                  {blogPost.slug && (
                    <button
                      onClick={() => handleCopy(blogPost.slug)}
                      className="absolute top-0 right-0 text-gray-500 hover:text-indigo-600"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Other Sections (Excerpt, Content, Hashtags, etc.) */}
            {Object.entries(blogPost).map(([section, content]) => {
              if (section === "slug" || section === "title") return null;

              return (
                <div
                  key={section}
                  className="mb-6 border-b border-gray-100 pb-4 last:border-0"
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection(section)}
                  >
                    <h3 className="text-lg font-medium text-gray-800">
                      {section
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </h3>
                    {expandedSections[section] ? (
                      <ChevronUp size={20} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600" />
                    )}
                  </div>

                  {expandedSections[section] && (
                    <div className="mt-2 relative">
                      {typeof content === "string" ? (
                        <>
                          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {content}
                          </div>
                          <button
                            onClick={() => handleCopy(content)}
                            className="absolute top-0 right-0 text-gray-500 hover:text-indigo-600"
                            title="Copy to clipboard"
                          >
                            <Copy size={16} />
                          </button>
                        </>
                      ) : Array.isArray(content) ? (
                        <div className="flex flex-wrap gap-2">
                          {content.map((item, index) => (
                            <span
                              key={index}
                              className="bg-gray-500 px-2 py-1 rounded text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center space-x-2"
              >
                <Save size={16} />
                <span>{loading ? "Saving..." : "Save Post"}</span>
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm mt-2">{success}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPostGenerator;

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
import { Download, Save, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

const BlogPostGenerator = () => {
  const { user } = useUser();
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
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const subData = userData.subscription || {};
          const now = new Date();
          const startDate = subData.startDate?.toDate();
          if (!startDate || now - startDate > 30 * 24 * 60 * 60 * 1000) {
            await updateDoc(userDocRef, {
              subscription: {
                ...subData,
                contentPlanAttempts: 0,
                blogPostAttempts: 0,
                contentStrategyAttempts: 0,
                startDate: serverTimestamp(),
              },
            });
            subData.contentPlanAttempts = 0;
            subData.blogPostAttempts = 0;
            subData.contentStrategyAttempts = 0;
            subData.startDate = new Date();
          }
          setSubscription(subData);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const checkBlogPostLimit = () => {
    if (!user) return "Please sign in to generate a blog post.";
    if (!subscription) return "Loading subscription data...";

    const { plan, blogPostAttempts } = subscription;
    let maxPosts;
    if (plan === "Free") maxPosts = 3;
    else if (plan === "Growth") maxPosts = 10;
    else if (plan === "Enterprise") maxPosts = 30;

    if (blogPostAttempts >= maxPosts) {
      return `You have reached the limit of ${maxPosts} blog post creations this month. Upgrade your plan to continue.`;
    }
    return null;
  };

  const incrementBlogPostAttempts = async () => {
    if (!user || !subscription) return;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      "subscription.blogPostAttempts": subscription.blogPostAttempts + 1,
    });
    setSubscription((prev) => ({
      ...prev,
      blogPostAttempts: prev.blogPostAttempts + 1,
    }));
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
      setBlogPost(generatedPost);
      setPostTitle(generatedPost.title || formData.topic);
      await incrementBlogPostAttempts();
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

  const handleDownloadPDF = () => {
    if (!blogPost) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let yPosition = margin;

    const addText = (text, x, y, options = {}) => {
      const maxWidth = options.maxWidth || 190;
      const lineHeight = options.lineHeight || 5;

      const lines = doc.splitTextToSize(text, maxWidth);
      const requiredHeight = lines.length * lineHeight;

      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(lines, x, yPosition, options);
      yPosition += requiredHeight;
    };

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText(postTitle, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Topic: ${formData.topic}`, margin, yPosition);
    yPosition += 5;
    addText(
      `Generated on: ${new Date().toLocaleDateString()}`,
      margin,
      yPosition
    );
    yPosition += 10;

    if (blogPost.excerpt) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Excerpt", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(blogPost.excerpt, margin, yPosition, {
        maxWidth: 190,
        lineHeight: 5,
      });
      yPosition += (blogPost.excerpt.split(" ").length / 10) * 5 + 10;
    }

    if (blogPost.contentBody) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Content", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(blogPost.contentBody, margin, yPosition, {
        maxWidth: 190,
        lineHeight: 5,
      });
      yPosition += (blogPost.contentBody.split(" ").length / 10) * 5 + 10;
    }

    if (blogPost.hashtags && blogPost.hashtags.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Hashtags", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(blogPost.hashtags.join(" "), margin, yPosition);
    }

    doc.save(`${postTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
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

      {user && subscription && (
        <div className="text-center text-gray-700 mb-4">
          <p>Plan: {subscription.plan || "Free"}</p>
          <p>
            Blog Posts Created: {subscription.blogPostAttempts || 0}/
            {subscription.plan === "Free"
              ? 3
              : subscription.plan === "Growth"
              ? 10
              : 30}
          </p>
          {subscription.blogPostAttempts >=
            (subscription.plan === "Free"
              ? 3
              : subscription.plan === "Growth"
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
                onClick={handleDownloadPDF}
                className="flex items-center space-x-1 bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
                title="Download as PDF"
              >
                <Download size={16} />
                <span>PDF</span>
              </button>
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
              className="w-full text-xl font-semibold mb-2 p-1 border-b border-gray-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Post title"
            />
            <p className="text-sm text-gray-600 mb-4">
              {formData.topic} • {new Date().toLocaleDateString()}
            </p>

            {Object.entries(blogPost).map(([section, content]) => {
              if (section === "slug") return null;

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
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
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
                              className="bg-gray-100 px-2 py-1 rounded text-sm"
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

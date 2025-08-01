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
import { generateContentStrategy } from "../../lib/gemini";
import { Download, Save, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

const ContentStrategyGenerator = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brandName: "",
    businessGoals: "",
    targetAudience: "",
    competitors: "",
    uniqueValueProposition: "",
    contentTypes: [],
    toneOfVoice: "Professional",
    keyMessages: "",
    metrics: "",
  });
  const [strategy, setStrategy] = useState(null);
  const [strategyName, setStrategyName] = useState("");
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

  const checkContentStrategyLimit = () => {
    if (!user) return "Please sign in to generate a content strategy.";
    if (!subscription) return "Loading subscription data...";

    const { plan, contentStrategyAttempts } = subscription;
    let maxStrategies;
    if (plan === "Free") maxStrategies = 2;
    else if (plan === "Growth") maxStrategies = 10;
    else if (plan === "Enterprise") maxStrategies = 30;

    if (contentStrategyAttempts >= maxStrategies) {
      return `You have reached the limit of ${maxStrategies} content strategy creations this month. Upgrade your plan to continue.`;
    }
    return null;
  };

  const incrementContentStrategyAttempts = async () => {
    if (!user || !subscription) return;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      "subscription.contentStrategyAttempts":
        subscription.contentStrategyAttempts + 1,
    });
    setSubscription((prev) => ({
      ...prev,
      contentStrategyAttempts: prev.contentStrategyAttempts + 1,
    }));
  };

  const contentTypesOptions = [
    "Blog Posts",
    "Social Media",
    "Email Newsletters",
    "Infographics",
    "Case Studies",
    "Whitepapers",
  ];

  const toneOptions = [
    "Professional",
    "Casual",
    "Friendly",
    "Authoritative",
    "Humorous",
    "Inspirational",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => {
      const newContentTypes = checked
        ? [...prev.contentTypes, name]
        : prev.contentTypes.filter((type) => type !== name);
      return { ...prev, contentTypes: newContentTypes };
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleGenerate = async () => {
    const limitMessage = checkContentStrategyLimit();
    if (limitMessage) {
      setError(limitMessage);
      return;
    }

    if (
      !formData.brandName ||
      !formData.businessGoals ||
      !formData.targetAudience
    ) {
      setError("Brand name, business goals, and target audience are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const generatedStrategy = await generateContentStrategy(formData);
      setStrategy(generatedStrategy);
      setStrategyName(`${formData.brandName} Content Strategy`);
      await incrementContentStrategyAttempts();
    } catch (err) {
      setError("Failed to generate content strategy: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!strategyName || !strategy) {
      setError("Please generate a strategy and provide a name before saving");
      return;
    }

    if (!user) {
      setError("You must be logged in to save a content strategy");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "contentStrategies"), {
        userId: user.uid,
        name: strategyName,
        brandName: formData.brandName,
        strategy,
        formData,
        createdAt: serverTimestamp(),
      });
      setSuccess("Content strategy saved successfully!");
      setTimeout(() => navigate("/content-strategies"), 2000);
    } catch (err) {
      setError("Failed to save content strategy: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!strategy) return;

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
    addText(strategyName, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Brand: ${formData.brandName}`, margin, yPosition);
    yPosition += 5;
    addText(
      `Generated on: ${new Date().toLocaleDateString()}`,
      margin,
      yPosition
    );
    yPosition += 10;

    Object.entries(strategy).forEach(([section, content]) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText(
        section
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        margin,
        yPosition
      );
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(content, margin, yPosition, { maxWidth: 190, lineHeight: 5 });
      yPosition += (content.split(" ").length / 10) * 5 + 10;
    });

    doc.save(`${strategyName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
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
        Content Strategy Generator
      </h1>

      {user && subscription && (
        <div className="text-center text-gray-700 mb-4">
          <p>Plan: {subscription.plan || "Free"}</p>
          <p>
            Content Strategies Created:{" "}
            {subscription.contentStrategyAttempts || 0}/
            {subscription.plan === "Free"
              ? 5
              : subscription.plan === "Growth"
              ? 10
              : 30}
          </p>
          {subscription.contentStrategyAttempts >=
            (subscription.plan === "Free"
              ? 5
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

      {!strategy ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Your brand name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Goals
              </label>
              <textarea
                name="businessGoals"
                value={formData.businessGoals}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="What are your primary business objectives?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <textarea
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="Describe your ideal customers"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competitors
              </label>
              <textarea
                name="competitors"
                value={formData.competitors}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="Who are your main competitors?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unique Value Proposition
              </label>
              <textarea
                name="uniqueValueProposition"
                value={formData.uniqueValueProposition}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="What makes your brand different?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {contentTypesOptions.map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name={type}
                      checked={formData.contentTypes.includes(type)}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone of Voice
              </label>
              <select
                name="toneOfVoice"
                value={formData.toneOfVoice}
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
                Key Messages
              </label>
              <textarea
                name="keyMessages"
                value={formData.keyMessages}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="What are your core brand messages?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Success Metrics
              </label>
              <textarea
                name="metrics"
                value={formData.metrics}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="How will you measure success?"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? "Generating..." : "Generate Content Strategy"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Generated Content Strategy
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
                onClick={() => setStrategy(null)}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="w-full text-xl font-semibold mb-2 p-1 border-b border-gray-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Strategy name"
            />
            <p className="text-sm text-gray-600 mb-4">
              {formData.brandName} • {new Date().toLocaleDateString()}
            </p>

            {Object.entries(strategy).map(([section, content]) => (
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
                  {expandedSections[section] ? <ChevronUp /> : <ChevronDown />}
                </div>

                {expandedSections[section] && (
                  <div className="mt-2 relative">
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
                  </div>
                )}
              </div>
            ))}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center space-x-2"
              >
                <Save size={16} />
                <span>{loading ? "Saving..." : "Save Strategy"}</span>
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

export default ContentStrategyGenerator;

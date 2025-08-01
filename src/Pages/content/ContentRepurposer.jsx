import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { repurposeContent } from "../../lib/gemini";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Save,
} from "lucide-react";
import { jsPDF } from "jspdf";

const platforms = [
  { id: "twitter", name: "Twitter", maxLength: 280 },
  { id: "linkedin", name: "LinkedIn", maxLength: 1300 },
  { id: "instagram", name: "Instagram", maxLength: 2200 },
  { id: "facebook", name: "Facebook", maxLength: 63206 },
  { id: "whatsapp", name: "WhatsApp", maxLength: 65536 },
];

const ContentRepurposer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [originalContent, setOriginalContent] = useState("");
  const [repurposedContent, setRepurposedContent] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState({});
  const [expandedPlatforms, setExpandedPlatforms] = useState({});

  useEffect(() => {
    const fetchContent = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        // Try to find the content in different collections
        const collections = [
          "contentPlans",
          "blogPosts",
          "contentStrategies",
          "brandingPackages",
        ];
        let contentDoc = null;

        for (const collection of collections) {
          const docRef = doc(db, collection, id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            contentDoc = { id: docSnap.id, ...docSnap.data() };
            break;
          }
        }

        if (!contentDoc) {
          throw new Error("Content not found");
        }

        // Extract content based on document type
        let content = "";
        if (contentDoc.contentPlan) {
          // Content plan - use first item's content
          content = contentDoc.contentPlan[0]?.content || "";
        } else if (contentDoc.post?.contentBody) {
          // Blog post - use the content body
          content = contentDoc.post.contentBody;
        } else if (contentDoc.strategy?.overview) {
          // Content strategy - use overview
          content = contentDoc.strategy.overview;
        } else if (contentDoc.package?.brandDescription) {
          // Branding package - use brand description
          content = contentDoc.package.brandDescription;
        }

        setOriginalContent(content);

        // Check if there's existing repurposed content
        if (contentDoc.repurposed) {
          setRepurposedContent(contentDoc.repurposed);
        }
      } catch (err) {
        setError("Failed to load content: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, user]);

  const togglePlatform = (platformId) => {
    setExpandedPlatforms((prev) => ({
      ...prev,
      [platformId]: !prev[platformId],
    }));
  };

  const handleRepurpose = async (platformId) => {
    if (!originalContent) {
      setError("No original content available to repurpose");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const content = await repurposeContent(originalContent, platformId);
      setRepurposedContent((prev) => ({
        ...prev,
        [platformId]: content,
      }));
    } catch (err) {
      setError(`Failed to repurpose for ${platformId}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, platformId) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied((prev) => ({ ...prev, [platformId]: true }));
        setTimeout(
          () => setCopied((prev) => ({ ...prev, [platformId]: false })),
          2000
        );
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const handleSave = async () => {
    if (!id || !user || Object.keys(repurposedContent).length === 0) return;

    setLoading(true);
    setError("");
    try {
      // Find the original document to update
      const collections = [
        "contentPlans",
        "blogPosts",
        "contentStrategies",
        "brandingPackages",
      ];
      let docRef = null;

      for (const collection of collections) {
        const ref = doc(db, collection, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          docRef = ref;
          break;
        }
      }

      if (!docRef) {
        throw new Error("Original content not found");
      }

      await updateDoc(docRef, {
        repurposed: repurposedContent,
        updatedAt: new Date().toISOString(),
      });

      setSuccess("Repurposed content saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save repurposed content: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (Object.keys(repurposedContent).length === 0) return;

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
    addText("Repurposed Content", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(
      `Original content: ${originalContent.substring(0, 50)}...`,
      margin,
      yPosition
    );
    yPosition += 10;

    // Add repurposed content for each platform
    Object.entries(repurposedContent).forEach(([platformId, content]) => {
      const platform = platforms.find((p) => p.id === platformId);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText(platform?.name || platformId, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(content, margin, yPosition, { maxWidth: 190, lineHeight: 5 });
      yPosition += (content.split(" ").length / 10) * 5 + 10;
    });

    doc.save(`repurposed_content_${id}.pdf`);
  };

  if (loading && !originalContent) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  if (!originalContent) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No content found to repurpose.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Content Repurposer</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1 bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
            title="Download as PDF"
            disabled={Object.keys(repurposedContent).length === 0}
          >
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
            disabled={loading || Object.keys(repurposedContent).length === 0}
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Original Content
        </h2>
        <div className="prose max-w-none text-gray-700 bg-gray-50 p-4 rounded">
          {originalContent}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Repurpose For Platforms
        </h2>

        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => togglePlatform(platform.id)}
            >
              <div>
                <h3 className="font-medium text-gray-800">{platform.name}</h3>
                <p className="text-sm text-gray-600">
                  Max {platform.maxLength} characters
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {repurposedContent[platform.id] ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Ready
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRepurpose(platform.id);
                    }}
                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                )}
                {expandedPlatforms[platform.id] ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </div>
            </div>

            {expandedPlatforms[platform.id] &&
              repurposedContent[platform.id] && (
                <div className="border-t border-gray-200 p-4 relative">
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {repurposedContent[platform.id]}
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(repurposedContent[platform.id], platform.id)
                    }
                    className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600"
                    title="Copy to clipboard"
                  >
                    {copied[platform.id] ? (
                      <Check className="text-green-500" />
                    ) : (
                      <Copy />
                    )}
                  </button>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentRepurposer;

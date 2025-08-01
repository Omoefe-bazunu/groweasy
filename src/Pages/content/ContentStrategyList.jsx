import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

const ContentStrategyList = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStrategy, setExpandedStrategy] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStrategies = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "contentStrategies"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const strategiesData = [];

        querySnapshot.forEach((doc) => {
          strategiesData.push({ id: doc.id, ...doc.data() });
        });

        setStrategies(strategiesData);
      } catch (error) {
        console.error("Error fetching content strategies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [user]);

  const handleDelete = async (strategyId) => {
    if (
      window.confirm("Are you sure you want to delete this content strategy?")
    ) {
      try {
        await deleteDoc(doc(db, "contentStrategies", strategyId));
        setStrategies(
          strategies.filter((strategy) => strategy.id !== strategyId)
        );
      } catch (error) {
        console.error("Error deleting content strategy:", error);
      }
    }
  };

  const handleDownloadPDF = (strategy) => {
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
    addText(strategy.name, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Brand: ${strategy.brandName}`, margin, yPosition);
    yPosition += 5;
    addText(
      `Created: ${new Date(strategy.createdAt).toLocaleDateString()}`,
      margin,
      yPosition
    );
    yPosition += 10;

    // Add strategy sections
    Object.entries(strategy.strategy).forEach(([section, content]) => {
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

    doc.save(`${strategy.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
  };

  const toggleExpand = (strategyId) => {
    setExpandedStrategy(expandedStrategy === strategyId ? null : strategyId);
  };

  if (loading)
    return (
      <div className="text-center py-8">Loading content strategies...</div>
    );
  if (strategies.length === 0)
    return (
      <div className="text-center py-8 min-h-screen mx-auto p-6 pb-32">
        <p className="text-gray-600 mb-4">No content strategies found.</p>
        <button
          onClick={() => navigate("/content-strategies/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
        >
          Create New Strategy
        </button>
      </div>
    );

  return (
    <div className="min-h-screen max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto p-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Your Content Strategies
        </h1>
        <button
          onClick={() => navigate("/content-strategy/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create New Strategy
        </button>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(strategy.id)}
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {strategy.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {strategy.brandName} •{" "}
                  {new Date(strategy.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPDF(strategy);
                  }}
                  className="text-gray-500 hover:text-indigo-600 p-1 rounded-full"
                  title="Download as PDF"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(strategy.id);
                  }}
                  className="text-gray-500 hover:text-red-600 p-1 rounded-full"
                  title="Delete strategy"
                >
                  <Trash2 size={18} />
                </button>
                {expandedStrategy === strategy.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {expandedStrategy === strategy.id && (
              <div className="border-t border-gray-200 p-4">
                {Object.entries(strategy.strategy).map(([section, content]) => (
                  <div key={section} className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-1">
                      {section
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentStrategyList;

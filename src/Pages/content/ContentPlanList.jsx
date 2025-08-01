import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useUser } from "../../context/UserContext";
import { Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

const ContentPlanList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "contentPlans"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const plansData = [];

        querySnapshot.forEach((doc) => {
          plansData.push({ id: doc.id, ...doc.data() });
        });

        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching content plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user]);

  const handleDelete = async (planId) => {
    if (window.confirm("Are you sure you want to delete this content plan?")) {
      try {
        await deleteDoc(doc(db, "contentPlans", planId));
        setPlans(plans.filter((plan) => plan.id !== planId));
      } catch (error) {
        console.error("Error deleting content plan:", error);
      }
    }
  };

  const handleDownloadPDF = (plan) => {
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
    addText(`Content Plan: ${plan.name}`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Brand: ${plan.brandName}`, margin, yPosition);
    yPosition += 5;
    addText(
      `Created: ${new Date(plan.createdAt).toLocaleDateString()}`,
      margin,
      yPosition
    );
    yPosition += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText("Content Schedule", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    plan.contentPlan.forEach((item) => {
      doc.setFont("helvetica", "bold");
      addText(`Day ${item.Day}:`, margin, yPosition);
      yPosition += 5;

      doc.setFont("helvetica", "normal");
      addText(item.content, margin, yPosition, {
        maxWidth: 190,
        lineHeight: 5,
      });
      yPosition += (item.content.split(" ").length / 10) * 5 + 5;

      if (item.imagePrompt) {
        doc.setFont("helvetica", "bold");
        addText("Image Prompt:", margin, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        addText(item.imagePrompt, margin, yPosition, {
          maxWidth: 190,
          lineHeight: 5,
        });
        yPosition += (item.imagePrompt.split(" ").length / 10) * 5 + 5;
      }

      if (item.videoPrompt) {
        doc.setFont("helvetica", "bold");
        addText("Video Prompt:", margin, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        addText(item.videoPrompt, margin, yPosition, {
          maxWidth: 190,
          lineHeight: 5,
        });
        yPosition += (item.videoPrompt.split(" ").length / 10) * 5 + 5;
      }

      yPosition += 5;
    });

    doc.save(
      `${plan.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_content_plan.pdf`
    );
  };

  const toggleExpand = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  if (loading)
    return <div className="text-center py-8">Loading content plans...</div>;
  if (plans.length === 0)
    return (
      <div className="text-center py-8 min-h-screen mx-auto p-6 pb-32">
        <p className="text-gray-600 mb-4">No content plans found.</p>
        <button
          onClick={() => navigate("/content-plans/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
        >
          Create New Plan
        </button>
      </div>
    );

  return (
    <div className="min-h-screen max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto p-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Content Plans</h1>
        <button
          onClick={() => navigate("/content-plan/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create New Plan
        </button>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(plan.id)}
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {plan.brandName} •{" "}
                  {new Date(plan.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPDF(plan);
                  }}
                  className="text-gray-500 hover:text-indigo-600 p-1 rounded-full"
                  title="Download as PDF"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(plan.id);
                  }}
                  className="text-gray-500 hover:text-red-600 p-1 rounded-full"
                  title="Delete plan"
                >
                  <Trash2 size={18} />
                </button>
                {expandedPlan === plan.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {expandedPlan === plan.id && (
              <div className="border-t border-gray-200 p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image Prompt
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Video Prompt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plan.contentPlan.map((item) => (
                        <tr key={item.Day}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {item.Day}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.content}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.imagePrompt || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.videoPrompt || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentPlanList;

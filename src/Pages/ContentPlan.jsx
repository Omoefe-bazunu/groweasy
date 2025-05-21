import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import { ChevronDown, ChevronUp, Copy, Download, Trash2 } from "lucide-react";

const ContentPlan = () => {
  const { user } = useUser();
  const [plans, setPlans] = useState([]);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState({});
  const navigate = useNavigate();

  const handleCreateContentPlan = () => navigate("/content-creation-board");

  // Fetch all plans for the current user from Firestore
  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) {
        setError("You must be logged in to view your content plans.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching plans for user UID:", user.uid);
        const q = query(
          collection(db, "plans"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const userPlans = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched plans:", userPlans);
        setPlans(userPlans);
      } catch (err) {
        setError("Failed to fetch content plans: " + err.message);
        console.error("Fetch plans error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user]);

  // Toggle collapse/expand for a plan
  const togglePlan = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  // Copy text to clipboard
  const handleCopy = (text, itemId, field) => {
    if (!text || text === "-") return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback((prev) => ({
          ...prev,
          [`${itemId}-${field}`]: true,
        }));
        setTimeout(() => {
          setCopyFeedback((prev) => ({
            ...prev,
            [`${itemId}-${field}`]: false,
          }));
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text:", err);
      });
  };

  // Download a plan as PDF
  const handleDownloadPDF = (plan) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let yPosition = margin;

    // Helper function to add text and handle pagination
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

    // Helper function to draw a table row
    const drawTableRow = (rowData, colWidths, rowHeight = 5) => {
      const totalHeight = rowData.reduce((maxHeight, cell) => {
        const lines = doc.splitTextToSize(
          cell,
          colWidths[rowData.indexOf(cell)] - 2
        );
        return Math.max(maxHeight, lines.length * rowHeight);
      }, rowHeight);

      if (yPosition + totalHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      let xPosition = margin;
      rowData.forEach((cell, i) => {
        const lines = doc.splitTextToSize(cell, colWidths[i] - 2);
        doc.text(lines, xPosition + 1, yPosition + 4);
        doc.rect(xPosition, yPosition, colWidths[i], totalHeight);
        xPosition += colWidths[i];
      });

      yPosition += totalHeight;
    };

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText("Content Plan", margin, yPosition);

    // Plan Name
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Name: ${plan.name}`, margin, yPosition);

    // Add formData details to the PDF
    doc.setFontSize(10);
    addText(`Business Name: ${plan.formData.businessName}`, margin, yPosition);
    addText(`Nature of Business: ${plan.formData.nature}`, margin, yPosition);
    addText(`Contact Address: ${plan.formData.contactInfo}`, margin, yPosition);
    addText(`Phone Number: ${plan.formData.phoneNumber}`, margin, yPosition);
    addText(`Email Address: ${plan.formData.email}`, margin, yPosition);
    if (plan.formData.websiteLink) {
      addText(`Website Link: ${plan.formData.websiteLink}`, margin, yPosition);
    }
    addText(`Description: ${plan.formData.description}`, margin, yPosition, {
      maxWidth: 190,
      lineHeight: 5,
    });
    addText(
      `Business Goals: ${plan.formData.businessGoals}`,
      margin,
      yPosition
    );
    addText(
      `Target Audience: ${plan.formData.targetAudience}`,
      margin,
      yPosition,
      { maxWidth: 190, lineHeight: 5 }
    );
    addText(`Content Type: ${plan.formData.contentTypes}`, margin, yPosition);
    addText(
      `Posting Frequency: ${plan.formData.postingFrequency}`,
      margin,
      yPosition
    );
    addText(`Tone of Voice: ${plan.formData.toneOfVoice}`, margin, yPosition);
    addText(`Number of Days: ${plan.formData.numberOfDays}`, margin, yPosition);
    if (plan.formData.extraNotes) {
      addText(`Extra Notes: ${plan.formData.extraNotes}`, margin, yPosition, {
        maxWidth: 190,
        lineHeight: 5,
      });
    }

    yPosition += 5;

    // Content Plan Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    addText("Content Plan Schedule", margin, yPosition);

    doc.setFontSize(10);
    const colWidths = [30, 60, 50, 50];
    const headers = ["Day", "Content", "Image Prompt", "Video Prompt"];
    drawTableRow(headers, colWidths);

    doc.setFont("helvetica", "normal");
    plan.contentPlan.forEach((item) => {
      const row = [
        item.Day.toString(),
        item.content,
        item.imagePrompt || "-",
        item.videoPrompt || "-",
      ];
      drawTableRow(row, colWidths);
    });

    doc.save(`${plan.name || "content-plan"}.pdf`);
  };

  // Delete a plan from Firestore with confirmation
  const handleDeletePlan = async (planId, planName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the content plan "${planName}"? This action cannot be undone.`
    );
    if (!confirmDelete) {
      console.log("Deletion cancelled for plan:", planId);
      return;
    }

    try {
      console.log("Deleting plan with ID:", planId);
      await deleteDoc(doc(db, "plans", planId));
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      setExpandedPlans((prev) => {
        const updated = { ...prev };
        delete updated[planId];
        return updated;
      });
      console.log("Plan deleted successfully:", planId);
    } catch (err) {
      setError("Failed to delete content plan: " + err.message);
      console.error("Delete plan error:", err);
    }
  };

  return (
    <div className="min-h-screen p-6 pb-32">
      <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
        Your Content Plans
      </h1>
      {loading ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading your content plans...</p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            No content plans found. <br />{" "}
            <span
              className="text-[#5247bf] cursor-pointer font-semibold"
              onClick={handleCreateContentPlan}
            >
              Create Content Plan
            </span>
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-[#5247bf] scrollbar-track-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 w-full text-center">
              TOTAL COUNT ({plans.length})
            </h2>
          </div>
          <div className="space-y-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-gray-50 rounded-xl shadow-lg hover:bg-purple-100 transition-all duration-300"
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => togglePlan(plan.id)}
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    {plan.name}
                  </h3>
                  {expandedPlans[plan.id] ? (
                    <ChevronUp className="w-5 h-5 text-[#5247bf]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#5247bf]" />
                  )}
                </div>
                {expandedPlans[plan.id] && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                        <thead>
                          <tr className="bg-[#5247bf] text-white">
                            <th className="p-3 text-left">Day</th>
                            <th className="p-3 text-left">Content</th>
                            <th className="p-3 text-left">Image Prompt</th>
                            <th className="p-3 text-left">Video Prompt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.contentPlan.map((item) => (
                            <tr
                              key={item.Day}
                              className="border-b border-gray-200"
                            >
                              <td className="p-3 text-gray-800">{item.Day}</td>
                              <td className="p-3 text-gray-800 relative group">
                                <div className="flex items-center space-x-2">
                                  <span>{item.content}</span>
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        item.content,
                                        item.Day,
                                        "content"
                                      )
                                    }
                                    className="text-gray-500 hover:text-[#5247bf] transition-colors"
                                    title="Copy Content"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                                {copyFeedback[`${item.Day}-content`] && (
                                  <span className="absolute top-0 right-0 mt-1 mr-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                    Copied!
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-gray-800 relative group">
                                <div className="flex items-center space-x-2">
                                  <span>{item.imagePrompt || "-"}</span>
                                  {item.imagePrompt && (
                                    <button
                                      onClick={() =>
                                        handleCopy(
                                          item.imagePrompt,
                                          item.Day,
                                          "imagePrompt"
                                        )
                                      }
                                      className="text-gray-500 hover:text-[#5247bf] transition-colors"
                                      title="Copy Image Prompt"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {copyFeedback[`${item.Day}-imagePrompt`] && (
                                  <span className="absolute top-0 right-0 mt-1 mr-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                    Copied!
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-gray-800 relative group">
                                <div className="flex items-center space-x-2">
                                  <span>{item.videoPrompt || "-"}</span>
                                  {item.videoPrompt && (
                                    <button
                                      onClick={() =>
                                        handleCopy(
                                          item.videoPrompt,
                                          item.Day,
                                          "videoPrompt"
                                        )
                                      }
                                      className="text-gray-500 hover:text-[#5247bf] transition-colors"
                                      title="Copy Video Prompt"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                {copyFeedback[`${item.Day}-videoPrompt`] && (
                                  <span className="absolute top-0 right-0 mt-1 mr-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                    Copied!
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={() => handleDownloadPDF(plan)}
                        className="flex-1 bg-gray-200 text-gray-800 p-2 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id, plan.name)}
                        className="flex-1 bg-red-100 text-red-800 p-2 rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPlan;

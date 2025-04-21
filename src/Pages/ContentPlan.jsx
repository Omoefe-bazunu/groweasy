import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
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
import { ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react";

const ContentPlan = () => {
  const { user } = useUser();
  const [plans, setPlans] = useState([]);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all plans for the current user from Firestore
  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) {
        setError("You must be logged in to view your content plans.");
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "plans"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const userPlans = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlans(userPlans);
      } catch (err) {
        setError("Failed to fetch content plans.");
        console.error(err);
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

  // Download a plan as PDF
  const handleDownloadPDF = (plan) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Content Plan", 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${plan.name}`, 20, 30);

    let yPosition = 40;
    plan.contentPlan.forEach((item, index) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Due Date: ${item.dueDate}`, 20, yPosition);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      yPosition += 10;
      doc.text(`Best Posting Time: ${item.bestPostingTime}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Content: ${item.content}`, 20, yPosition, { maxWidth: 160 });
      yPosition += 20;
      if (item.imagePrompt) {
        doc.text(`Image Prompt: ${item.imagePrompt}`, 20, yPosition, {
          maxWidth: 160,
        });
        yPosition += 10;
      }
      if (item.videoPrompt) {
        doc.text(`Video Prompt: ${item.videoPrompt}`, 20, yPosition, {
          maxWidth: 160,
        });
        yPosition += 10;
      }
      yPosition += 10;
      doc.line(20, yPosition, 190, yPosition); // Separator line
      yPosition += 10;
    });

    doc.save(`${plan.name || "content-plan"}.pdf`);
  };

  // Delete a plan from Firestore
  const handleDeletePlan = async (planId) => {
    try {
      await deleteDoc(doc(db, "plans", planId));
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      setExpandedPlans((prev) => {
        const updated = { ...prev };
        delete updated[planId];
        return updated;
      });
    } catch (err) {
      setError("Failed to delete content plan.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 pb-20">
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
          <p className="text-gray-600 mb-4">No content plans found.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Plans ({plans.length})
            </h2>
          </div>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-lg hover:bg-purple-50 transition-all duration-300"
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
                    <div className="space-y-4">
                      {plan.contentPlan.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-lg p-4 border-t-2 border-[#5247bf]"
                        >
                          <p className="text-lg font-bold text-gray-800">
                            Due Date: {item.dueDate}
                          </p>
                          <p className="text-gray-600 mt-2">
                            <span className="font-semibold">
                              Best Posting Time:
                            </span>{" "}
                            {item.bestPostingTime}
                          </p>
                          <p className="text-gray-600 mt-2">
                            <span className="font-semibold">Content:</span>{" "}
                            {item.content}
                          </p>
                          {item.imagePrompt && (
                            <p className="text-gray-600 mt-2">
                              <span className="font-semibold">
                                Image Prompt:
                              </span>{" "}
                              {item.imagePrompt}
                            </p>
                          )}
                          {item.videoPrompt && (
                            <p className="text-gray-600 mt-2">
                              <span className="font-semibold">
                                Video Prompt:
                              </span>{" "}
                              {item.videoPrompt}
                            </p>
                          )}
                        </div>
                      ))}
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
                        onClick={() => handleDeletePlan(plan.id)}
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

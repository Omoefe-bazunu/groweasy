import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { generateContentPlan } from "../lib/gemini";
import { jsPDF } from "jspdf";
import { X } from "lucide-react";

const ContentCreationBoard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    businessName: "",
    nature: "",
    description: "",
    businessGoals: "",
    targetAudience: "",
    contentTypes: "",
    numberOfDays: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const [contentPlan, setContentPlan] = useState(null);
  const [planName, setPlanName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Comprehensive list of business goals
  const businessGoalsOptions = [
    "Increase brand awareness",
    "Drive website traffic",
    "Generate leads",
    "Boost sales",
    "Enhance customer engagement",
    "Build customer loyalty",
    "Launch a new product/service",
    "Expand market reach",
    "Improve online presence",
    "Increase social media following",
    "Enhance SEO rankings",
    "Establish thought leadership",
    "Increase email subscribers",
    "Improve conversion rates",
    "Reduce customer churn",
    "Increase foot traffic (physical store)",
    "Promote seasonal campaigns",
    "Educate customers about products/services",
    "Build partnerships/collaborations",
    "Increase repeat purchases",
  ];

  // List of content types
  const contentTypesOptions = [
    "Blog Posts",
    "Social Media Campaigns (Instagram)",
    "Social Media Campaigns (Twitter)",
    "Social Media Campaigns (LinkedIn)",
    "Email Newsletters",
    "Webinars",
    "Whitepapers",
    "Case Studies",
    "Infographics",
    "Videos",
  ];

  const steps = [
    {
      label: "Business Name",
      field: "businessName",
      type: "text",
      placeholder: "e.g., My Awesome Business",
    },
    {
      label: "Nature of Business",
      field: "nature",
      type: "select",
      options: ["Remote", "Physical Store"],
    },
    {
      label: "Description of Products/Services",
      field: "description",
      type: "textarea",
      placeholder:
        "e.g., We offer innovative tech solutions for small businesses.",
    },
    {
      label: "Business Goals",
      field: "businessGoals",
      type: "select",
      options: businessGoalsOptions,
    },
    {
      label: "Target Audience",
      field: "targetAudience",
      type: "textarea",
      placeholder:
        "e.g., Young professionals aged 25-35, small business owners",
    },
    {
      label: "Preferred Content Type",
      field: "contentTypes",
      type: "select",
      options: contentTypesOptions,
    },
    {
      label: "Number of Days for Plan",
      field: "numberOfDays",
      type: "number",
      placeholder: "e.g., 30",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsReadyToGenerate(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsReadyToGenerate(false);
    }
  };

  const handleGenerateContentPlan = async () => {
    if (
      !formData.businessName ||
      !formData.nature ||
      !formData.description ||
      !formData.businessGoals ||
      !formData.targetAudience ||
      !formData.contentTypes ||
      !formData.numberOfDays
    ) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const generatedPlan = await generateContentPlan(formData);
      setContentPlan(generatedPlan);
      setIsModalOpen(false);
      setCurrentStep(0);
      setIsReadyToGenerate(false);
    } catch (err) {
      setError("Failed to generate content plan");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContentPlan = async () => {
    if (!planName) {
      setError("Please provide a name for the content plan");
      return;
    }
    if (!user) {
      setError("You must be logged in to save a content plan");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await addDoc(collection(db, "plans"), {
        name: planName,
        userId: user.uid,
        contentPlan,
        createdAt: new Date().toISOString(),
      });
      setSuccess("Content plan saved successfully!");
      setTimeout(() => navigate("/content-plan"), 2000);
    } catch (err) {
      setError("Failed to save content plan");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contentPlan) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Content Plan", 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${planName || "Unnamed Plan"}`, 20, 30);

    let yPosition = 40;
    contentPlan.forEach((item, index) => {
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

    doc.save(`${planName || "content-plan"}.pdf`);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError("");
    setSuccess("");
    setIsReadyToGenerate(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStep(0);
    setIsReadyToGenerate(false);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
          Content Creation Board
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {success && (
          <p className="text-green-500 mb-4 text-center">{success}</p>
        )}

        {contentPlan ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Generated Content Plan
              </h2>
              <button
                onClick={handleOpenModal}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
              >
                Edit Details
              </button>
            </div>
            <div className="space-y-6">
              {contentPlan.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 border-t-2 border-[#5247bf]"
                >
                  <p className="text-lg font-bold text-gray-800">
                    Due Date: {item.dueDate}
                  </p>
                  <p className="text-gray-600 mt-2">
                    <span className="font-semibold">Best Posting Time:</span>{" "}
                    {item.bestPostingTime}
                  </p>
                  <p className="text-gray-600 mt-2">
                    <span className="font-semibold">Content:</span>{" "}
                    {item.content}
                  </p>
                  {item.imagePrompt && (
                    <p className="text-gray-600 mt-2">
                      <span className="font-semibold">Image Prompt:</span>{" "}
                      {item.imagePrompt}
                    </p>
                  )}
                  {item.videoPrompt && (
                    <p className="text-gray-600 mt-2">
                      <span className="font-semibold">Video Prompt:</span>{" "}
                      {item.videoPrompt}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label
                htmlFor="planName"
                className="block text-gray-700 font-medium mb-1"
              >
                Content Plan Name
              </label>
              <input
                type="text"
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                placeholder="e.g., Q2 2025 Marketing Plan"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSaveContentPlan}
                className="flex-1 bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Content Plan"}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200"
              >
                Download as PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleOpenModal}
              className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-all duration-200"
            >
              Create Content Plan
            </button>
          </div>
        )}
      </div>

      {/* Multi-Step Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            {!isReadyToGenerate ? (
              <>
                <h2 className="text-2xl font-semibold text-[#5247bf] mb-4">
                  {steps[currentStep].label}
                </h2>
                <div>
                  {steps[currentStep].type === "text" && (
                    <input
                      type="text"
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                      placeholder={steps[currentStep].placeholder}
                      required
                    />
                  )}
                  {steps[currentStep].type === "textarea" && (
                    <textarea
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                      rows="3"
                      placeholder={steps[currentStep].placeholder}
                      required
                    />
                  )}
                  {steps[currentStep].type === "number" && (
                    <input
                      type="number"
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                      placeholder={steps[currentStep].placeholder}
                      min="1"
                      required
                    />
                  )}
                  {steps[currentStep].type === "select" && (
                    <select
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                      required
                    >
                      <option value="" disabled>
                        Select {steps[currentStep].label.toLowerCase()}
                      </option>
                      {steps[currentStep].options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex space-x-4 mt-6">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300"
                    >
                      {currentStep < steps.length - 1 ? "Next" : "Finish"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-[#5247bf] mb-4">
                  Ready to Generate
                </h2>
                <p className="text-gray-600 mb-6">
                  You’ve provided all the details. Click below to generate your
                  content plan.
                </p>
                <button
                  onClick={handleGenerateContentPlan}
                  className="w-full bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Content Plan"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCreationBoard;

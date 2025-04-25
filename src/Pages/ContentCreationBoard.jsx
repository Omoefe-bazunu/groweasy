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
    contactInfo: "",
    phoneNumber: "",
    email: "",
    websiteLink: "",
    description: "",
    businessGoals: "",
    targetAudience: "",
    contentTypes: [],
    postingFrequency: "",
    toneOfVoice: "",
    numberOfDays: "",
    extraNotes: "",
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
    "Increase foot traffic (physical store)",
    "Promote seasonal campaigns",
    "Educate customers about products/services",
    "Build partnerships/collaborations",
    "Increase repeat purchases",
  ];

  // List of content types (for multi-select)
  const contentTypesOptions = [
    "Blog Posts",
    "Social Media Campaigns (Instagram)",
    "Social Media Campaigns (Twitter)",
    "Social Media Campaigns (LinkedIn)",
    "Social Media Campaigns (Facebook)",
    "Email Newsletters",
  ];

  // Options for additional fields
  const postingFrequencyOptions = [
    "Daily",
    "Every Other Day",
    "Weekly",
    "Bi-Weekly",
  ];

  const toneOfVoiceOptions = [
    "Professional",
    "Casual",
    "Humorous",
    "Inspirational",
    "Educational",
  ];

  const steps = [
    {
      label: "Business Name",
      field: "businessName",
      type: "text",
      placeholder: "e.g., My Awesome Business",
      required: true,
    },
    {
      label: "Nature of Business",
      field: "nature",
      type: "select",
      options: ["Remote", "Physical Store", "Remote & Physical"],
      required: true,
    },
    {
      label: "Contact Address",
      field: "contactInfo",
      type: "text",
      placeholder: "e.g., Legit Road, Otefe-Oghara, Delta State, Nigeria",
      required: true,
    },
    {
      label: "Phone Number",
      field: "phoneNumber",
      type: "text",
      placeholder: "e.g., +2349043970401",
      required: true,
    },
    {
      label: "Email Address",
      field: "email",
      type: "email",
      placeholder: "e.g., raniem57@gmail.com",
      required: true,
    },
    {
      label: "Website Link (Optional)",
      field: "websiteLink",
      type: "text",
      placeholder: "e.g., www.penned.com.ng",
      required: false,
    },
    {
      label: "Description of Products/Services",
      field: "description",
      type: "textarea",
      placeholder:
        "e.g., We offer innovative tech solutions for small businesses.",
      required: true,
    },
    {
      label: "Business Goals",
      field: "businessGoals",
      type: "select",
      options: businessGoalsOptions,
      required: true,
    },
    {
      label: "Target Audience",
      field: "targetAudience",
      type: "textarea",
      placeholder:
        "e.g., Young professionals aged 25-35, small business owners",
      required: true,
    },
    {
      label: "Preferred Content Types",
      field: "contentTypes",
      type: "checkbox",
      options: contentTypesOptions,
      required: true,
    },
    {
      label: "Posting Frequency",
      field: "postingFrequency",
      type: "select",
      options: postingFrequencyOptions,
      required: true,
    },
    {
      label: "Tone of Voice",
      field: "toneOfVoice",
      type: "select",
      options: toneOfVoiceOptions,
      required: true,
    },
    {
      label: "Number of Days for Content Plan",
      field: "numberOfDays",
      type: "number",
      placeholder: "e.g., 7",
      required: true,
      min: 1,
      max: 90,
    },
    {
      label: "Extra Notes",
      field: "extraNotes",
      type: "textarea",
      placeholder:
        "e.g., Any additional preferences or notes for the content plan",
      required: false,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentTypes = prev.contentTypes || [];
      if (checked) {
        return { ...prev, contentTypes: [...currentTypes, value] };
      } else {
        return {
          ...prev,
          contentTypes: currentTypes.filter((type) => type !== value),
        };
      }
    });
  };

  const validateCurrentStep = () => {
    const step = steps[currentStep];
    const value = formData[step.field];

    if (step.required) {
      if (step.type === "checkbox") {
        return formData.contentTypes && formData.contentTypes.length > 0;
      }
      if (step.type === "number") {
        const numValue = parseInt(value, 10);
        return (
          value &&
          !isNaN(numValue) &&
          numValue >= (step.min || 1) &&
          (step.max ? numValue <= step.max : true)
        );
      }
      return value && value.trim() !== "";
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setError(`${steps[currentStep].label} is required.`);
      return;
    }

    setError("");
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
      setError("");
    }
  };

  const handleGenerateContentPlan = async () => {
    const requiredFields = steps
      .filter((step) => step.required)
      .map((step) => step.field);
    const missingFields = requiredFields.filter((field) => {
      if (field === "contentTypes") {
        return !formData.contentTypes || formData.contentTypes.length === 0;
      }
      if (field === "numberOfDays") {
        const numValue = parseInt(formData[field], 10);
        return !formData[field] || isNaN(numValue) || numValue < 1;
      }
      return !formData[field] || formData[field].trim() === "";
    });

    if (missingFields.length > 0) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const generatedPlan = await generateContentPlan(formData);
      if (!generatedPlan || generatedPlan.length === 0) {
        throw new Error("Generated content plan is empty");
      }
      setContentPlan(generatedPlan);
      setIsModalOpen(false);
      setCurrentStep(0);
      setIsReadyToGenerate(false);
    } catch (err) {
      setError(`Failed to generate content plan: ${err.message}`);
      console.error("Generate content plan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContentPlan = async () => {
    if (!planName) {
      setError("Please provide a name for the content plan.");
      return;
    }
    if (!user) {
      setError("You must be logged in to save a content plan.");
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
        formData,
        createdAt: new Date().toISOString(),
      });
      setSuccess("Content plan saved successfully!");
      setTimeout(() => navigate("/content-plan"), 2000);
    } catch (err) {
      setError("Failed to save content plan: " + err.message);
      console.error("Save content plan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contentPlan) return;

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
    addText(`Name: ${planName || "Unnamed Plan"}`, margin, yPosition);

    // Add formData details to the PDF
    doc.setFontSize(10);
    addText(`Business Name: ${formData.businessName}`, margin, yPosition);
    addText(`Nature of Business: ${formData.nature}`, margin, yPosition);
    addText(`Contact Address: ${formData.contactInfo}`, margin, yPosition);
    addText(`Phone Number: ${formData.phoneNumber}`, margin, yPosition);
    addText(`Email Address: ${formData.email}`, margin, yPosition);
    if (formData.websiteLink) {
      addText(`Website Link: ${formData.websiteLink}`, margin, yPosition);
    }
    addText(`Description: ${formData.description}`, margin, yPosition, {
      maxWidth: 190,
      lineHeight: 5,
    });
    addText(`Business Goals: ${formData.businessGoals}`, margin, yPosition);
    addText(`Target Audience: ${formData.targetAudience}`, margin, yPosition, {
      maxWidth: 190,
      lineHeight: 5,
    });
    addText(
      `Content Types: ${formData.contentTypes.join(", ")}`,
      margin,
      yPosition
    );
    addText(
      `Posting Frequency: ${formData.postingFrequency}`,
      margin,
      yPosition
    );
    addText(`Tone of Voice: ${formData.toneOfVoice}`, margin, yPosition);
    addText(`Number of Days: ${formData.numberOfDays}`, margin, yPosition);
    if (formData.extraNotes) {
      addText(`Extra Notes: ${formData.extraNotes}`, margin, yPosition, {
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
    const colWidths = [20, 25, 25, 50, 40, 40];
    const headers = [
      "ID",
      "Due Date",
      "Best Time",
      "Content",
      "Image Prompt",
      "Video Prompt",
    ];
    drawTableRow(headers, colWidths);

    doc.setFont("helvetica", "normal");
    contentPlan.forEach((item) => {
      const row = [
        item.id.toString(),
        item.dueDate,
        item.bestPostingTime,
        item.content,
        item.imagePrompt || "-",
        item.videoPrompt || "-",
      ];
      drawTableRow(row, colWidths);
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
    setError("");
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-6 pb-20">
      <div className="max-w-4xl mx-auto">
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
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                <thead>
                  <tr className="bg-[#5247bf] text-white">
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Due Date</th>
                    <th className="p-3 text-left">Best Posting Time</th>
                    <th className="p-3 text-left">Content</th>
                    <th className="p-3 text-left">Image Prompt</th>
                    <th className="p-3 text-left">Video Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {contentPlan.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="p-3 text-gray-800">{item.id}</td>
                      <td className="p-3 text-gray-800">{item.dueDate}</td>
                      <td className="p-3 text-gray-800">
                        {item.bestPostingTime}
                      </td>
                      <td className="p-3 text-gray-800">{item.content}</td>
                      <td className="p-3 text-gray-800">
                        {item.imagePrompt || "-"}
                      </td>
                      <td className="p-3 text-gray-800">
                        {item.videoPrompt || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative max-h-[80vh] overflow-y-auto">
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
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                      placeholder={steps[currentStep].placeholder}
                      required={steps[currentStep].required}
                    />
                  )}
                  {steps[currentStep].type === "email" && (
                    <input
                      type="email"
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                      placeholder={steps[currentStep].field}
                      required={steps[currentStep].required}
                    />
                  )}
                  {steps[currentStep].type === "textarea" && (
                    <textarea
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf] resize-none"
                      rows="3"
                      placeholder={steps[currentStep].placeholder}
                      required={steps[currentStep].required}
                    />
                  )}
                  {steps[currentStep].type === "select" && (
                    <select
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                      required={steps[currentStep].required}
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
                  {steps[currentStep].type === "checkbox" && (
                    <div className="space-y-2">
                      {steps[currentStep].options.map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={formData.contentTypes.includes(option)}
                            onChange={handleCheckboxChange}
                            className="h-5 w-5 text-[#5247bf] focus:ring-[#5247bf]"
                          />
                          <span className="text-gray-600">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {steps[currentStep].type === "number" && (
                    <input
                      type="number"
                      name={steps[currentStep].field}
                      value={formData[steps[currentStep].field]}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                      placeholder={steps[currentStep].placeholder}
                      required={steps[currentStep].required}
                      min={steps[currentStep].min}
                      max={steps[currentStep].max}
                    />
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

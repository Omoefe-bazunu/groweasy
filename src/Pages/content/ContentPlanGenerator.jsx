import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateContentPlan } from "../../lib/gemini";
import { Copy, X } from "lucide-react";

const ContentPlanGenerator = () => {
  const navigate = useNavigate();
  const { user, userData, incrementUsage } = useUser();
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
    contentTypes: "",
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
  const [copyFeedback, setCopyFeedback] = useState({});

  const checkContentPlanLimit = () => {
    if (!user) return "Please sign in to create a content plan.";
    if (!userData?.subscription) return "Loading subscription data...";

    const { plan, contentPlans } = userData.subscription;
    let maxPlans;
    if (plan === "Free") maxPlans = 5;
    else if (plan === "Growth") maxPlans = 20;
    else if (plan === "Enterprise") maxPlans = 50;

    if (contentPlans >= maxPlans) {
      return `You have reached the limit of ${maxPlans} content plan creations this month. Upgrade your plan to continue.`;
    }
    return null;
  };

  const businessGoalsOptions = [
    "Increase brand awareness",
    "Drive website traffic",
    "Generate leads",
    "Boost sales",
    "Enhance customer engagement",
    "Build customer loyalty",
    "Increase social media following",
    "Increase foot traffic (physical store)",
    "Build partnerships/collaborations",
    "Increase repeat purchases",
  ];

  const contentTypesOptions = [
    "Social Media Campaigns (Instagram)",
    "Social Media Campaigns (X)",
    "Social Media Campaigns (LinkedIn)",
    "Social Media Campaigns (Facebook)",
    "Email Newsletters",
  ];

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
      placeholder: "e.g., HIGH-ER ENTERPRISES",
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
      required: false,
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
      placeholder: "Your business or personal email",
      required: true,
    },
    {
      label: "Website Link (Optional)",
      field: "websiteLink",
      type: "text",
      placeholder: "e.g., www.higher.com.ng",
      required: false,
    },
    {
      label: "Description of Products/Services",
      field: "description",
      type: "textarea",
      placeholder: "List the products you sell or the services you offer",
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
      label: "Preferred Content Type",
      field: "contentTypes",
      type: "radio",
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
      placeholder: "e.g., 7 (1 - 30 days)",
      required: true,
      min: 1,
      max: 30,
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "contentTypes" ? value : value,
    }));
  };

  const validateCurrentStep = () => {
    const step = steps[currentStep];
    const value = formData[step.field];

    if (step.required) {
      if (step.type === "radio") {
        return value && value.trim() !== "";
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
    const limitMessage = checkContentPlanLimit();
    if (limitMessage) {
      setError(limitMessage);
      setLoading(false);
      return;
    }

    const requiredFields = steps
      .filter((step) => step.required)
      .map((step) => step.field);
    const missingFields = requiredFields.filter((field) => {
      if (field === "contentTypes") {
        return !formData.contentTypes || formData.contentTypes.trim() === "";
      }
      if (field === "numberOfDays") {
        const numValue = parseInt(formData[field], 10);
        return !formData[field] || isNaN(numValue) || numValue < 1;
      }
      return !formData[field] || formData[field].trim() === "";
    });

    if (missingFields.length > 0) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!incrementUsage) {
      setError(
        "Internal error: Usage tracking is not available. Please contact support."
      );
      setLoading(false);
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
      await incrementUsage("contentPlans");
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
        createdAt: serverTimestamp(),
      });
      setSuccess("Content plan saved successfully!");
      setTimeout(() => navigate("/content-plans"), 2000);
    } catch (err) {
      setError("Failed to save content plan: " + err.message);
      console.error("Save content plan error:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenModal = () => {
    const limitMessage = checkContentPlanLimit();
    if (limitMessage) {
      setError(limitMessage);
      return;
    }
    setIsModalOpen(true);
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStep(0);
    setIsReadyToGenerate(false);
    setError("");
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold text-[#5247bf] mb-8 text-center">
          Content Creation Board
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {success && (
          <p className="text-green-500 mb-4 text-center">{success}</p>
        )}

        {user && userData?.subscription && (
          <div className="text-center text-gray-700 mb-4">
            <p>Plan: {userData.subscription.plan || "Free"}</p>
            <p>
              Content Plans Created: {userData.subscription.contentPlans || 0}/
              {userData.subscription.plan === "Free"
                ? 5
                : userData.subscription.plan === "Growth"
                ? 20
                : 50}
            </p>
            {userData.subscription.contentPlans >=
              (userData.subscription.plan === "Free"
                ? 5
                : userData.subscription.plan === "Growth"
                ? 20
                : 50) && (
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
                    <th className="p-3 text-left">Day</th>
                    <th className="p-3 text-left">Content</th>
                    <th className="p-3 text-left">Image Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {contentPlan.map((item) => (
                    <tr key={item.Day} className="border-b border-gray-200">
                      <td className="p-3 text-gray-800">{item.Day}</td>
                      <td className="p-3 text-gray-800 relative group">
                        <div className="flex items-center space-x-2">
                          <span>{item.content}</span>
                          <button
                            onClick={() =>
                              handleCopy(item.content, item.Day, "content")
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
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleOpenModal}
              className="bg-[#5247bf] cursor-pointer text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-all duration-200"
            >
              Create New Plan
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                <div className="text-gray-600">
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
                  {steps[currentStep].type === "radio" && (
                    <div className="space-y-2">
                      {steps[currentStep].options.map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            name={steps[currentStep].field}
                            value={option}
                            checked={formData.contentTypes === option}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-[#5247bf] focus:ring-[#5247bf]"
                            required={steps[currentStep].required}
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
                        className="flex-1 bg-gray-200 cursor-pointer text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 bg-[#5247bf] cursor-pointer text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300"
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
                  className="w-full bg-[#5247bf] text-white cursor-pointer p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
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

export default ContentPlanGenerator;

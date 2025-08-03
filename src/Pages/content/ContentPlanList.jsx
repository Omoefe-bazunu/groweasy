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
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  CopyCheck,
  ClipboardCopy,
} from "lucide-react";

const ContentPlanList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [copiedContent, setCopiedContent] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "plans"),
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
        await deleteDoc(doc(db, "plans", planId));
        setPlans(plans.filter((plan) => plan.id !== planId));
      } catch (error) {
        console.error("Error deleting content plan:", error);
      }
    }
  };

  const formatDate = (createdAt) => {
    try {
      const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error, createdAt);
      return "Invalid Date";
    }
  };

  const toggleExpand = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedContent(key);
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
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
        <h1 className="text-2xl font-bold text-[#5247bf]">
          Your Content Plans
        </h1>
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
                <h3 className="font-semibold text-lg text-[#5247bf]">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(plan.createdAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
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
                          Copy
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plan.contentPlan.map((item, index) => (
                        <tr key={item.Day + index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {item.Day}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 max-w-sm">
                            {item.content}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <button
                              onClick={() =>
                                handleCopy(item.content, `${plan.id}-${index}`)
                              }
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors text-sm"
                              title="Copy to clipboard"
                            >
                              {copiedContent === `${plan.id}-${index}` ? (
                                <>
                                  <CopyCheck size={16} />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <ClipboardCopy size={16} />
                                  Copy
                                </>
                              )}
                            </button>
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

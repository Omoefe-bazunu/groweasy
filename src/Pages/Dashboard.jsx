import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  FileText,
  User,
  File,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useUser();
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const [downlines, setDownlines] = useState([]);
  const [requestingWithdraw, setRequestingWithdraw] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      try {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        setProfileExists(profileSnap.exists());
      } catch (error) {
        console.error("Error checking business profile:", error);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [user]);

  useEffect(() => {
    const fetchDownlines = async () => {
      if (!user?.uid) return;
      const q = query(
        collection(db, "users"),
        where("referredBy", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      setDownlines(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchDownlines();
  }, [user]);

  const handleCreations = () => navigate("/content-creation-board");
  const handleBusinessProfile = () => navigate("/profile");
  const handleViewDocuments = () => navigate("/documents");
  const handleManageSubscription = () => navigate("/subscribe");

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}/signup?ref=${user.uid}`;
    navigator.clipboard.writeText(link);
    alert("Affiliate link copied!");
  };

  const todayIsFriday = new Date().getDay() === 5;

  const handleRequestWithdrawal = async () => {
    if (!user || !userData) return;
    try {
      setRequestingWithdraw(true);
      await addDoc(collection(db, "withdrawalRequests"), {
        userId: user.uid,
        name: userData.name,
        email: userData.email,
        amount: (userData.earnings || 0).toFixed(2),
        requestedAt: serverTimestamp(),
      });
      alert("Withdrawal request submitted successfully!");
    } catch (err) {
      console.error("Error requesting withdrawal:", err);
      alert("Failed to submit withdrawal request.");
    } finally {
      setRequestingWithdraw(false);
    }
  };

  if (loading || !userData) {
    return (
      <section
        id="blog-details-loading"
        className="flex flex-col items-center justify-center min-h-screen bg-white py-20"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex space-x-2">
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
          </div>
        </div>
      </section>
    );
  }

  const subscription = userData.subscription || {
    plan: "Free",
    status: "active",
  };
  const isPaidPlan = ["Growth", "Enterprise"].includes(subscription.plan);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-6"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
        <div
          className="bg-white rounded-xl shadow-lg text-gray-500 p-6 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => setAffiliateOpen(!affiliateOpen)}
        >
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6 text-green-700"
              >
                <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                <path
                  fillRule="evenodd"
                  d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
                  clipRule="evenodd"
                />
                <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
              </svg>

              <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
                Affiliate Earnings
              </h2>
            </div>
            {affiliateOpen ? (
              <ChevronUp className="w-6 h-6 text-[#5247bf]" />
            ) : (
              <ChevronDown className="w-6 h-6 text-[#5247bf]" />
            )}
          </div>
          {affiliateOpen && (
            <div className="mt-4 space-y-4">
              <div>
                <p>
                  Earn by referring people to sign up and ugrade their plans
                  from the Free Plan
                  <br /> 20% from your downline; 5% from downline's
                  referral{" "}
                </p>
                <label className="block text-gray-700 font-medium mb-1 mt-4">
                  Affiliate Link:
                </label>
                <div className="flex items-center border rounded p-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/signup?ref=${user.uid}`}
                    readOnly
                    className="flex-1 text-sm text-gray-600"
                  />
                  <button
                    onClick={copyAffiliateLink}
                    className="ml-2 text-[#5247bf]"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <p>
                  <strong>Total Earnings:</strong> $
                  {(userData.earnings || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Downline Earnings:</strong> $
                  {(userData.downlineEarnings || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">Your Downlines:</h3>
                {downlines.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {downlines.map((dl) => (
                      <li key={dl.id}>
                        {dl.name || "Unnamed User"} ({dl.email})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No downlines yet.</p>
                )}
              </div>

              <button
                onClick={handleRequestWithdrawal}
                disabled={!todayIsFriday || requestingWithdraw}
                className={`w-full py-2 mt-4 rounded-lg text-white ${
                  todayIsFriday
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {requestingWithdraw ? "Requesting..." : "Request Withdrawal"}
              </button>
            </div>
          )}
        </div>

        <div
          onClick={handleCreations}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <FileText className="w-8 h-8 text-[#5247bf]" />
          <div className="flex-1">
            <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
              Business Tools
            </h2>
          </div>
          <button className="bg-[#5247bf] w-24 text-white px-4 py-2 rounded-lg hover:bg-[#4238a6]">
            View
          </button>
        </div>

        <div
          onClick={handleBusinessProfile}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <User className="w-8 h-8 text-[#5247bf]" />
          <div className="flex-1">
            <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
              Business Profile
            </h2>
            {profileExists && (
              <p className="text-gray-600 text-sm mt-1">Profile Created</p>
            )}
          </div>
          <button className="bg-[#5247bf] w-24 text-white px-4 py-2 rounded-lg hover:bg-[#4238a6]">
            {profileExists ? "View" : "Create"}
          </button>
        </div>

        <div
          onClick={handleViewDocuments}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <File className="w-8 h-8 text-[#5247bf]" />
          <div className="flex-1">
            <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
              Business Legal Documents
            </h2>
          </div>
          <button className="bg-[#5247bf] w-24 text-white px-4 py-2 rounded-lg hover:bg-[#4238a6]">
            View
          </button>
        </div>

        <div
          onClick={handleManageSubscription}
          className="bg-white rounded-xl mb-20 shadow-lg p-6 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <CreditCard className="w-8 h-8 text-[#5247bf]" />
          <div className="flex-1">
            <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
              Subscription
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Current Plan: {subscription.plan} ({subscription.status})
            </p>
          </div>
          <button className="bg-[#5247bf] w-24 text-white px-4 py-2 rounded-lg hover:bg-[#4238a6]">
            {isPaidPlan && subscription.status === "active"
              ? "Manage"
              : "Upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

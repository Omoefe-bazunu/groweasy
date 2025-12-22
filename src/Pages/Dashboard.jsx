import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  FileText,
  User,
  File,
  CreditCard,
  Lock,
  CheckCircle,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useUser();
  const { isPaid, subscription, daysRemaining } = useSubscription();

  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleCreations = () => navigate("/content-creation-board");
  const handleBusinessProfile = () => navigate("/profile");
  const handleViewDocuments = () => navigate("/documents");
  const handleUpgrade = () => navigate("/subscribe");

  if (loading || !userData) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat pb-24 pt-8 px-8"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <div className="bg-[#5247bf] rounded-xl p-6 mb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white text-center">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
        {/* Subscription Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#5247bf]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {isPaid ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Lock className="w-7 h-7 text-orange-600" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isPaid ? "Pro Plan Active" : "Free Plan"}
                </h2>
                {isPaid && subscription?.type && (
                  <p className="text-sm text-gray-600 capitalize">
                    {subscription.type} • {daysRemaining} days remaining
                  </p>
                )}
              </div>
            </div>
            {!isPaid && (
              <button
                onClick={handleUpgrade}
                className="bg-[#5247bf] text-white px-5 py-2.5 rounded-lg hover:bg-[#4238a6] font-medium transition"
              >
                Upgrade Now
              </button>
            )}
          </div>

          {isPaid ? (
            <p className="text-green-600 text-sm font-medium">
              Unlimited receipts, invoices & financial records
            </p>
          ) : (
            <div className="text-sm text-gray-600 space-y-1">
              <p>Limited to 10 documents per category</p>
              <p className="text-[#5247bf] font-medium">
                Upgrade to Pro for unlimited access
              </p>
            </div>
          )}
        </div>

        {/* Business Tools */}
        <div
          onClick={handleCreations}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-[#5247bf]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Business Tools
              </h2>
              <p className="text-sm text-gray-600">
                Create receipts, invoices & records
              </p>
            </div>
          </div>
          <button className="bg-[#5247bf] text-white px-5 py-2.5 rounded-lg hover:bg-[#4238a6]">
            Open
          </button>
        </div>

        {/* Business Profile */}
        <div
          onClick={handleBusinessProfile}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <User className="w-8 h-8 text-[#5247bf]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Business Profile
              </h2>
              {profileExists ? (
                <p className="text-sm text-green-600">Profile created</p>
              ) : (
                <p className="text-sm text-gray-600">
                  Set up your business info
                </p>
              )}
            </div>
          </div>
          <button className="bg-[#5247bf] text-white px-5 py-2.5 rounded-lg hover:bg-[#4238a6]">
            {profileExists ? "View" : "Create"}
          </button>
        </div>

        {/* Legal Documents */}
        <div
          onClick={handleViewDocuments}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <File className="w-8 h-8 text-[#5247bf]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Legal Documents
              </h2>
              <p className="text-sm text-gray-600">
                Contracts, agreements & more
              </p>
            </div>
          </div>
          <button className="bg-[#5247bf] text-white px-5 py-2.5 rounded-lg hover:bg-[#4238a6]">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

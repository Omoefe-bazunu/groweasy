import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FileText, User, File } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if a business profile exists in Firestore
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

  const handleCreateContentPlan = () => {
    navigate("/content-creation-board");
  };

  const handleBusinessProfile = () => {
    navigate("/profile");
  };

  const handleViewDocuments = () => {
    navigate("/documents");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat p-6 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
      </div>
    );
  }

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
          onClick={handleCreateContentPlan}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <FileText className="w-8 h-8 text-[#5247bf]" />
          <div className="flex-1">
            <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
              Create Content Plan
            </h2>
          </div>
          <button className="bg-[#5247bf] text-white px-4 py-2 rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>

        <div
          onClick={handleBusinessProfile}
          className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <User className="w-8 h-8 text-[#5247bf]" />
          <div className="flex-1">
            <h2 className="text-sm lg:text-xl font-semibold text-gray-800">
              Build Business Profile
            </h2>
            {profileExists && (
              <p className="text-gray-600 text-sm mt-1">Profile Created</p>
            )}
          </div>
          <button className="bg-[#5247bf] text-white px-4 py-2 rounded-lg hover:bg-[#4238a6] transition-all duration-200">
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
              View Required Documents
            </h2>
          </div>
          <button className="bg-[#5247bf] text-white px-4 py-2 rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { MapPin, Mail, Phone, Globe } from "lucide-react";

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, "profiles", userId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        } else {
          setError("Profile not found.");
        }
      } catch (err) {
        setError("Failed to fetch profile.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
        <p className="text-gray-600 text-center">No profile available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 pb-20">
      <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
        {profile.businessName}
      </h1>
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl p-6 border-t border-[#5247bf]">
          <div className="flex flex-col items-center mb-6">
            {profile.logoImage && (
              <img
                src={profile.logoImage}
                alt="Logo"
                className="w-32 h-32 object-cover rounded-full mb-4  shadow-md"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.businessName}
            </h2>
            {profile.motto && (
              <p className="text-gray-500 italic text-sm mt-1">
                {profile.motto}
              </p>
            )}
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#5247bf] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Contact Address</p>
                  <p className="text-gray-600">{profile.contactAddress}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-[#5247bf] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Contact Email</p>
                  <p className="text-gray-600">{profile.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[#5247bf] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Contact Number</p>
                  <p className="text-gray-600">{profile.contactNumber}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-[#5247bf] mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Mode of Service</p>
                  <p className="text-gray-600">{profile.modeOfService}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Description</p>
              <p className="text-gray-600">{profile.description}</p>
            </div>
            {profile.registrationNumber && (
              <div>
                <p className="text-gray-800 font-medium">Registration Number</p>
                <p className="text-gray-600">{profile.registrationNumber}</p>
              </div>
            )}
            {profile.productsServices.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Products/Services
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {profile.productsServices.map((item, index) => (
                    <div
                      key={index}
                      className="flex space-x-4 bg-gray-50 p-4 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={`Product ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <p className="text-gray-600 flex-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profile.socialLinks.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Social Links
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full text-sm"
                    >
                      Link {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

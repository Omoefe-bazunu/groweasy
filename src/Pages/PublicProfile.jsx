import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import ProfileCard from "../components/ProfileCard";

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageIndices, setImageIndices] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, "profiles", userId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          const formattedData = {
            ...data,
            productsServices: Array.isArray(data.productsServices)
              ? data.productsServices
              : [{ title: "", description: "", images: [] }],
            socialLinks: Array.isArray(data.socialLinks)
              ? data.socialLinks
              : [{ title: "", url: "" }],
          };
          setProfile(formattedData);
          setImageIndices(
            formattedData.productsServices.reduce(
              (acc, _, index) => ({
                ...acc,
                [index]: 0,
              }),
              {}
            )
          );
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

  const handleImageNavigation = (productIndex, direction) => {
    setImageIndices((prev) => {
      const currentIndex = prev[productIndex] || 0;
      const images = profile.productsServices[productIndex].images || [];
      const maxIndex = images.length - 1;
      let newIndex = currentIndex + direction;
      if (newIndex < 0) newIndex = maxIndex;
      if (newIndex > maxIndex) newIndex = 0;
      return { ...prev, [productIndex]: newIndex };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <p className="text-gray-600">
            This profile may not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
        <p className="text-gray-600 text-center text-xl">
          No profile available.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-25 bg-gradient-to-b from-purple-50 to-white">
      {/* Profile Content - Using ProfileCard without actions */}
      <ProfileCard
        profile={profile}
        imageIndices={imageIndices}
        onImageNavigation={handleImageNavigation}
      />
    </div>
  );
};

export default PublicProfile;

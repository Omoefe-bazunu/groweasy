import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
    <div className="min-h-screen p-6 pb-25 bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="pt-8 pb-2 px-6 text-center">
        <h1 className="text-4xl md:text-3xl font-extrabold text-[#5247bf] mb-2">
          {profile.businessName}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          {profile.motto || "Showcase your business to the world!"}
        </p>
      </section>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto">
        {/* About Section */}
        <section className="mb-16">
          <div className="flex flex-col items-center gap-8">
            {profile.logoImage && (
              <img
                src={profile.logoImage}
                alt="Business Logo"
                className="w-40 h-40 border-4 border-white object-cover rounded-full shadow-lg"
              />
            )}
            <div>
              <h2 className="text-3xl text-center font-bold text-gray-900 mb-4">
                About Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {profile.description}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
              <MapPin className="w-6 h-6 text-[#5247bf]" />
              <div>
                <p className="text-gray-800 font-medium">Address</p>
                <p className="text-gray-600">{profile.contactAddress}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
              <Mail className="w-6 h-6 text-[#5247bf]" />
              <div>
                <p className="text-gray-800 font-medium">Email</p>
                <p className="text-gray-600">{profile.contactEmail}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
              <Phone className="w-6 h-6 text-[#5247bf]" />
              <div>
                <p className="text-gray-800 font-medium">Phone</p>
                <p className="text-gray-600">{profile.contactNumber}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
              <Globe className="w-6 h-6 text-[#5247bf]" />
              <div>
                <p className="text-gray-800 font-medium">Service Mode</p>
                <p className="text-gray-600">{profile.modeOfService}</p>
              </div>
            </div>
          </div>
          {profile.registrationNumber && (
            <div className="mt-6 text-center">
              <p className="text-gray-800 font-medium">Registration Number</p>
              <p className="text-gray-600">{profile.registrationNumber}</p>
            </div>
          )}
        </section>

        {/* Products/Services */}
        {Array.isArray(profile.productsServices) &&
          profile.productsServices.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                What we Offer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.productsServices.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 flex flex-col rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 flex-grow">
                      {item.description}
                    </p>
                    {Array.isArray(item.images) && item.images.length > 0 && (
                      <div className="relative">
                        <img
                          src={item.images[imageIndices[index] || 0]}
                          alt={`${item.title} ${imageIndices[index] + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {item.images.length > 1 && (
                          <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 transform -translate-y-1/2">
                            <button
                              onClick={() => handleImageNavigation(index, -1)}
                              className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleImageNavigation(index, 1)}
                              className="bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Social Links */}
        {Array.isArray(profile.socialLinks) &&
          profile.socialLinks.length > 0 && (
            <section className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Connect With Us
              </h2>
              <div className="flex justify-center gap-4 flex-wrap">
                {profile.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#5247bf] text-white px-4 py-2 rounded-full hover:bg-[#4238a6] transition-all duration-300"
                  >
                    {link.title || `Social Link ${index + 1}`}
                  </a>
                ))}
              </div>
            </section>
          )}

        {/* CTA Section */}
        <section className="text-center py-12 bg-[#5247bf] text-white rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
          <p className="text-lg mb-6 max-w-xl mx-auto">
            Get in touch today to discuss how we can help your business grow!
          </p>
          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-white text-[#5247bf] px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 text-lg font-semibold"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Contact Now
          </a>
        </section>
      </div>
    </div>
  );
};

export default PublicProfile;

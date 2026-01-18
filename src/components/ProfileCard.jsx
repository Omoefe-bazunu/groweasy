import { useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Share2,
  Copy,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const ProfileCard = ({
  profile,
  imageIndices,
  onImageNavigation,
  actions,
  isOwner,
}) => {
  const [visibleCount, setVisibleCount] = useState(6);
  const [copied, setCopied] = useState(false);

  // Pagination Logic
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  // Copy Link Logic
  const handleCopyLink = () => {
    const url = `${window.location.origin}/public-profile/${profile.userId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Contact Link (WhatsApp)
  const whatsappLink = `https://wa.me/${profile.contactNumber.replace(/\D/g, "")}?text=Hi, I found your business profile and I'm interested in your services.`;

  return (
    <div className="w-full bg-white min-h-screen text-gray-800">
      {/* 1. HERO SECTION */}
      <div className="relative bg-gradient-to-r from-[#5247bf] to-[#7c3aed] text-white pt-20 pb-24 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            {profile.registrationNumber && (
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium tracking-wide uppercase border border-white/30">
                Reg: {profile.registrationNumber}
              </span>
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              {profile.businessName}
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 font-light max-w-2xl">
              {profile.motto || "Excellence in every service we provide."}
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-[#5247bf] px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-transform transform hover:-translate-y-1 flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
              </a>
              {isOwner && (
                <button
                  onClick={handleCopyLink}
                  className="px-8 py-4 rounded-full font-bold border-2 border-white/30 hover:bg-white/10 transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {copied ? "Link Copied!" : "Copy Profile Link"}
                </button>
              )}
            </div>
          </div>

          {/* Logo/Image */}
          {profile.logoImage && (
            <div className="relative shrink-0 animate-in zoom-in duration-700">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl transform scale-110"></div>
              <img
                src={profile.logoImage}
                alt={profile.businessName}
                className="relative w-64 h-64 md:w-80 md:h-80 object-cover rounded-full border-8 border-white/20 shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. ABOUT SECTION */}
      <div className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm font-bold text-[#5247bf] uppercase tracking-widest mb-3">
            Who We Are
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            About Our Business
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
            {profile.description}
          </p>
        </div>
      </div>

      {/* 3. PRODUCTS & SERVICES (GRID + LOAD MORE) */}
      {Array.isArray(profile.productsServices) &&
        profile.productsServices.length > 0 && (
          <div className="py-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-sm font-bold text-[#5247bf] uppercase tracking-widest mb-3">
                  Portfolio
                </h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                  What We Offer
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {profile.productsServices
                  .slice(0, visibleCount)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
                    >
                      {/* Image Carousel */}
                      <div className="relative h-64 overflow-hidden bg-gray-100">
                        {Array.isArray(item.images) &&
                        item.images.length > 0 ? (
                          <>
                            <img
                              src={item.images[imageIndices[index] || 0]}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {item.images.length > 1 && (
                              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onImageNavigation(index, -1);
                                  }}
                                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onImageNavigation(index, 1);
                                  }}
                                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                            {/* Dots indicator */}
                            {item.images.length > 1 && (
                              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                {item.images.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full shadow-sm ${idx === (imageIndices[index] || 0) ? "bg-white" : "bg-white/50"}`}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-sm">No Image</span>
                          </div>
                        )}

                        {/* Price Tag */}
                        {item.price && (
                          <div className="absolute top-4 right-4 bg-white/95 text-[#5247bf] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm backdrop-blur-sm">
                            {new Intl.NumberFormat("en-NG", {
                              style: "currency",
                              currency: "NGN",
                            }).format(item.price)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#5247bf] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                          {item.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-[#5247bf] font-medium text-sm">
                          <a
                            href={`${whatsappLink}&text=I am interested in ${item.title}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            Inquire now <ArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Load More Button */}
              {profile.productsServices.length > visibleCount && (
                <div className="text-center mt-16">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-[#5247bf] bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    Load More Items
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      {/* 4. INFO & CONTACT SECTION */}
      <div className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4 inline-block">
                Get in Touch
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#5247bf] p-3 rounded-lg">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Visit Us</p>
                    <p className="text-lg font-medium">
                      {profile.contactAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#5247bf] p-3 rounded-lg">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Email Us</p>
                    <a
                      href={`mailto:${profile.contactEmail}`}
                      className="text-lg font-medium hover:text-purple-400 transition"
                    >
                      {profile.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#5247bf] p-3 rounded-lg">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Call Us</p>
                    <a
                      href={`tel:${profile.contactNumber}`}
                      className="text-lg font-medium hover:text-purple-400 transition"
                    >
                      {profile.contactNumber}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Socials & Mode */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4 inline-block">
                Connect & Info
              </h3>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2 text-gray-300">
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">Mode of Service</span>
                </div>
                <p className="text-xl font-semibold pl-8">
                  {profile.modeOfService}
                </p>
              </div>

              {Array.isArray(profile.socialLinks) &&
                profile.socialLinks.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-4">
                      Follow us on social media
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {profile.socialLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-800 hover:bg-[#5247bf] px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 group"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white" />
                          <span className="font-medium">{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} {profile.businessName}. All rights
            reserved.
          </p>
        </div>
      </div>

      {/* 5. OWNER ACTIONS (Floating Bottom Bar) */}
      {actions && isOwner && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-full px-6 py-3 z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <button
            onClick={actions.onEdit}
            className="flex items-center gap-2 text-gray-700 hover:text-[#5247bf] font-medium transition-colors px-2"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <div className="w-px h-4 bg-gray-300"></div>
          <button
            onClick={actions.onShare}
            className="flex items-center gap-2 text-gray-700 hover:text-[#5247bf] font-medium transition-colors px-2"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <div className="w-px h-4 bg-gray-300"></div>
          <button
            onClick={actions.onDelete}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium transition-colors px-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;

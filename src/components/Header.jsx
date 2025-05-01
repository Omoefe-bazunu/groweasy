import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { FaStar } from "react-icons/fa"; // Add FaStar for testimonials icon
import CreateOptions from "../Pages/CreateOptions";
import { IoCreate } from "react-icons/io5";
import { MdContactPage } from "react-icons/md";

const TopNav = () => {
  const navigate = useNavigate();
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  const handleContactClick = () => {
    navigate("/contact");
  };

  const handleAboutClick = () => {
    navigate("/about");
  };

  const handleTestimonialsClick = () => {
    navigate("/testimonials");
  };

  const toggleCreateOptions = () => {
    setShowCreateOptions((prev) => !prev);
  };

  return (
    <nav className="bg-white shadow-md px-12 flex justify-between items-center sticky top-0 z-50 max-w-2xl mx-auto left-0 right-0 rounded-b-xl py-2">
      {/* Brand Logo */}
      <div className="flex items-center">
        <img
          src="/gelogo.png"
          alt="Brand Logo"
          className="h-10 w-auto"
          onError={(e) =>
            (e.target.src = "https://via.placeholder.com/150x50?text=Logo")
          }
        />
      </div>

      {/* Navigation Icons */}
      <div className="flex space-x-6 items-center">
        <button
          onClick={handleContactClick}
          className="text-gray-500 hover:text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="Contact"
        >
          <MdContactPage className="w-6 h-6" />
        </button>
        <button
          onClick={handleAboutClick}
          className="text-gray-500 hover:text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="About"
        >
          <Info className="w-6 h-6" />
        </button>
        <button
          onClick={handleTestimonialsClick}
          className="text-gray-500 hover:text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="Testimonials"
        >
          <FaStar className="w-6 h-6" />
        </button>
        <button
          onClick={toggleCreateOptions}
          className="text-gray-500 hover:text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="Create"
        >
          <IoCreate className="w-6 h-6" />
        </button>
      </div>

      {/* Create Options Dropdown */}
      {showCreateOptions && (
        <div className="absolute top-16 right-4 z-50">
          <CreateOptions onClose={() => setShowCreateOptions(false)} />
        </div>
      )}
    </nav>
  );
};

export default TopNav;

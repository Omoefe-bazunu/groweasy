import { useNavigate } from "react-router-dom";
import { BookCopy, BookDashed, Info } from "lucide-react";
import { FaStar } from "react-icons/fa"; // Add FaStar for testimonials icon
// import CreateOptions from "../Pages/CreateOptions";
// import { IoCreate } from "react-icons/io5";
import { MdContactPage } from "react-icons/md";

const TopNav = () => {
  const navigate = useNavigate();
  // const [showCreateOptions, setShowCreateOptions] = useState(false);

  const handleContactClick = () => {
    navigate("/contact");
  };

  const handleAboutClick = () => {
    navigate("/about");
  };

  const handleTestimonialsClick = () => {
    navigate("/testimonials");
  };

  const handleKnowledgeBaseClick = () => {
    navigate("/knowledge-base");
  };

  return (
    <nav className="bg-white shadow-md px-6 lg:px-12 flex justify-between items-center sticky top-0 z-50 max-w-2xl mx-auto left-0 right-0 rounded-b-xl py-2">
      {/* Brand Logo */}
      <div className="flex items-center">
        {/* <img
          src="/gelogo.png"
          alt="Brand Logo"
          className="h-10 w-auto"
          onError={(e) =>
            (e.target.src = "https://via.placeholder.com/150x50?text=Logo")
          }
        /> */}
        <h1 className="text-[#5247bf] font-bold text-xl">GrowEasy</h1>
      </div>

      {/* Navigation Icons */}
      <div className="flex space-x-6 items-center">
        <button
          onClick={handleKnowledgeBaseClick}
          className="hover:text-gray-500 text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="Knowledge Base"
        >
          <BookCopy className="w-6 h-6" />
        </button>
        <button
          onClick={handleContactClick}
          className="hover:text-gray-500 text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="Contact"
        >
          <MdContactPage className="w-6 h-6" />
        </button>
        <button
          onClick={handleAboutClick}
          className="hover:text-gray-500 text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="About"
        >
          <Info className="w-6 h-6" />
        </button>
        <button
          onClick={handleTestimonialsClick}
          className="hover:text-gray-500 text-[#5247bf] transition-all duration-200 cursor-pointer"
          title="Testimonials"
        >
          <FaStar className="w-6 h-6" />
        </button>
      </div>

      {/* Create Options Dropdown */}
      {/* {showCreateOptions && (
        <div className="absolute top-16 right-4 z-50">
          <CreateOptions onClose={() => setShowCreateOptions(false)} />
        </div>
      )} */}
    </nav>
  );
};

export default TopNav;

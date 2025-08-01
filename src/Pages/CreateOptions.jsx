import { useNavigate } from "react-router-dom";
import {
  FileText,
  Image,
  BookOpen,
  Package,
  ClipboardList,
} from "lucide-react";

const CreateOptions = ({ onClose }) => {
  const navigate = useNavigate();

  const handleCreatePlan = () => {
    navigate("/content-plans/new");
    onClose();
  };

  const handleCreateStrategy = () => {
    navigate("/content-strategies/new");
    onClose();
  };

  const handleCreateBlogPost = () => {
    navigate("/blog-posts/new");
    onClose();
  };

  const handleCreateImages = () => {
    navigate("/create-images");
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md md:max-w-lg">
      <h2 className="text-xl font-semibold text-[#5247bf] mb-4">
        Create Content
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Content Plan */}
        <div
          onClick={handleCreatePlan}
          className="bg-gray-50 rounded-lg p-4 flex flex-col hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="w-5 h-5 text-[#5247bf]" />
            <h3 className="font-semibold text-gray-800">Content Plan</h3>
          </div>
          <p className="text-xs text-gray-500 pl-8">Daily content schedule</p>
          <button className="mt-3 self-end bg-[#5247bf] text-white px-3 py-1 text-sm rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>

        {/* Content Strategy */}
        <div
          onClick={handleCreateStrategy}
          className="bg-gray-50 rounded-lg p-4 flex flex-col hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-2">
            <ClipboardList className="w-5 h-5 text-[#5247bf]" />
            <h3 className="font-semibold text-gray-800">Content Strategy</h3>
          </div>
          <p className="text-xs text-gray-500 pl-8">
            Long-term content roadmap
          </p>
          <button className="mt-3 self-end bg-[#5247bf] text-white px-3 py-1 text-sm rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>

        {/* Blog Post */}
        <div
          onClick={handleCreateBlogPost}
          className="bg-gray-50 rounded-lg p-4 flex flex-col hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="w-5 h-5 text-[#5247bf]" />
            <h3 className="font-semibold text-gray-800">Blog Post</h3>
          </div>
          <p className="text-xs text-gray-500 pl-8">SEO-optimized articles</p>
          <button className="mt-3 self-end bg-[#5247bf] text-white px-3 py-1 text-sm rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>

        {/* Generate Images */}
        <div
          onClick={handleCreateImages}
          className="bg-gray-50 rounded-lg p-4 flex flex-col hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Image className="w-5 h-5 text-[#5247bf]" />
            <h3 className="font-semibold text-gray-800">Generate Images</h3>
          </div>
          <p className="text-xs text-gray-500 pl-8">AI-powered visuals</p>
          <button className="mt-3 self-end bg-[#5247bf] text-white px-3 py-1 text-sm rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateOptions;

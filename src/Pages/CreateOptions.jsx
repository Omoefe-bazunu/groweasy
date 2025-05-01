import { useNavigate } from "react-router-dom";
import { FileText, Image, Video } from "lucide-react";

const CreateOptions = ({ onClose }) => {
  const navigate = useNavigate();

  const handleCreatePlan = () => {
    navigate("/content-creation-board");
    onClose();
  };

  const handleCreateImages = () => {
    navigate("/create-images"); // Placeholder route; create this route/component later
    onClose();
  };

  const handleCreateVideos = () => {
    navigate("/dashboard"); // Placeholder route; create this route/component later
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-80">
      <h2 className="text-xl font-semibold text-[#5247bf] mb-4">Create</h2>
      <div className="space-y-4">
        {/* Create Plan */}
        <div
          onClick={handleCreatePlan}
          className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <FileText className="w-6 h-6 text-[#5247bf]" />
          <div className="flex-1">
            <h3 className=" font-semibold text-gray-800">Create Plan</h3>
          </div>
          <button className="bg-[#5247bf] text-white px-3 py-1 rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>

        {/* Create Images */}
        <div
          onClick={handleCreateImages}
          className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <Image className="w-6 h-6 text-[#5247bf]" />
          <div className="flex-1">
            <h3 className=" font-semibold text-gray-800">Create Images</h3>
          </div>
          <button className="bg-[#5247bf] text-white px-3 py-1 rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>

        {/* Create Videos */}
        <div
          onClick={handleCreateVideos}
          className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4 hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <Video className="w-6 h-6 text-[#5247bf]" />
          <div className="flex-1">
            <h3 className=" font-semibold text-gray-800">
              Create Videos (Coming Soon)
            </h3>
          </div>
          <button className="bg-[#5247bf] text-white px-3 py-1 rounded-lg hover:bg-[#4238a6] transition-all duration-200">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateOptions;

import { useNavigate } from "react-router-dom";

import {
  Copy,
  X,
  FileText,
  ClipboardList,
  Package,
  BookOpen,
  Image,
} from "lucide-react";

const ContentCreationBoard = () => {
  const navigate = useNavigate();

  const creationOptions = [
    {
      id: "contentPlan",
      title: "Content Plans",
      icon: <FileText className="w-5 h-5" />,
      description: "Daily content schedule",
      action: () => navigate("/content-plans"),
    },
    {
      id: "contentStrategy",
      title: "Content Strategies",
      icon: <ClipboardList className="w-5 h-5" />,
      description: "Long-term content roadmap",
      action: () => navigate("/content-strategies"),
    },
    {
      id: "blogPost",
      title: "Blog Posts",
      icon: <BookOpen className="w-5 h-5" />,
      description: "SEO-optimized articles",
      action: () => navigate("/blog-posts"),
    },
    {
      id: "generateImages",
      title: "Images",
      icon: <Image className="w-5 h-5" />,
      description: "AI-powered visuals",
      action: () => navigate("/create-images"),
    },
  ];

  return (
    <div className="min-h-screen max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-autobg-cover bg-center bg-no-repeat p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
          Content Creation Board
        </h1>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 ">
          {creationOptions.map((option) => (
            <div
              key={option.id}
              onClick={option.action}
              className={`bg-gray-50 rounded-lg p-4 h-fit flex flex-col hover:bg-purple-50 hover:shadow-md transition-all duration-300 cursor-pointer`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-[#5247bf]">{option.icon}</div>
                <h3 className="font-semibold text-gray-800">{option.title}</h3>
              </div>
              <p className="text-xs text-gray-500 pl-8">{option.description}</p>
              <button className="mt-3 bg-[#5247bf] text-white px-3 py-1 text-sm rounded-lg hover:bg-[#4238a6] transition-all duration-200">
                Go to {option.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCreationBoard;

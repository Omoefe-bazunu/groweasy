import { useNavigate } from "react-router-dom";
import { FileText, ClipboardList, BookOpen, ArrowRight } from "lucide-react";

const CreateOptions = ({ onClose }) => {
  const navigate = useNavigate();

  const options = [
    {
      title: "Receipts",
      description: "Create and manage your receipts",
      icon: FileText,
      path: "/receipts",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700",
    },
    {
      title: "Invoice",
      description: "Create and manage your invoices",
      icon: ClipboardList,
      path: "/invoices",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-600 to-purple-700",
    },
    {
      title: "Financial Record",
      description: "Manage your financial records",
      icon: BookOpen,
      path: "/financial-records",
      gradient: "from-indigo-500 to-indigo-600",
      hoverGradient: "from-indigo-600 to-indigo-700",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Business Tools
        </h2>
        <p className="text-gray-600 text-sm">
          Choose what you'd like to create
        </p>
      </div>

      <div className="grid md:grid-cols-3 grid-cols-2 gap-4">
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <button
              key={index}
              onClick={() => handleNavigate(option.path)}
              className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-white/20 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-[#5247bf] group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-2">
                  {option.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-4">
                  {option.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-[#5247bf] group-hover:text-white transition-colors duration-300">
                  <span className="text-sm font-medium mr-2">Get started</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CreateOptions;

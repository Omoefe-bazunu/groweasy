import { useNavigate } from "react-router-dom";
import {
  FileText,
  ClipboardList,
  BookOpen,
  Calculator,
  Package2,
  User2Icon,
  ArrowRight,
  Star,
  CalendarCheck2,
} from "lucide-react";

const ContentCreationBoard = () => {
  const navigate = useNavigate();

  const creationOptions = [
    {
      id: "quotations",
      title: "Quotations",
      icon: <ClipboardList className="w-6 h-6" />,
      description: "Generate and manage professional business quotations.",
      action: () => navigate("/quotations"),
      color: "bg-blue-50",
    },
    {
      id: "invoices",
      title: "Invoices",
      icon: <ClipboardList className="w-6 h-6" />,
      description: "Create and track invoices for your clients.",
      action: () => navigate("/invoices"),
      color: "bg-purple-50",
    },
    {
      id: "receipts",
      title: "Receipts",
      icon: <FileText className="w-6 h-6" />,
      description: "Issue payment receipts instantly.",
      action: () => navigate("/receipts"),
      color: "bg-green-50",
    },
    {
      id: "payroll",
      title: "Payroll",
      icon: <FileText className="w-6 h-6" />,
      description: "Manage employee salaries and payments.",
      action: () => navigate("/payroll"),
      color: "bg-yellow-50",
    },
    {
      id: "financial-records",
      title: "Financial Records",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Track income and expenses in one place.",
      action: () => navigate("/financial-records"),
      color: "bg-indigo-50",
    },
    {
      id: "budgets",
      title: "Budgets",
      icon: <CalendarCheck2 className="w-6 h-6" />,
      description: "Create and manage budgets for your business.",
      action: () => navigate("/budgets"),
      color: "bg-red-50",
    },

    {
      id: "tax-calculator",
      title: "Tax Calculator",
      icon: <Calculator className="w-6 h-6" />,
      description: "Calculate tax liabilities with ease.",
      action: () => navigate("/tax-calculator"),
      color: "bg-red-50",
    },
    {
      id: "inventory",
      title: "Inventory Manager",
      icon: <Package2 className="w-6 h-6" />,
      description: "Keep track of your stock and products.",
      action: () => navigate("/inventory"),
      color: "bg-orange-50",
    },
    {
      id: "customers",
      title: "Customers",
      icon: <User2Icon className="w-6 h-6" />,
      description: "Maintain a directory of your clients.",
      action: () => navigate("/customers"),
      color: "bg-teal-50",
    },
    {
      id: "satisfaction",
      title: "Customer Satisfaction",
      icon: <Star className="w-6 h-6" />, // Ensure you import Star from 'lucide-react'
      description:
        "Track ratings, analyze scores, and share your feedback link.",
      action: () => navigate("/satisfaction-dashboard"),
      color: "bg-amber-50",
    },
    {
      id: "tasks",
      title: "Business Tasks",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Organize and plan daily business operations.",
      action: () => navigate("/tasks"),
      color: "bg-cyan-50",
    },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center bg-no-repeat px-4 py-8 md:px-12 md:py-16"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Banner */}
        <div className="bg-[#5247bf] rounded-2xl p-6 mb-10 shadow-xl transform transition-all max-w-2xl mx-auto md:max-w-full">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center">
            Business Tools
          </h1>
          <p className="text-indigo-100 text-center mt-2 hidden md:block">
            Everything you need to manage your business operations efficiently.
          </p>
        </div>

        {/* Content Grid: Responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
          {creationOptions.map((option) => (
            <div
              key={option.id}
              onClick={option.action}
              className="group bg-white/95 border-b-2 border-[#5247bf] backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-xl ${option.color} flex items-center justify-center mb-4 group-hover:bg-[#5247bf] transition-colors duration-300`}
                >
                  <div className="text-[#5247bf] group-hover:text-white transition-colors duration-300">
                    {option.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {option.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[#5247bf] font-bold text-sm">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCreationBoard;

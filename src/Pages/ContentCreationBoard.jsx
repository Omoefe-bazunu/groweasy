import { useNavigate } from "react-router-dom";

import {
  Copy,
  X,
  FileText,
  ClipboardList,
  Package,
  BookOpen,
  Image,
  Calculator,
  Package2,
  User2Icon,
} from "lucide-react";

const ContentCreationBoard = () => {
  const navigate = useNavigate();

  const creationOptions = [
    {
      id: "quotations",
      title: "Quotations",
      icon: <ClipboardList className="w-5 h-5" />,
      description: "Manage your quotations",
      action: () => navigate("/quotations"),
    },
    {
      id: "invoices",
      title: "Invoices",
      icon: <ClipboardList className="w-5 h-5" />,
      description: "Manage your invoices",
      action: () => navigate("/invoices"),
    },
    {
      id: "receipts",
      title: "Receipts",
      icon: <FileText className="w-5 h-5" />,
      description: "Payment Receipts",
      action: () => navigate("/receipts"),
    },
    {
      id: "payroll",
      title: "Payroll",
      icon: <FileText className="w-5 h-5" />,
      description: "Manage your payroll",
      action: () => navigate("/payroll"),
    },

    {
      id: "financial-records",
      title: "Financial Records",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Manage your financial records",
      action: () => navigate("/financial-records"),
    },
    {
      id: "tax-calculator",
      title: "Tax Calculator",
      icon: <Calculator className="w-5 h-5" />,
      description: "Calculate your tax liabilities",
      action: () => navigate("/tax-calculator"),
    },
    {
      id: "inventory",
      title: "Inventory Manager",
      icon: <Package2 className="w-5 h-5" />,
      description: "Manage your inventory",
      action: () => navigate("/inventory"),
    },
    {
      id: "customers",
      title: "Customers",
      icon: <User2Icon className="w-5 h-5" />,
      description: "Manage your customers",
      action: () => navigate("/customers"),
    },
    {
      id: "tasks",
      title: "Business Tasks",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Plan your Business Tasks",
      action: () => navigate("/tasks"),
    },
  ];

  return (
    <div className=" min-h-screen overflow-y-autobg-cover bg-center bg-no-repeat px-6 py-12">
      <div className="  max-w-2xl mx-auto h-fit">
        <div className="bg-[#5247bf] rounded-xl p-6 mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white text-center">
            Business Tools
          </h1>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-18">
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
              <button className="mt-3 bg-[#5247bf] text-white px-3 py-4 cursor-pointer text-sm rounded-lg hover:bg-[#4238a6] transition-all duration-200">
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

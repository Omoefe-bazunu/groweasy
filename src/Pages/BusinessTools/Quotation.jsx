import { useState } from "react";
import { FileText } from "lucide-react";
import QuotationCreator from "../../components/QuotationCreator";
import QuotationsList from "../../components/QuotationList";
import BacktoTools from "../../components/BacktoTools";

const Quotation = () => {
  const [activeTab, setActiveTab] = useState("quotations");

  const tabs = [
    {
      id: "quotations",
      label: "Create Quotation",
      icon: FileText,
      component: QuotationCreator,
    },
    {
      id: "quotation-list",
      label: "Quotations List",
      icon: FileText,
      component: QuotationsList,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 px-4 pt-4 pb-30 md:px-20 md:pt-6 md:pb-30">
      <BacktoTools />
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 cursor-pointer px-2 border-b-4 transition-colors ${
                    isActive
                      ? "border-[#0ea5e9] text-[#0ea5e9]" // Changed color to Sky Blue
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="transition-all duration-300">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default Quotation;

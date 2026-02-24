import { useState } from "react";
import { FileText, List } from "lucide-react";
import PayablesList from "../../components/PayablesList";
import PayablesCreator from "../../components/PayablesCreator";
import BacktoTools from "../../components/BacktoTools";

const Payables = () => {
  const [activeTab, setActiveTab] = useState("list");

  const tabs = [
    {
      id: "list",
      label: "Payables List",
      icon: List,
      component: PayablesList,
    },
    {
      id: "creator",
      label: "Payables Creator",
      icon: FileText,
      component: PayablesCreator,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 px-4 pt-4 pb-30 md:px-20 md:pt-6 md:pb-30">
      <BacktoTools />
      {/* Tabs Navigation */}
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
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                    isActive
                      ? "border-[#5247bf] text-[#5247bf]"
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

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default Payables;

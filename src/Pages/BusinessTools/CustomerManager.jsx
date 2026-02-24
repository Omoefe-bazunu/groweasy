import { useState, useEffect } from "react";
import { UserPlus, BarChart3, LayoutList } from "lucide-react";
import CustomerForm from "../../components/CustomerForm";
import CustomerList from "../../components/CustomerList";
import CustomerAnalytics from "../../components/CustomerAnalytics";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";
import api from "../../lib/api";
import BacktoTools from "../../components/BacktoTools";

const CustomerManager = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("list");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Replaced onSnapshot with backend fetch
  useEffect(() => {
    if (!user) return;
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers");
      setCustomers(res.data.customers);
    } catch (err) {
      console.error("Error fetching customers:", err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Shared updater — passed to List (delete/edit) and Form (add)
  const handleCustomersChange = (updaterFn) => {
    setCustomers((prev) =>
      typeof updaterFn === "function" ? updaterFn(prev) : updaterFn,
    );
  };

  // Called by CustomerForm after a successful save
  const handleCustomerAdded = (newCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const tabs = [
    { id: "list", label: "Customer List", icon: LayoutList },
    { id: "add", label: "Add Customer", icon: UserPlus },
    { id: "analytics", label: "Insights", icon: BarChart3 },
  ];

  // ✅ Explicit render so all props are passed correctly
  const renderTab = () => {
    switch (activeTab) {
      case "list":
        return (
          <CustomerList
            customers={customers}
            loading={loading}
            onCustomersChange={handleCustomersChange}
          />
        );
      case "add":
        return (
          <CustomerForm
            switchToTab={setActiveTab}
            onCustomerAdded={handleCustomerAdded}
          />
        );
      case "analytics":
        return <CustomerAnalytics customers={customers} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 px-4 pt-4 pb-30 md:px-20 md:pt-6">
      <BacktoTools />
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 cursor-pointer px-2 border-b-4 transition-colors whitespace-nowrap ${
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

      <div className="max-w-7xl mx-auto py-6">{renderTab()}</div>
    </div>
  );
};

export default CustomerManager;

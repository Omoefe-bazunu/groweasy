import { useState, useEffect } from "react";
import { LayoutDashboard, PackagePlus, BookOpen } from "lucide-react";
import InventoryDashboard from "../../components/InventoryDashboard";
import InventoryOperations from "../../components/InventoryOperations";
import InventoryGuide from "../../components/InventoryGuide";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";
import api from "../../lib/api";

const InventoryManager = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Replaced onSnapshot with a single backend fetch
  useEffect(() => {
    if (!user) return;
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory");
      setInventory(res.data.inventory);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Shared updater passed to both Dashboard and Operations
  const handleInventoryChange = (updaterFn) => {
    setInventory((prev) =>
      typeof updaterFn === "function" ? updaterFn(prev) : updaterFn,
    );
  };

  const tabs = [
    { id: "dashboard", label: "Stock Dashboard", icon: LayoutDashboard },
    { id: "operations", label: "Manage Stock", icon: PackagePlus },
    { id: "guide", label: "How to Use", icon: BookOpen },
  ];

  // ✅ Render children directly (not via ActiveComponent) so all props are passed
  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <InventoryDashboard
            inventory={inventory}
            loading={loading}
            onInventoryChange={handleInventoryChange}
          />
        );
      case "operations":
        return (
          <InventoryOperations
            inventory={inventory}
            onInventoryChange={handleInventoryChange}
            switchToTab={setActiveTab}
          />
        );
      case "guide":
        return <InventoryGuide />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 px-4 pt-4 pb-30 md:px-6 md:pt-6">
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
                      ? "border-[#8b5cf6] text-[#8b5cf6]"
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

export default InventoryManager;

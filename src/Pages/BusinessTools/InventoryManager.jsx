import { useState, useEffect } from "react";
import { LayoutDashboard, PackagePlus, BookOpen } from "lucide-react";
import InventoryDashboard from "../../components/InventoryDashboard";
import InventoryOperations from "../../components/InventoryOperations";
import InventoryGuide from "../../components/InventoryGuide";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const InventoryManager = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Data Fetching
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Create a query against the 'inventory' collection
    const q = query(
      collection(db, "inventory"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    // Set up a real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInventory(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching inventory:", error);
        setLoading(false);
      }
    );

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [user]);

  const tabs = [
    {
      id: "dashboard",
      label: "Stock Dashboard",
      icon: LayoutDashboard,
      component: InventoryDashboard,
    },
    {
      id: "operations",
      label: "Manage Stock",
      icon: PackagePlus,
      component: InventoryOperations,
    },
    {
      id: "guide",
      label: "How to Use",
      icon: BookOpen,
      component: InventoryGuide,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

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

      <div className="max-w-7xl mx-auto py-6">
        {ActiveComponent && (
          <ActiveComponent
            inventory={inventory}
            loading={loading}
            switchToTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryManager;

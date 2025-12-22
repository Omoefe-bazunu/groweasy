import { useState, useEffect } from "react";
import { Users, UserPlus, BarChart3, LayoutList } from "lucide-react";
import CustomerForm from "../../components/CustomerForm";
import CustomerList from "../../components/CustomerList";
import CustomerAnalytics from "../../components/CustomerAnalytics";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const CustomerManager = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("list");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "customers"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching customers:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const tabs = [
    {
      id: "list",
      label: "Customer List",
      icon: LayoutList,
      component: CustomerList,
    },
    {
      id: "add",
      label: "Add Customer",
      icon: UserPlus,
      component: CustomerForm,
    },
    {
      id: "analytics",
      label: "Insights",
      icon: BarChart3,
      component: CustomerAnalytics,
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

      <div className="max-w-7xl mx-auto py-6">
        {ActiveComponent && (
          <ActiveComponent
            customers={customers}
            loading={loading}
            switchToTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerManager;

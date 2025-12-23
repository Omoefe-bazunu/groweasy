import { Routes, Route, useLocation } from "react-router-dom";
import Onboarding from "./Pages/Home";
import SignUp from "./Pages/Signup";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import ContentCreationBoard from "./Pages/ContentCreationBoard";
import Profile from "./Pages/Profile";
import PublicProfile from "./Pages/PublicProfile";
import Documents from "./Pages/Documents";
import AddExpert from "./Pages/AddExpert";
import BottomNav from "./components/BottomNav";
import TopNav from "./components/Header";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import Testimonials from "./Pages/Testimonials";
import AdminDashboard from "./Pages/AdminDashboard";

// Business Tools
import FinancialRecords from "./Pages/BusinessTools/FinancialRecords";
import Invoice from "./Pages/BusinessTools/Invoice";
import Receipt from "./Pages/BusinessTools/Receipt";
import Tasks from "./Pages/BusinessTools/Tasks";

// Subscription
import Subscribe from "./Pages/Subscribe"; // This is your new subscription page
import UserProfile from "./Pages/UserProfile";
import Quotation from "./Pages/BusinessTools/Quotation";
import Payroll from "./Pages/BusinessTools/Payroll";
import KnowledgeBase from "./Pages/KnowledgeBase";
import NigeriaTaxCalculator from "./Pages/BusinessTools/TaxCalculator";
import InventoryManager from "./Pages/BusinessTools/InventoryManager";
import CustomerManager from "./Pages/BusinessTools/CustomerManager";
import ReferralDashboard from "./Pages/ReferralDashboard";
import { ToastContainer } from "react-toastify";

const App = () => {
  const location = useLocation();
  const hideNavPaths = ["/", "/signup", "/login"];
  const isPublicProfile = location.pathname.startsWith("/public-profile");

  const showNav = !hideNavPaths.includes(location.pathname) && !isPublicProfile;

  return (
    <div className="bg-white min-h-screen">
      {showNav && <TopNav />}

      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/tax-calculator" element={<NigeriaTaxCalculator />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />

        {/* Authenticated User Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/referrals" element={<ReferralDashboard />} />
        <Route
          path="/content-creation-board"
          element={<ContentCreationBoard />}
        />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/public-profile/:userId" element={<PublicProfile />} />

        {/* Business Tools */}
        <Route path="/financial-records" element={<FinancialRecords />} />
        <Route path="/invoices" element={<Invoice />} />
        <Route path="/quotations" element={<Quotation />} />
        <Route path="/receipts" element={<Receipt />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/inventory" element={<InventoryManager />} />
        <Route path="/customers" element={<CustomerManager />} />
        <Route path="/tasks" element={<Tasks />} />

        {/* Subscription */}
        <Route path="/subscribe" element={<Subscribe />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/add-expert" element={<AddExpert />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {showNav && <BottomNav />}
    </div>
  );
};

export default App;

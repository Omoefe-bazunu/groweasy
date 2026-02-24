import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Layout Components
import TopNav from "./components/Header";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";

// Public Pages
import Onboarding from "./Pages/Home";
import SignUp from "./Pages/Signup";
import Login from "./Pages/Login";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import Testimonials from "./Pages/Testimonials";
import KnowledgeBase from "./Pages/KnowledgeBase";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import TermsAndConditions from "./Pages/TermsConditions";

// Authenticated User Pages
import Dashboard from "./Pages/Dashboard";
import ReferralDashboard from "./Pages/ReferralDashboard";
import ContentCreationBoard from "./Pages/ContentCreationBoard";
import UserProfile from "./Pages/UserProfile";
// import Profile from "./Pages/Profile";
import Documents from "./Pages/Documents";
// import PublicProfile from "./Pages/PublicProfile";

// Business Tools
import FinancialRecords from "./Pages/BusinessTools/FinancialRecords";
import Invoice from "./Pages/BusinessTools/Invoice";
import Quotation from "./Pages/BusinessTools/Quotation";
import Receipt from "./Pages/BusinessTools/Receipt";
import Tasks from "./Pages/BusinessTools/Tasks";
import Payroll from "./Pages/BusinessTools/Payroll";
import InventoryManager from "./Pages/BusinessTools/InventoryManager";
import CustomerManager from "./Pages/BusinessTools/CustomerManager";
import NigeriaTaxCalculator from "./Pages/BusinessTools/TaxCalculator";
import CustomerSatisfaction from "./Pages/CustomerSatisfaction";
import PublicRate from "./Pages/PublicRate";
import Budgets from "./Pages/BusinessTools/Budgets";

// Subscription & Admin
import Subscribe from "./Pages/Subscribe";
import AdminDashboard from "./Pages/AdminDashboard";
import AddExpert from "./Pages/AddExpert";
import Receivables from "./Pages/BusinessTools/Receivables";
import Payables from "./Pages/BusinessTools/Payables";

const App = () => {
  const location = useLocation();

  // Navigation Logic
  const hideNavPaths = ["/", "/signup", "/login"];
  const isPublicProfile = location.pathname.startsWith("/public-profile");
  const isRatingPage = location.pathname.startsWith("/rate/"); // Add this

  const showNav =
    !hideNavPaths.includes(location.pathname) &&
    !isPublicProfile &&
    !isRatingPage;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* 1. Header: Standard links on desktop, icons on mobile */}
      {showNav && <TopNav />}

      {/* 2. Main Content: flex-grow ensures footer stays at the bottom */}
      <main className="flex-grow">
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
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsAndConditions />} />

          {/* Public Rating Page (No Nav) */}
          <Route path="/rate/:businessId" element={<PublicRate />} />

          {/* Authenticated Dashboard Page */}
          <Route
            path="/satisfaction-dashboard"
            element={<CustomerSatisfaction />}
          />

          {/* Authenticated User Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/referrals" element={<ReferralDashboard />} />
          <Route
            path="/content-creation-board"
            element={<ContentCreationBoard />}
          />
          <Route path="/user-profile" element={<UserProfile />} />
          {/* <Route path="/profile" element={<Profile />} /> */}
          <Route path="/documents" element={<Documents />} />
          {/* <Route path="/public-profile/:userId" element={<PublicProfile />} /> */}

          {/* Business Tools */}
          <Route path="/financial-records" element={<FinancialRecords />} />
          <Route path="/invoices" element={<Invoice />} />
          <Route path="/quotations" element={<Quotation />} />
          <Route path="/receipts" element={<Receipt />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/inventory" element={<InventoryManager />} />
          <Route path="/customers" element={<CustomerManager />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/receivables" element={<Receivables />} />
          <Route path="/payables" element={<Payables />} />

          {/* Subscription */}
          <Route path="/subscribe" element={<Subscribe />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add-expert" element={<AddExpert />} />
        </Routes>
      </main>

      {/* 3. Footer: Neat desktop view, hidden on mobile and auth pages */}
      {showNav && <Footer />}

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

      {/* 4. Bottom Nav: Floating mobile bar, hidden on desktop */}
      {showNav && <BottomNav />}
    </div>
  );
};

export default App;

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
import FinancialRecords from "./Pages/BusinessTools/FinancialRecords";
import Donation from "./Pages/Donation";
import Invoice from "./Pages/BusinessTools/Invoice";
import Receipt from "./Pages/BusinessTools/Receipt";

const App = () => {
  const location = useLocation();
  const hideNavPaths = ["/", "/signup", "/login"];
  const isPublicProfile = location.pathname.startsWith("/public-profile");

  return (
    <div className=" bg-white">
      {!hideNavPaths.includes(location.pathname) && !isPublicProfile && (
        <TopNav />
      )}
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/content-creation-board"
          element={<ContentCreationBoard />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/add-expert" element={<AddExpert />} />
        <Route path="/public-profile/:userId" element={<PublicProfile />} />
        <Route path="/admin/add-expert" element={<AddExpert />} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/donation" element={<Donation />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/contact" element={<Contact />} />
        {/* Business Tools */}
        <Route path="/financial-records" element={<FinancialRecords />} />
        <Route path="/invoices" element={<Invoice />} />
        <Route path="/receipts" element={<Receipt />} />
      </Routes>
      {!hideNavPaths.includes(location.pathname) && !isPublicProfile && (
        <BottomNav />
      )}
    </div>
  );
};

export default App;

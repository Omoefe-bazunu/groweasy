import { Routes, Route, useLocation } from "react-router-dom";
import Onboarding from "./Pages/Home";
import SignUp from "./Pages/Signup";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
// import ContentPlan from "./Pages/ContentPlan";
import ContentCreationBoard from "./Pages/ContentCreationBoard";
import Profile from "./Pages/Profile";
import PublicProfile from "./Pages/PublicProfile";
import Documents from "./Pages/Documents";
import AddExpert from "./Pages/AddExpert";
import BottomNav from "./components/BottomNav";
import TopNav from "./components/Header";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import ImageGenerator from "./Pages/CreateImage";
import Testimonials from "./Pages/Testimonials";
import Subscription from "./Pages/Subscription";
import AdminDashboard from "./Pages/AdminDashboard";

// Content Management
import ContentPlanList from "./Pages/content/ContentPlanList";
import ContentPlanGenerator from "./Pages/content/ContentPlanGenerator";
import ContentStrategyList from "./Pages/content/ContentStrategyList";
import ContentStrategyGenerator from "./pages/content/ContentStrategyGenerator";
import BlogPostList from "./Pages/content/BlogPostList";
import BlogPostGenerator from "./pages/content/BlogPostGenerator";
import ContentRepurposer from "./Pages/content/ContentRepurposer";

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
        <Route path="/create-images" element={<ImageGenerator />} />
        <Route
          path="/content-creation-board"
          element={<ContentCreationBoard />}
        />

        {/* Content Plans */}
        <Route path="content-plans">
          <Route index element={<ContentPlanList />} />
          <Route path="new" element={<ContentPlanGenerator />} />
          <Route path=":id/repurpose" element={<ContentRepurposer />} />
        </Route>

        {/* Content Strategies */}
        <Route path="content-strategies">
          <Route index element={<ContentStrategyList />} />
          <Route path="new" element={<ContentStrategyGenerator />} />
          <Route path=":id/repurpose" element={<ContentRepurposer />} />
        </Route>

        {/* Blog Posts */}
        <Route path="blog-posts">
          <Route index element={<BlogPostList />} />
          <Route path="new" element={<BlogPostGenerator />} />
          <Route path=":id/repurpose" element={<ContentRepurposer />} />
        </Route>

        <Route path="/profile" element={<Profile />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/add-expert" element={<AddExpert />} />
        <Route path="/public-profile/:userId" element={<PublicProfile />} />
        <Route path="/admin/add-expert" element={<AddExpert />} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/subscribe" element={<Subscription />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      {!hideNavPaths.includes(location.pathname) && !isPublicProfile && (
        <BottomNav />
      )}
    </div>
  );
};

export default App;

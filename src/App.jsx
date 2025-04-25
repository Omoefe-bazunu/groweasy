import { Routes, Route, useLocation } from "react-router-dom";
import Onboarding from "./Pages/Home";
import SignUp from "./Pages/Signup";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import ContentPlan from "./Pages/ContentPlan";
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
        <Route path="/content-plan" element={<ContentPlan />} />
        <Route path="/create-images" element={<ImageGenerator />} />
        <Route
          path="/content-creation-board"
          element={<ContentCreationBoard />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/add-expert" element={<AddExpert />} />
        <Route path="/public-profile/:userId" element={<PublicProfile />} />
        <Route path="/add-expert" element={<AddExpert />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      {!hideNavPaths.includes(location.pathname) && !isPublicProfile && (
        <BottomNav />
      )}
    </div>
  );
};

export default App;

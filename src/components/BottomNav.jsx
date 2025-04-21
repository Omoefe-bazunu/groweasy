import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, User, File, LogOut, BookOpen } from "lucide-react";
import { useUser } from "../context/UserContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const navItems = [
    { path: "/dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
    {
      path: "/content-plan",
      label: "Plan",
      icon: <FileText className="w-5 h-5" />,
    },
    { path: "/profile", label: "Profile", icon: <User className="w-5 h-5" /> },
    { path: "/documents", label: "Docs", icon: <File className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="max-w-2xl mx-auto fixed bottom-0 left-0 right-0 bg-[#5247bf] shadow-2xl rounded-t-xl flex justify-around py-2">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center p-3 rounded-lg transition-all duration-100 ${
            location.pathname === item.path
              ? "bg-white text-[#5247bf] scale-105"
              : "text-gray-200 hover:bg-white hover:text-[#5247bf] hover:scale-110"
          }`}
        >
          {item.icon}
          <span className="text-xs font-medium mt-1">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center p-3 cursor-pointer rounded-lg text-gray-200 hover:bg-white hover:text-[#5247bf] hover:scale-110 transition-all duration-100"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-medium mt-1">Logout</span>
      </button>
    </nav>
  );
};

export default BottomNav;

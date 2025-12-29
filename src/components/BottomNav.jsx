import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, User, File, LogOut } from "lucide-react";
import { useUser } from "../context/UserContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const navItems = [
    { path: "/dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
    {
      path: "/content-creation-board",
      label: "Tools",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      path: "/user-profile",
      label: "Profile",
      icon: <User className="w-5 h-5" />,
    },
    { path: "/documents", label: "Docs", icon: <File className="w-5 h-5" /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#5247bf] shadow-2xl rounded-t-xl flex justify-around py-2 z-50">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center p-3 rounded-lg transition-all duration-100 ${
            location.pathname === item.path
              ? "bg-white text-[#5247bf] scale-105"
              : "text-gray-200"
          }`}
        >
          {item.icon}
          <span className="text-xs font-medium mt-1">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center p-3 text-gray-200"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-medium mt-1">Logout</span>
      </button>
    </nav>
  );
};

export default BottomNav;

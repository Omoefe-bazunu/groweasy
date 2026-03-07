"use client"; // Required for hooks

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, User, File, LogOut } from "lucide-react";
import { useUser } from "@/context/UserContext";

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useUser();

  const navItems = [
    { path: "/dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
    {
      path: "/businesstools",
      label: "Tools",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <User className="w-5 h-5" />,
    },
    { path: "/documents", label: "Docs", icon: <File className="w-5 h-5" /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/"); // Next.js uses router.push instead of navigate
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#5247bf] shadow-2xl rounded-t-xl flex justify-around py-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.path;

        return (
          <Link
            key={item.path}
            href={item.path} // 'to' becomes 'href'
            className={`flex flex-col items-center p-3 rounded-lg transition-all duration-100 ${
              isActive
                ? "bg-white text-[#5247bf] scale-105"
                : "text-gray-200 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="flex flex-col items-center p-3 text-gray-200 hover:text-white transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-medium mt-1">Logout</span>
      </button>
    </nav>
  );
};

export default BottomNav;

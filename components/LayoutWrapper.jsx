"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { ToastContainer } from "react-toastify";
import TopNav from "./Shared/Header";
import BottomNav from "./Shared/BottomNav";
import Footer from "./Shared/Footer";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const { user } = useUser();

  // ✅ Service Worker Unregistration (Disabling PWA)
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then(() => {
            console.log("⚠️ GrowEasy PWA unregistered for clean web access.");
          });
        }
      });
    }
  }, []);

  // 1. STRICT HIDE LIST
  const hideNavPaths = ["/auth/login", "/auth/signup", "/"];

  // 2. Determine visibility
  const isAuthPage = hideNavPaths.includes(pathname);
  const showNav = !isAuthPage && user;

  return (
    <div className="bg-brand-warm min-h-screen flex flex-col font-sans">
      {showNav && <TopNav />}

      <main className={`grow ${showNav ? "animate-page-reveal" : ""}`}>
        {children}
      </main>

      {showNav && <Footer />}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
        toastStyle={{
          backgroundColor: "#5247bf",
          fontFamily: "var(--font-bricolage)",
          borderRadius: "1rem",
        }}
      />

      {showNav && <BottomNav />}
    </div>
  );
}

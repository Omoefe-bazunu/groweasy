"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { ToastContainer, toast } from "react-toastify";
import TopNav from "./Shared/Header";
import BottomNav from "./Shared/BottomNav";
import Footer from "./Shared/Footer";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const { user } = useUser();

  // ✅ Service Worker Registration with Update Detection
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const showUpdateToast = (reg) => {
        toast.info("A new version of GrowEasy is available!", {
          position: "bottom-center",
          autoClose: false,
          closeOnClick: false,
          style: { backgroundColor: "#5247bf", color: "white" },
          onClick: () => {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            }
          },
        });
      };

      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("✅ GrowEasy Service Worker active! Scope:", reg.scope);

            // Check for updates
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  showUpdateToast(reg);
                }
              });
            });
          })
          .catch((err) => console.error("❌ SW registration failed:", err));
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  // 1. STRICT HIDE LIST
  const hideNavPaths = ["/auth/login", "/auth/signup"];

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

"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-brand-primary text-white p-5 rounded-[2rem] shadow-2xl z-[100] animate-in slide-in-from-bottom-10">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 opacity-70 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-2xl">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <p className="font-black uppercase text-[10px] tracking-widest opacity-80">
            App Available
          </p>
          <p className="font-bold text-sm">
            Install GrowEasy on your home screen
          </p>
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="w-full mt-4 bg-white text-brand-primary py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-brand-warm transition-colors"
      >
        Install Now
      </button>
    </div>
  );
}

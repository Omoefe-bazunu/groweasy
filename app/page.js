"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import onboardImg from "../public/onboarding.png";

const Onboarding = () => {
  const { user, loading } = useUser();
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 font-sans bg-brand-warm">
      <div
        className="relative w-3/4 max-w-md mb-8 flex items-center justify-center"
        style={{ backgroundColor: "transparent" }}
      >
        <Image
          src={onboardImg}
          alt="Onboarding Illustration"
          className={`w-full h-auto transition-opacity duration-700 ease-in-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority
          onLoad={() => setIsLoaded(true)}
          style={{
            backgroundColor: "transparent",
            display: "block",
          }}
        />
      </div>

      <h1 className="text-3xl text-gray-700 font-black mb-2 text-center uppercase tracking-tighter">
        Welcome to GrowEasy
      </h1>
      <p className="text-gray-900 mb-6 text-center max-w-lg font-medium leading-relaxed">
        Seamlessly create important business documents, keep accurate record of
        your business cash flow, connect with experts and grow smarter.
      </p>
      <div className="flex space-x-4 mt-2 mb-10">
        <Link
          href="/auth/signup"
          className="bg-[#5247bf] text-white px-8 py-3 rounded-2xl shadow-xl hover:bg-[#4238a6] transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
        >
          Sign Up
        </Link>
        <Link
          href="/auth/login"
          className="bg-white border-2 border-[#5247bf] text-[#5247bf] px-8 py-3 rounded-2xl shadow-md hover:bg-gray-50 transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
        >
          Log In
        </Link>
      </div>
      <p className="text-[10px] text-gray-400 text-center max-w-sm font-black uppercase tracking-[0.2em]">
        Powered by HIGH-ER ENTERPRISES
      </p>
    </div>
  );
};

export default Onboarding;

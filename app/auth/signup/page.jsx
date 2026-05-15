"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api";

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { signupWithEmail, setUserData, isSigningUpRef } = useUser();
  const router = useRouter();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !phoneNumber) {
      return setError("Please fill in all fields");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      return setError("Please enter a valid phone number");
    }

    setLoading(true);
    setError("");

    try {
      await signupWithEmail(name, email, password);

      await api.post("/auth/complete-signup", {
        name,
        email,
        phoneNumber,
      });

      const res = await api.get("/auth/me");
      setUserData(res.data);

      if (isSigningUpRef) isSigningUpRef.current = false;

      setIsRedirecting(true);
      toast.success("Welcome aboard!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      if (isSigningUpRef) isSigningUpRef.current = false;
      setError(
        err.response?.data?.message || err.message || "Failed to sign up",
      );
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-brand-warm flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-brand-primary animate-bounce" />
          </div>
          <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">
            Account Created!
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Setting up your business profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-section flex items-center justify-center p-4 font-sans text-gray-700">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 w-full max-w-md border border-gray-100 animate-in fade-in duration-500">
        <h2 className="text-4xl font-black text-brand-primary mb-2 text-center uppercase tracking-tighter">
          Get Started
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8 font-medium">
          Join the GrowEasy business network.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g Omoefe Bazunu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+234..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-active text-white py-5 rounded-2xl shadow-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:bg-gray-200"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
          Already a member?{" "}
          <Link
            href="/auth/login"
            className="text-brand-primary hover:underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

const SignUp = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-warm flex items-center justify-center font-sans">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
};

export default SignUp;

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { X, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { loginWithEmail, sendPasswordReset } = useUser();
  const router = useRouter();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields");

    setLoading(true);
    setError("");
    try {
      await loginWithEmail(email, password);
      // Success: Swap UI to transition state immediately
      setIsRedirecting(true);
      // Navigation is already triggered in UserContext.loginWithEmail
    } catch (error) {
      setError(error.message || "Failed to log in");
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return setResetError("Please enter your email");

    setLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      await sendPasswordReset(resetEmail);
      setResetSuccess("Reset link sent! Check your inbox.");
      setTimeout(() => setIsResetModalOpen(false), 3000);
    } catch (error) {
      setResetError(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  // --- Redirecting Transition UI ---
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-brand-warm flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="animate-in zoom-in fade-in duration-500">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-brand-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">
            Welcome Back
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Preparing your GrowEasy dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-section flex items-center justify-center p-4 font-sans text-gray-700">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-gray-100 animate-in zoom-in-95 duration-300">
        <h2 className="text-4xl font-black text-brand-primary mb-2 text-center uppercase tracking-tighter">
          Sign In
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8 font-medium italic">
          Grow smarter with GrowEasy.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold text-gray-800 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold text-gray-800 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="text-brand-primary text-[11px] font-black uppercase tracking-widest mt-3 block ml-auto hover:text-brand-active transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-brand-active transition-all active:scale-95 disabled:bg-gray-200"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
          New here?{" "}
          <Link
            href="/auth/signup"
            className="text-brand-primary hover:text-brand-active underline underline-offset-4"
          >
            Create Account
          </Link>
        </p>
      </div>

      {/* Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full relative animate-in zoom-in-95">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
            <h2 className="text-2xl font-black text-brand-dark mb-2 uppercase tracking-tighter">
              Reset Password
            </h2>
            {resetError && (
              <p className="text-red-500 text-xs font-bold mb-4">
                {resetError}
              </p>
            )}
            {resetSuccess && (
              <p className="text-green-500 text-xs font-bold mb-4">
                {resetSuccess}
              </p>
            )}
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <input
                type="email"
                placeholder="Enter registered email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary font-bold"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black uppercase"
              >
                {loading ? "Sending..." : "Send Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

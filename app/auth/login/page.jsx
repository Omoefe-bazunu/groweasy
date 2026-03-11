"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { loginWithEmail, sendPasswordReset } = useUser();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields");

    setLoading(true);
    setError("");

    try {
      await loginWithEmail(email, password);
      // ✅ REMOVED: No duplicate navigation - handled in UserContext
      // ✅ Keep loading state active until dashboard loads
    } catch (err) {
      setError(err.message || "Failed to log in");
      setLoading(false); // Only reset on error
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
    } catch (err) {
      setResetError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

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
            className="w-full bg-brand-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-brand-active transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </span>
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
                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black uppercase disabled:opacity-60"
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

const Login = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-warm flex items-center justify-center font-sans">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
};

export default Login;

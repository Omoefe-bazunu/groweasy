import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { FcGoogle } from "react-icons/fc";
import { X } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const { loginWithEmail, loginWithGoogle, sendPasswordReset } = useUser();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await loginWithEmail(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Failed to log in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
    setResetEmail("");
    setResetError("");
    setResetSuccess("");
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError("Please enter your email address");
      return;
    }

    setLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      await sendPasswordReset(resetEmail);
      setResetSuccess("Password reset email sent! Please check your inbox.");
      setTimeout(() => handleCloseResetModal(), 3000); // Close modal after 3 seconds
    } catch (error) {
      setResetError(error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-[#5247bf] mb-6 text-center">
          Sign In
        </h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 text-gray-600 rounded-lg bg-gray-50"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
              required
            />
            <p
              onClick={handleOpenResetModal}
              className="text-[#5247bf] text-sm mt-2 text-right cursor-pointer hover:underline"
            >
              Forgot Password?
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-[#5247bf] text-white cursor-pointer p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 shadow-md disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In with Email"}
          </button>
        </form>
        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-gray-100 text-gray-800 p-3 cursor-pointer rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center justify-center space-x-2 shadow-md disabled:bg-gray-400"
          disabled={loading}
        >
          <FcGoogle className="w-5 h-5" />
          <span>{loading ? "Processing..." : "Log In with Google"}</span>
        </button>
        <p className="mt-4 text-center text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-[#5247bf] hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
            <button
              onClick={handleCloseResetModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold text-[#5247bf] mb-4">
              Reset Password
            </h2>
            {resetError && (
              <p className="text-red-500 mb-4 text-center">{resetError}</p>
            )}
            {resetSuccess && (
              <p className="text-green-500 mb-4 text-center">{resetSuccess}</p>
            )}
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label
                  htmlFor="resetEmail"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-50 text-gray-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

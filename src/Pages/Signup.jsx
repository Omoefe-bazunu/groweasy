import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../lib/api";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Pull everything needed from UserContext
  const { signupWithEmail, setUserData, isSigningUp } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Capture Referral Code on Mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get("ref");
    if (refCode) {
      localStorage.setItem("referralCode", refCode);
    }
  }, [location]);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !phoneNumber) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create Firebase auth user
      //    isSigningUp.current = true is set inside signupWithEmail
      const newUser = await signupWithEmail(name, email, password);

      // 2. Get referral code from localStorage
      const referralCode = localStorage.getItem("referralCode");

      // 3. Create Firestore profile via backend
      await api.post("/referral/complete-signup", {
        name,
        email,
        phoneNumber,
        referralCode: referralCode || null,
      });

      // 4. Profile now exists — safe to fetch it
      const res = await api.get("/auth/me");
      setUserData(res.data); // ✅ hydrate context before navigation

      localStorage.removeItem("referralCode");
      toast.success("Account created successfully!");

      // 5. Reset the flag now that everything is done
      isSigningUp.current = false;

      // 6. Navigate — no setTimeout needed
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup Error:", err);
      isSigningUp.current = false; // always reset on error
      setError(err.message || "Failed to sign up");
      toast.error(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-[#5247bf] mb-6 text-center">
          Create Your Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-gray-700 font-medium mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g Omoefe Bazunu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="e.g raniem57@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-gray-700 font-medium mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              placeholder="e.g +2349043970401"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#5247bf] hover:bg-[#4238a6] text-white p-3 rounded-lg shadow-md cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium flex justify-center items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#5247bf] hover:underline font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;

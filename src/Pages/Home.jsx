import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useEffect } from "react";

const Onboarding = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // We redirect only if we are absolutely sure the user is logged in
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // ✅ REMOVED: The blocking "if (loading) return Loading..." block.
  // This allows the UI below to render immediately.

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <img
        src="/onboard.png"
        alt="Onboarding Illustration"
        className="w-3/4 max-w-md mb-8"
        // ✅ Add loading="eager" to prioritize this image
        loading="eager"
      />
      <h1 className="text-3xl text-gray-700 font-bold mb-2 text-center">
        Welcome to GrowEasy
      </h1>
      <p className="text-gray-900 mb-4 text-center max-w-sm">
        Seamlessly create important business documents, keep accurate record of
        your business cash flow, connect with experts and grow smarter.
      </p>

      {/* If loading is true, we keep buttons disabled or hidden to prevent double-clicks */}
      <div className="flex space-x-4 mt-2 mb-6">
        <Link
          to="/signup"
          className="bg-[#5247bf] text-white px-8 py-2 rounded-lg shadow hover:bg-[#4238a6] transition-transform active:scale-95"
        >
          Sign Up
        </Link>
        <Link
          to="/login"
          className="bg-white border border-[#5247bf] text-[#5247bf] px-8 py-2 rounded-lg shadow hover:bg-gray-100 transition-transform active:scale-95"
        >
          Log In
        </Link>
      </div>

      <p className="text-sm text-gray-700 mb-4 text-center max-w-sm font-medium">
        Powered by HIGH-ER ENTERPRISES
      </p>
    </div>
  );
};

export default Onboarding;

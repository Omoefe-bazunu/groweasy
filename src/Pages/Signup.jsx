// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useUser } from "../context/UserContext";
// import { Eye, EyeOff } from "lucide-react";

// const SignUp = () => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { signupWithEmail, logout } = useUser();
//   const navigate = useNavigate();

//   const handleEmailSignUp = async (e) => {
//     e.preventDefault();
//     if (!name || !email || !password || !phoneNumber) {
//       setError("Please fill in all fields");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       await signupWithEmail(name, email, password, phoneNumber);
//       setSuccess(
//         "Signup successful! Please check your email to verify your account."
//       );
//       await logout();
//       setTimeout(() => navigate("/login"), 3000);
//     } catch (error) {
//       setError(error.message || "Failed to sign up");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   return (
//     <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
//         <h2 className="text-3xl font-extrabold text-[#5247bf] mb-6 text-center">
//           Create Your Account
//         </h2>
//         {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
//         {success && (
//           <p className="text-green-500 mb-4 text-center">{success}</p>
//         )}
//         <form onSubmit={handleEmailSignUp} className="space-y-6">
//           <div>
//             <label
//               htmlFor="name"
//               className="block text-gray-700 font-medium mb-1"
//             >
//               Name
//             </label>
//             <input
//               type="text"
//               id="name"
//               placeholder="e.g Omoefe Bazunu"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
//               required
//             />
//           </div>
//           <div>
//             <label
//               htmlFor="email"
//               className="block text-gray-700 font-medium mb-1"
//             >
//               Email
//             </label>
//             <input
//               type="email"
//               id="email"
//               placeholder="e.g raniem57@gmail.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
//               required
//             />
//           </div>
//           <div>
//             <label
//               htmlFor="password"
//               className="block text-gray-700 font-medium mb-1"
//             >
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 id="password"
//                 placeholder="Enter a password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={togglePasswordVisibility}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
//               >
//                 {showPassword ? (
//                   <EyeOff className="w-5 h-5" />
//                 ) : (
//                   <Eye className="w-5 h-5" />
//                 )}
//               </button>
//             </div>
//           </div>
//           <div>
//             <label
//               htmlFor="phoneNumber"
//               className="block text-gray-700 font-medium mb-1"
//             >
//               Phone Number
//             </label>
//             <input
//               type="tel"
//               id="phoneNumber"
//               placeholder="e.g +2349043970401"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
//               required
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full bg-[#5247bf] hover:bg-[#4238a6] text-white p-3 rounded-lg shadow-md cursor-pointer disabled:bg-gray-400 transition-all duration-200"
//             disabled={loading}
//           >
//             {loading ? "Signing Up..." : "Sign Up"}
//           </button>
//         </form>
//         <p className="mt-4 text-center text-gray-600 text-sm">
//           Already have an account?{" "}
//           <Link
//             to="/login"
//             className="text-[#5247bf] hover:underline font-medium"
//           >
//             Log in
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default SignUp;

import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Eye, EyeOff } from "lucide-react";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signupWithEmail, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phoneNumber) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const searchParams = new URLSearchParams(location.search);
      const referrerId = searchParams.get("ref");

      await signupWithEmail(name, email, password, phoneNumber, referrerId);
      setSuccess(
        "Signup successful! Please check your email to verify your account."
      );
      await logout();
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      setError(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-[#5247bf] mb-6 text-center">
          Create Your Account
        </h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {success && (
          <p className="text-green-500 mb-4 text-center">{success}</p>
        )}
        <form onSubmit={handleEmailSignUp} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-gray-700 font-medium mb-1"
            >
              Name
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
              Email
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
                placeholder="Enter a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5247bf]"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
            className="w-full bg-[#5247bf] hover:bg-[#4238a6] text-white p-3 rounded-lg shadow-md cursor-pointer disabled:bg-gray-400 transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600 text-sm">
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

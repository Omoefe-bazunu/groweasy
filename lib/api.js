import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach a token to EVERY request automatically
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        /**
         * 💡 OPTIMIZATION:
         * Using getIdToken() without 'true' will return the cached token if it's still valid (1hr).
         * Firebase automatically handles the refresh if it's expired.
         */
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Firebase Token Error:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message;

    // Handle 401 Unauthorized (Token expired / invalid)
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;

        // Skip auto-redirect for Admin pages so you don't lose your place
        if (!pathname.startsWith("/admin")) {
          auth.signOut();
          // ✅ Path updated to your new auth directory
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(new Error(message));
  },
);

export default api;

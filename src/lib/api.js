// src/lib/api.js
import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach a fresh Firebase token to EVERY request automatically
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // getIdToken(true) silently refreshes if the token is expired (1hr limit)
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Failed to get Firebase token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ✅ Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message;

    // Token expired / invalid — redirect to login (don't force signOut for admin)
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized.");

      // Only sign out if we're not on admin pages
      // Admin should stay logged in and just see the access denied message
      if (!window.location.pathname.startsWith("/admin")) {
        auth.signOut(); // clears Firebase session
        window.location.href = "/login";
      }
    }

    return Promise.reject(new Error(message));
  },
);

export default api;

// src/lib/api.js
import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach a fresh Firebase token to EVERY request automatically
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // getIdToken(true) silently refreshes if the token is expired (1hr limit)
    const token = await user.getIdToken(true);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message;

    // Token expired / invalid — force logout
    if (error.response?.status === 401) {
      console.warn("Session expired. Please log in again.");
      auth.signOut(); // clears Firebase session
    }

    return Promise.reject(new Error(message));
  },
);

export default api;

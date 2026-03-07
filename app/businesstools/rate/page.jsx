"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import {
  Star,
  Globe,
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import QRCode from "react-qr-code";
import api from "@/lib/api";
import BacktoTools from "@/components/Shared/BacktoTools";

const CustomerSatisfaction = () => {
  const { user } = useUser();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState(""); // SSR Fix: Store origin in state
  const qrRef = useRef();

  const [timeframe, setTimeframe] = useState("month");
  const [regionFilter, setRegionFilter] = useState("All");

  // 1. SSR Fix: Only access 'window' after mounting
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicLink = `${origin}/rate/${user?.uid}`;

  useEffect(() => {
    if (!user) return;
    fetchRatings();
  }, [user]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ratings");
      const data = res.data.ratings.map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      }));
      setRatings(data);
    } catch (err) {
      console.error("Error fetching ratings:", err);
      toast.error("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  // 2. Performance Optimization: Use useMemo for derived data
  const filteredRatings = useMemo(() => {
    let filtered = [...ratings];
    const now = new Date();

    if (timeframe === "week") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= cutoff);
    } else if (timeframe === "month") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= cutoff);
    } else if (timeframe === "quarter") {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= cutoff);
    } else if (timeframe === "year") {
      const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= cutoff);
    }

    if (regionFilter !== "All") {
      filtered = filtered.filter((r) => r.location?.state === regionFilter);
    }

    return filtered;
  }, [ratings, timeframe, regionFilter]);

  // 3. Derived Stat: Average Rating
  const averageRating = useMemo(() => {
    if (!filteredRatings.length) return 0;
    const sum = filteredRatings.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / filteredRatings.length).toFixed(1);
  }, [filteredRatings]);

  // CSAT Calculation logic
  const csatScore = ((averageRating / 5) * 100).toFixed(0);

  const downloadQRCode = () => {
    const svg = qrRef.current.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `GrowEasy-Rating-QR-${user?.uid.slice(0, 5)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code saved as PNG!");
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const uniqueRegions = useMemo(() => {
    const regions = ratings.map((r) => r.location?.state).filter(Boolean);
    return ["All", ...new Set(regions)];
  }, [ratings]);

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-[#5247bf]">
        Loading GrowEasy Feedback...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-20 text-gray-700">
      <div className="max-w-7xl mx-auto">
        <BacktoTools />

        {/* Header Section */}
        <div className="bg-[#5247bf] rounded-2xl p-8 mb-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black">
              Customer Satisfaction
            </h1>
            <p className="opacity-80">
              Track real-time feedback and grow your reputation.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-full md:w-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70">
              Your Rating Link
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={publicLink}
                className="bg-black/20 border-none rounded-lg px-3 py-2 text-sm w-full outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-white text-[#5247bf] p-2 rounded-lg hover:bg-indigo-50"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="text-[#5247bf] w-5 h-5" /> Filters
              </h2>
              <div className="space-y-6">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">Lifetime</option>
                </select>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold"
                >
                  {uniqueRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-[#5247bf] p-8 rounded-3xl shadow-xl text-white">
              <h3 className="text-4xl font-black">{filteredRatings.length}</h3>
              <p className="font-medium">Total Responses</p>
            </div>
          </div>

          {/* Stats & Feedback List */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-center md:text-left">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Satisfaction Score
                </p>
                <h2 className="text-7xl font-black text-gray-900 mb-4">
                  {averageRating}
                </h2>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="text-gray-100 stroke-current"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="text-[#5247bf] stroke-current"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={
                      2 * Math.PI * 70 * (1 - averageRating / 5)
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <TrendingUp className="text-[#5247bf] w-6 h-6" />
                  <span className="text-xs font-black text-[#5247bf]">
                    {csatScore}% CSAT
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gray-50/50 border-b font-black">
                Recent Feedbacks
              </div>
              <div className="divide-y divide-gray-50">
                {filteredRatings.length ? (
                  filteredRatings.map((r) => (
                    <div
                      key={r.id}
                      className="p-6 hover:bg-gray-50 flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-indigo-50 text-[#5247bf] px-2 py-1 rounded text-xs font-bold">
                            {r.rating} ★
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                            {r.location?.city}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                          {r.comment || "No comment left."}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-300 font-black">
                        {r.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-400 italic">
                    No feedback found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Export */}
        <div className="mt-12 bg-white p-12 rounded-[3rem] shadow-sm text-center border">
          <h3 className="text-2xl font-black mb-2">Export Your QR Code</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Place this QR code on receipts or in your store to gather instant
            feedback.
          </p>
          <div
            ref={qrRef}
            className="inline-block p-10 bg-white shadow-2xl rounded-[2.5rem] border mb-8"
          >
            <QRCode value={publicLink} size={200} fgColor="#5247bf" />
          </div>
          <br />
          <button
            onClick={downloadQRCode}
            className="bg-[#5247bf] text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto shadow-xl"
          >
            <Download className="w-6 h-6" /> Save QR as PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSatisfaction;

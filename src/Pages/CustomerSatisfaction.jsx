import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { useUser } from "../context/UserContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
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
  Landmark,
} from "lucide-react";
import { toast } from "react-toastify";
import QRCode from "react-qr-code";

/**
 * GrowEasy Customer Satisfaction Dashboard
 * Features: Real-time analytics, Location tracking, QR Code PNG Export.
 */
const CustomerSatisfaction = () => {
  const { user } = useUser();
  const [ratings, setRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(); // Reference for the high-res QR download

  const [timeframe, setTimeframe] = useState("month");
  const [regionFilter, setRegionFilter] = useState("All");

  const publicLink = `${window.location.origin}/rate/${user?.uid}`;

  // 1. Fetch data from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "customer_ratings"),
      where("businessId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setRatings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Filter Logic
  useEffect(() => {
    let filtered = [...ratings];
    const now = new Date();

    if (timeframe === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= weekAgo);
    } else if (timeframe === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= monthAgo);
    } else if (timeframe === "quarter") {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= quarterAgo);
    } else if (timeframe === "year") {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => r.createdAt >= yearAgo);
    }

    if (regionFilter !== "All") {
      filtered = filtered.filter((r) => r.location?.state === regionFilter);
    }

    setFilteredRatings(filtered);
  }, [ratings, timeframe, regionFilter]);

  // 3. Download Logic (SVG to high-res PNG)
  const downloadQRCode = () => {
    const svg = qrRef.current.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Set high resolution (1000x1000)
    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      ctx.fillStyle = "white"; // Solid background
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

  const averageRating = filteredRatings.length
    ? (
        filteredRatings.reduce((acc, curr) => acc + curr.rating, 0) /
        filteredRatings.length
      ).toFixed(1)
    : 0;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getUniqueRegions = () => {
    const regions = ratings.map((r) => r.location?.state).filter(Boolean);
    return ["All", ...new Set(regions)];
  };

  if (loading)
    return (
      <div className="p-20 text-center font-bold text-[#5247bf]">
        Loading ...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="bg-[#5247bf] rounded-2xl p-8 mb-8 shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black">
              Customer Satisfaction
            </h1>
            <p className="text-indigo-100 opacity-80">
              Track real-time feedback and grow your business reputation.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-70">
                Public Link
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicLink}
                  className="bg-black/20 border-none rounded-lg px-3 py-2 text-sm w-full md:w-48 focus:ring-0 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-white text-[#5247bf] p-2 rounded-lg hover:bg-indigo-50 transition-all"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Filters & Counts */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="text-[#5247bf] w-5 h-5" /> Filters
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Time Period
                  </label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5247bf] font-bold text-gray-700 outline-none"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="all">Lifetime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Region
                  </label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5247bf] font-bold text-gray-700 outline-none"
                  >
                    {getUniqueRegions().map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#5247bf] to-[#4238a6] p-8 rounded-3xl shadow-xl text-white">
              <Users className="w-10 h-10 mb-4 opacity-50" />
              <h3 className="text-4xl font-black mb-1">
                {filteredRatings.length}
              </h3>
              <p className="text-indigo-100 font-medium">Total Responses</p>
            </div>
          </div>

          {/* Main Area: Score Meter & Recent Activity */}
          <div className="lg:col-span-8 space-y-8">
            {/* Visual CSAT Meter */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-center md:text-left">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Satisfaction Score
                  </p>
                  <h2 className="text-7xl font-black text-gray-900 mb-4">
                    {averageRating}
                  </h2>
                  <div className="flex gap-1 justify-center md:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      className="text-gray-100 stroke-current"
                      strokeWidth="16"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      className="text-[#5247bf] stroke-current transition-all duration-1000"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 80}
                      strokeDashoffset={
                        2 * Math.PI * 80 * (1 - averageRating / 5)
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <TrendingUp className="text-[#5247bf] w-8 h-8 mb-1" />
                    <span className="text-sm font-black text-[#5247bf]">
                      {((averageRating / 5) * 100).toFixed(0)}% CSAT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Feedbacks */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900">
                  Recent Feedbacks
                </h3>
                <Globe className="text-gray-300 w-5 h-5" />
              </div>
              <div className="divide-y divide-gray-50">
                {filteredRatings.length > 0 ? (
                  filteredRatings.slice(0, 10).map((r) => (
                    <div
                      key={r.id}
                      className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-[#5247bf] font-black border border-indigo-100">
                          {r.rating}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-[#5247bf]" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {r.location?.city}, {r.location?.state}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 mt-1">
                            {r.comment || "Customer left no comment."}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase">
                        {r.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center text-gray-400 italic">
                    No feedback received for this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* High-Res QR Code Export Section */}
        <div className="mt-12 bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm text-center">
          <h3 className="text-2xl font-black text-gray-900 mb-2">
            Export Your QR Code
          </h3>
          <p className="text-gray-500 mb-10 max-w-lg mx-auto font-medium">
            Save your QR code as a high-quality PNG. Use it in digital receipts,
            printed posters, or social media.
          </p>

          <div className="flex flex-col items-center">
            <div
              ref={qrRef}
              className="p-10 bg-white shadow-2xl rounded-[2.5rem] border border-gray-50 mb-8"
            >
              <QRCode value={publicLink} size={250} fgColor="#5247bf" />
            </div>

            <button
              onClick={downloadQRCode}
              className="bg-[#5247bf] text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-[#4238a6] transition-all flex items-center gap-3 shadow-xl shadow-indigo-100"
            >
              <Download className="w-6 h-6" /> Save QR Code as Image
            </button>
            <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              PNG Format • 1000 x 1000 High Resolution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSatisfaction;

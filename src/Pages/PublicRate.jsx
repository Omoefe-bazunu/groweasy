import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Star, MapPin, Send, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

const PublicRate = () => {
  const { businessId } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [location, setLocation] = useState({
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        setLocation({
          city: data.city || "Lagos",
          state: data.region || "Lagos",
          country: data.country_name || "Nigeria",
        });
      })
      .catch(() => console.log("Location fetch error"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.warning("Please select stars.");

    setLoading(true);
    try {
      await addDoc(collection(db, "customer_ratings"), {
        businessId,
        rating,
        comment,
        location,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (error) {
      toast.error("Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#5247bf] p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-gray-900">Submitted!</h1>
          <p className="text-gray-500 mt-2">Thanks for helping us grow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#5247bf] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8">
        <h1 className="text-3xl font-black text-gray-900 text-center mb-2">
          Rate Us
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          Your feedback matters to us.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8 text-gray-700">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)}>
                <Star
                  className={`w-12 h-12 transition-all ${star <= rating ? "text-yellow-400 fill-yellow-400 scale-110" : "text-gray-200"}`}
                />
              </button>
            ))}
          </div>

          <textarea
            placeholder="Tell us about your experience..."
            className="w-full p-6 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-[#5247bf] h-32 resize-none font-medium"
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex items-center gap-2 text-gray-400 justify-center">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {location.city}, {location.state}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#5247bf] text-white font-black rounded-3xl shadow-xl hover:bg-[#4238a6] transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : "Submit Rating"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicRate;

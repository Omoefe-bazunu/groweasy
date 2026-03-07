"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Star, Edit, Trash, Quote, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editTestimonial, setEditTestimonial] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editUserName, setEditUserName] = useState("");

  const userTestimonial = useMemo(
    () => testimonials.find((t) => t.userId === user?.uid),
    [testimonials, user],
  );

  // Auth listener (SSR Safe)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) setUserName(currentUser.displayName);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await api.get("/testimonials");
      setTestimonials(res.data.testimonials);
    } catch (err) {
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to submit a testimonial.");
    if (rating < 1) return toast.warning("Please select a star rating.");
    if (!comment.trim()) return toast.warning("Please enter a comment.");

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "testimonials"), {
        userId: user.uid,
        userName: userName.trim() || "Anonymous",
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      const newTestimonial = {
        id: docRef.id,
        userId: user.uid,
        userName: userName.trim() || "Anonymous",
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      setTestimonials((prev) => [newTestimonial, ...prev]);
      toast.success("Thank you for your feedback!");
      setRating(0);
      setComment("");
    } catch (err) {
      toast.error("Failed to submit testimonial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (testimonial) => {
    setEditTestimonial(testimonial);
    setEditRating(testimonial.rating);
    setEditComment(testimonial.comment);
    setEditUserName(testimonial.userName);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "testimonials", editTestimonial.id), {
        userName: editUserName.trim(),
        rating: editRating,
        comment: editComment,
      });

      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === editTestimonial.id
            ? {
                ...t,
                userName: editUserName.trim(),
                rating: editRating,
                comment: editComment,
              }
            : t,
        ),
      );

      toast.success("Testimonial updated!");
      setEditTestimonial(null);
    } catch (err) {
      toast.error("Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (testimonialId) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await deleteDoc(doc(db, "testimonials", testimonialId));
      setTestimonials((prev) => prev.filter((t) => t.id !== testimonialId));
      toast.success("Testimonial removed.");
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12 text-gray-700">
      <div className="bg-[#5247bf] rounded-[2.5rem] p-10 mb-10 max-w-7xl mx-auto shadow-xl text-center text-white">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">
          GrowEasy Reviews
        </h1>
        <p className="font-bold opacity-80">
          Real stories from businesses growing with GrowEasy.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Testimonials list */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-[#5247bf] w-10 h-10" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="p-8 border border-gray-100 rounded-[2rem] shadow-sm bg-white relative group"
                >
                  <Quote className="text-indigo-50 absolute top-4 right-4 w-12 h-12" />
                  <div className="relative z-10">
                    <p className="text-gray-900 font-black uppercase text-sm tracking-tight">
                      {testimonial.userName}
                    </p>
                    <div className="flex mt-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm italic font-medium">
                      &quot;{testimonial.comment}&quot;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Action form */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-24">
            {userTestimonial ? (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-4 border-green-50 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                  Shared!
                </h2>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                  You have shared your experience. Need to make a change?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleEditClick(userTestimonial)}
                    className="flex-1 py-4 rounded-2xl bg-indigo-50 text-[#5247bf] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(userTestimonial.id)}
                    className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                  >
                    <Trash className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 text-gray-900">
                  Share Your Story
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5247bf] font-bold"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                  <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-2xl justify-center">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                      >
                        <Star
                          className={`w-8 h-8 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows="4"
                    placeholder="How has GrowEasy helped your business?"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5247bf] font-medium resize-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest bg-[#5247bf] hover:bg-[#4238a6] disabled:opacity-50 shadow-xl"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Post Review"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editTestimonial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-8">
              Update Review
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <input
                type="text"
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
              <div className="flex space-x-2 bg-gray-50 p-4 rounded-2xl justify-center">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditRating(i + 1)}
                  >
                    <Star
                      className={`w-8 h-8 ${i < editRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                rows="4"
                className="w-full p-4 bg-gray-50 rounded-2xl font-medium"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl text-white font-black uppercase tracking-widest bg-[#5247bf] hover:bg-[#4238a6]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTestimonial(null)}
                  className="flex-1 py-4 rounded-2xl text-gray-400 font-black uppercase tracking-widest bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaStar,
  FaEdit,
  FaTrash,
  FaQuoteLeft,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify"; // Import toast for notifications

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state
  const [editTestimonial, setEditTestimonial] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editUserName, setEditUserName] = useState("");

  // Check if current user has already submitted a testimonial
  const userTestimonial = testimonials.find((t) => t.userId === user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) setUserName(currentUser.displayName);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "testimonials"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testimonialsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTestimonials(testimonialsData);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to submit a testimonial.");
    if (rating < 1) return toast.warning("Please select a star rating.");
    if (!comment.trim()) return toast.warning("Please enter a comment.");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "testimonials"), {
        userId: user.uid,
        userName: userName.trim() || "Anonymous",
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      toast.success("Thank you for your feedback!");
      setRating(0);
      setComment("");
    } catch (err) {
      toast.error("Failed to submit testimonial.");
      console.error(err);
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
      const testimonialRef = doc(db, "testimonials", editTestimonial.id);
      await updateDoc(testimonialRef, {
        userName: editUserName.trim(),
        rating: editRating,
        comment: editComment,
      });
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
      toast.success("Testimonial removed.");
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12">
      <div className="bg-[#5247bf] rounded-2xl p-8 mb-10 max-w-7xl mx-auto shadow-xl text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
          GrowEasy Reviews
        </h1>
        <p className="text-indigo-100 opacity-80">
          Real stories from businesses growing with GrowEasy.
        </p>
      </div>

      <div className="max-w-7xl mx-auto  grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Testimonials List */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="p-6 border border-gray-100 rounded-2xl shadow-sm bg-white relative hover:shadow-md transition-all group"
              >
                <FaQuoteLeft className="text-indigo-50 absolute top-4 right-4 w-10 h-10 -z-0" />
                <div className="relative z-10">
                  <p className="text-gray-900 font-bold text-lg">
                    {testimonial.userName}
                  </p>
                  <div className="flex mt-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic">
                    "{testimonial.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Sticky Form or Status Card */}
        <div className="lg:col-span-5 xl:col-span-4 text-gray-700 order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            {userTestimonial ? (
              /* If User Already Submitted */
              <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-green-50 text-center">
                <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  Review Submitted!
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  You've already shared your experience. You can update or
                  remove your post below.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditClick(userTestimonial)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(userTestimonial.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ) : (
              /* Create Testimonial Form */
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-6">
                  Share Your Experience
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5247bf]"
                    placeholder="Your Name"
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
                        <FaStar
                          className={`w-8 h-8 ${i < rating ? "text-yellow-400" : "text-gray-200"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#5247bf]"
                    rows="4"
                    placeholder="Your feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl text-white font-bold bg-[#5247bf] hover:bg-[#4238a6] disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? "Submitting..." : "Post Testimonial"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (used for updates) */}
      {editTestimonial && (
        <div className="fixed inset-0 text-gray-700 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Update Review
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input
                type="text"
                className="w-full p-4 bg-gray-50 rounded-2xl"
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
                    <FaStar
                      className={`w-7 h-7 ${i < editRating ? "text-yellow-400" : "text-gray-200"}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full p-4 bg-gray-50 rounded-2xl"
                rows="4"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl text-white font-bold bg-[#5247bf]"
                >
                  {isSubmitting ? "Updating..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTestimonial(null)}
                  className="flex-1 py-4 rounded-2xl text-gray-500 font-bold bg-gray-100"
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

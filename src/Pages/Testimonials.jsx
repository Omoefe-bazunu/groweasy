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
import { FaStar, FaEdit, FaTrash } from "react-icons/fa";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editTestimonial, setEditTestimonial] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editUserName, setEditUserName] = useState("");

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.displayName) {
        setUserName(currentUser.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch testimonials from Firestore in order of latest to earliest date
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

  // Handle new testimonial submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to submit a testimonial.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter a comment.");
      return;
    }
    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      await addDoc(collection(db, "testimonials"), {
        userId: user.uid,
        userName: userName.trim(),
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      setSuccess("Thank you for your testimonial!");
      setRating(0);
      setComment("");
      setUserName(user.displayName || "");
      setError("");
    } catch (err) {
      setError("Failed to submit testimonial. Please try again.");
      console.error("Error submitting testimonial:", err);
    }
  };

  // Handle edit button click
  const handleEditClick = (testimonial) => {
    setEditTestimonial(testimonial);
    setEditRating(testimonial.rating);
    setEditComment(testimonial.comment);
    setEditUserName(testimonial.userName);
  };

  // Handle edit submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editRating < 1 || editRating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!editComment.trim()) {
      setError("Please enter a comment.");
      return;
    }
    if (!editUserName.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      const testimonialRef = doc(db, "testimonials", editTestimonial.id);
      await updateDoc(testimonialRef, {
        userName: editUserName.trim(),
        rating: editRating,
        comment: editComment,
      });
      setSuccess("Testimonial updated successfully!");
      setEditTestimonial(null);
      setEditRating(0);
      setEditComment("");
      setEditUserName("");
      setError("");
    } catch (err) {
      setError("Failed to update testimonial. Please try again.");
      console.error("Error updating testimonial:", err);
    }
  };

  // Handle delete
  const handleDelete = async (testimonialId) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const testimonialRef = doc(db, "testimonials", testimonialId);
      await deleteDoc(testimonialRef);
      setSuccess("Testimonial deleted successfully!");
      setError("");
    } catch (err) {
      setError("Failed to delete testimonial. Please try again.");
      console.error("Error deleting testimonial:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-6 pt-10 space-y-8 pb-25">
      <h1 className="text-4xl font-extrabold text-center text-[#5247bf]">
        Testimonials
      </h1>

      {/* Display Error or Success Messages */}
      {error && (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      )}
      {success && (
        <div className="text-center">
          <p className="text-green-500 mb-4">{success}</p>
        </div>
      )}

      {/* Testimonials List */}
      <div className="space-y-6">
        {testimonials.length > 0 ? (
          testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-4 border rounded-xl shadow-md bg-white relative"
            >
              <div className="flex flex-col space-x-2 mb-2">
                <p className="text-gray-700 font-medium">
                  {testimonial.userName}
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600">{testimonial.comment}</p>
              <p className="text-sm text-gray-500 mt-2">
                {testimonial.createdAt?.toDate().toLocaleDateString()}
              </p>
              {/* Edit and Delete Buttons (only for the testimonial owner) */}
              {user && user.uid === testimonial.userId && (
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleEditClick(testimonial)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Edit"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            No testimonials yet. Be the first to share your experience!
          </p>
        )}
      </div>

      {/* Edit Testimonial Modal */}
      {editTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Edit Testimonial
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-gray-700 font-medium block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <FaStar
                      className={`w-6 h-6 ${
                        i < editRating ? "text-yellow-400" : "text-gray-300"
                      } hover:text-yellow-400 transition-all duration-200`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
                rows="4"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-white bg-[#5247bf] hover:bg-[#4238a6] transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditTestimonial(null)}
                  className="flex-1 py-3 rounded-xl text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Testimonial Form */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Share Your Experience
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-700 font-medium block mb-1">
              Your Name
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                className="focus:outline-none"
              >
                <FaStar
                  className={`w-6 h-6 ${
                    i < rating ? "text-yellow-400" : "text-gray-300"
                  } hover:text-yellow-400 transition-all duration-200`}
                />
              </button>
            ))}
          </div>
          <textarea
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5247bf] text-gray-600"
            rows="4"
            placeholder="Write your testimonial here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white bg-[#5247bf] hover:bg-[#4238a6] transition-all duration-200"
          >
            Submit Testimonial
          </button>
        </form>
      </div>
    </div>
  );
}

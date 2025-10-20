import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({
    subscriptions: true,
  });

  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email === "raniem57@gmail.com") {
          setIsAdmin(true);

          // Fetch subscription requests
          const requestsQuery = query(collection(db, "subscriptionRequests"));
          onSnapshot(requestsQuery, (snapshot) => {
            const requestsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setRequests(requestsData);
          });
        } else {
          navigate("/");
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleApprove = async (request) => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userDocRef = doc(db, "users", request.userId);
      const requestDocRef = doc(db, "subscriptionRequests", request.id);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      // Calculate expiry date based on months purchased
      const activationDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (request.months || 1));

      await updateDoc(userDocRef, {
        subscription: {
          status: "active",
          plan: "Premium",
          activationDate: activationDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          monthsPurchased: request.months || 1,
          totalAmountPaid: request.totalAmount,
          lastRenewalDate: activationDate.toISOString(),
        },
      });

      await deleteDoc(requestDocRef);

      setSuccess(
        `Approved ${request.userName}'s subscription for ${request.months} month(s). Total: ₦${request.totalAmount.toLocaleString()}`
      );
    } catch (err) {
      setError("Failed to approve subscription: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (request) => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userDocRef = doc(db, "users", request.userId);
      const requestDocRef = doc(db, "subscriptionRequests", request.id);

      // Return user to trial status
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      await updateDoc(userDocRef, {
        subscription: {
          status: "trial",
          plan: "Free Trial",
          trialEndDate: trialEndDate.toISOString(),
        },
      });

      await deleteDoc(requestDocRef);

      setSuccess(`Rejected ${request.userName}'s subscription request.`);
    } catch (err) {
      setError("Failed to process rejection: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div>Access Denied</div>;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-6 py-10 space-y-8 mb-12 text-gray-600">
      <h1 className="text-3xl font-bold text-center text-blue-600">
        Admin Dashboard
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Subscription Requests Section */}
      <div className="bg-white rounded-xl shadow-md">
        <button
          onClick={() => toggleSection("subscriptions")}
          className="w-full flex justify-between items-center p-4 text-lg font-semibold text-blue-600"
        >
          <span>
            Subscription Requests (
            {requests.filter((r) => r.status === "pending").length})
          </span>
          {sections.subscriptions ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </button>
        {sections.subscriptions && (
          <div className="p-4 space-y-6 border-t">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg bg-gray-50 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">User</p>
                      <p className="font-semibold text-gray-900">
                        {request.userName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">
                        {request.userEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Months</p>
                      <p className="font-semibold text-gray-900">
                        {request.months}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-900">
                        ₦{request.totalAmount?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Payment Screenshot
                    </p>
                    <a
                      href={request.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Screenshot
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Status</p>
                    <p
                      className={`font-semibold ${request.status === "pending" ? "text-yellow-600" : "text-gray-600"}`}
                    >
                      {request.status}
                    </p>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleApprove(request)}
                        className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 font-medium"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 font-medium"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No subscription requests.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

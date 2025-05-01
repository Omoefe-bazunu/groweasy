import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  increment,
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
  const [contacts, setContacts] = useState([]);
  const [experts, setExperts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingExpert, setEditingExpert] = useState(null);
  const [updatedExpertData, setUpdatedExpertData] = useState({});
  const [sections, setSections] = useState({
    subscriptions: true,
    contacts: true,
    experts: true,
  });

  // Toggle section visibility
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

          // Fetch contact messages
          const contactsQuery = query(collection(db, "contacts"));
          onSnapshot(contactsQuery, (snapshot) => {
            const contactsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setContacts(contactsData);
          });

          // Fetch experts data
          const expertsQuery = query(collection(db, "experts"));
          onSnapshot(expertsQuery, (snapshot) => {
            const expertsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setExperts(expertsData);
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

  const planPrices = {
    Growth: 10.71,
    Enterprise: 17.86,
  };

  // Subscription request handlers
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

      const userData = userSnap.data();
      const referrerId = userData.referredBy;

      const amount = planPrices[request.plan] || 0;

      if (referrerId && amount > 0) {
        const referrerDocRef = doc(db, "users", referrerId);
        await updateDoc(referrerDocRef, {
          earnings: increment(amount * 0.2),
        });

        const referrerSnap = await getDoc(referrerDocRef);
        const referrerData = referrerSnap.data();
        const uplineId = referrerData.referredBy;

        if (uplineId) {
          const uplineDocRef = doc(db, "users", uplineId);
          await updateDoc(uplineDocRef, {
            downlineEarnings: increment(amount * 0.05),
          });
        }
      }

      await updateDoc(userDocRef, {
        subscription: {
          plan: request.plan,
          status: "active",
          startDate: serverTimestamp(),
          imageAttempts: 0,
          contentPlanAttempts: 0,
          videoAttempts: 0,
        },
      });

      await deleteDoc(requestDocRef);

      setSuccess(
        `Approved ${request.userName}'s subscription and paid affiliate commissions.`
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

      await updateDoc(userDocRef, {
        "subscription.plan": "Free",
        "subscription.status": "active",
      });

      await deleteDoc(requestDocRef);

      setSuccess(`Rejected ${request.userName}'s subscription request.`);
    } catch (err) {
      setError("Failed to process rejection: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Contact message handler
  const handleDeleteContact = async (contactId) => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const contactDocRef = doc(db, "contacts", contactId);
      await deleteDoc(contactDocRef);
      setSuccess("Contact message deleted successfully.");
    } catch (err) {
      setError("Failed to delete contact message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Expert handlers
  const handleDeleteExpert = async (expertId) => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const expertDocRef = doc(db, "experts", expertId);
      await deleteDoc(expertDocRef);
      setSuccess("Expert deleted successfully.");
    } catch (err) {
      setError("Failed to delete expert: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpert = (expert) => {
    setEditingExpert(expert.id);
    setUpdatedExpertData({
      name: expert.name,
      expertise: expert.expertise,
      bio: expert.bio,
      image: expert.image,
    });
  };

  const handleSaveExpert = async (expertId) => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const expertDocRef = doc(db, "experts", expertId);
      await updateDoc(expertDocRef, updatedExpertData);
      setEditingExpert(null);
      setUpdatedExpertData({});
      setSuccess("Expert updated successfully.");
    } catch (err) {
      setError("Failed to update expert: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div>Access Denied</div>;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-6 py-10 space-y-8 mb-12 text-gray-500">
      <h1 className="text-3xl font-bold text-center text-[#5247bf]">
        Admin Dashboard
      </h1>

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

      {/* Add Experts */}
      <Link to="add-expert">
        <div className="w-full flex justify-between items-center p-4 text-lg font-semibold rounded-xl shadow-md text-[#5247bf] bg-white">
          Add Experts
        </div>
      </Link>

      {/* Subscription Requests Section */}
      <div className="bg-white rounded-xl shadow-md">
        <button
          onClick={() => toggleSection("subscriptions")}
          className="w-full flex justify-between items-center p-4 text-lg font-semibold text-[#5247bf]"
        >
          <span>Subscription Requests</span>
          {sections.subscriptions ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </button>
        {sections.subscriptions && (
          <div className="p-4 space-y-6">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-xl shadow-sm bg-gray-50 text-gray-500"
                >
                  <p>
                    <strong>User:</strong> {request.userName}
                  </p>
                  <p>
                    <strong>Email:</strong> {request.userEmail}
                  </p>
                  <p>
                    <strong>Plan:</strong> {request.plan}
                  </p>
                  <p>
                    <strong>Status:</strong> {request.status}
                  </p>
                  <p>
                    <strong>Screenshot:</strong>{" "}
                    <a
                      href={request.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  </p>
                  {request.status === "pending" && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleApprove(request)}
                        className="py-2 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-400"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-gray-400"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                No pending subscription requests.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contact Messages Section */}
      <div className="bg-white rounded-xl shadow-md">
        <button
          onClick={() => toggleSection("contacts")}
          className="w-full flex justify-between items-center p-4 text-lg font-semibold text-[#5247bf]"
        >
          <span>Contact Messages</span>
          {sections.contacts ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </button>
        {sections.contacts && (
          <div className="p-4 space-y-6">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 border rounded-xl shadow-sm bg-gray-50"
                >
                  <p>
                    <strong>Name:</strong> {contact.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {contact.email}
                  </p>
                  <p>
                    <strong>Message:</strong> {contact.message}
                  </p>
                  <p>
                    <strong>Sent At:</strong> {contact.createdAt}
                  </p>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="mt-2 py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-gray-400"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Delete"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                No contact messages available.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Experts Management Section */}
      <div className="bg-white rounded-xl shadow-md">
        <button
          onClick={() => toggleSection("experts")}
          className="w-full flex justify-between items-center p-4 text-lg font-semibold text-[#5247bf]"
        >
          <span>Experts Management</span>
          {sections.experts ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <ChevronDown className="w-6 h-6" />
          )}
        </button>
        {sections.experts && (
          <div className="p-4 space-y-6">
            {experts.length > 0 ? (
              experts.map((expert) => (
                <div
                  key={expert.id}
                  className="p-4 border rounded-xl shadow-sm bg-gray-50"
                >
                  {editingExpert === expert.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={updatedExpertData.name || ""}
                          onChange={(e) =>
                            setUpdatedExpertData({
                              ...updatedExpertData,
                              name: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-xl text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">
                          Expertise
                        </label>
                        <input
                          type="text"
                          value={updatedExpertData.expertise || ""}
                          onChange={(e) =>
                            setUpdatedExpertData({
                              ...updatedExpertData,
                              expertise: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-xl text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">
                          Bio
                        </label>
                        <textarea
                          value={updatedExpertData.bio || ""}
                          onChange={(e) =>
                            setUpdatedExpertData({
                              ...updatedExpertData,
                              bio: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-xl text-gray-600"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={updatedExpertData.image || ""}
                          onChange={(e) =>
                            setUpdatedExpertData({
                              ...updatedExpertData,
                              image: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-xl text-gray-600"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveExpert(expert.id)}
                          className="py-2 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-400"
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingExpert(null)}
                          className="py-2 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:bg-gray-400"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>
                        <strong>Name:</strong> {expert.name}
                      </p>
                      <p>
                        <strong>Expertise:</strong> {expert.expertise}
                      </p>
                      <p>
                        <strong>Bio:</strong> {expert.bio}
                      </p>
                      {expert.image && (
                        <p>
                          <strong>Image:</strong>{" "}
                          <a
                            href={expert.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View
                          </a>
                        </p>
                      )}
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleUpdateExpert(expert)}
                          className="py-2 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-400"
                          disabled={loading}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteExpert(expert.id)}
                          className="py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-gray-400"
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No experts available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { auth, db } from "../lib/firebase";
// import {
//   collection,
//   query,
//   onSnapshot,
//   doc,
//   deleteDoc,
//   updateDoc,
//   serverTimestamp,
//   getDoc,
//   increment,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { ChevronDown, ChevronUp } from "lucide-react";

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [requests, setRequests] = useState([]);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//         if (currentUser.email === "raniem57@gmail.com") {
//           setIsAdmin(true);

//           const requestsQuery = query(collection(db, "subscriptionRequests"));
//           onSnapshot(requestsQuery, (snapshot) => {
//             const requestsData = snapshot.docs.map((doc) => ({
//               id: doc.id,
//               ...doc.data(),
//             }));
//             setRequests(requestsData);
//           });
//         } else {
//           navigate("/");
//         }
//       } else {
//         navigate("/login");
//       }
//     });
//     return () => unsubscribe();
//   }, [navigate]);

//   const planPrices = {
//     Growth: 10.71,
//     Enterprise: 17.86,
//   };

//   const handleApprove = async (request) => {
//     if (loading) return;
//     setLoading(true);
//     setError("");
//     setSuccess("");

//     try {
//       const userDocRef = doc(db, "users", request.userId);
//       const requestDocRef = doc(db, "subscriptionRequests", request.id);
//       const userSnap = await getDoc(userDocRef);

//       if (!userSnap.exists()) {
//         throw new Error("User not found");
//       }

//       const userData = userSnap.data();
//       const referrerId = userData.referredBy;

//       const amount = planPrices[request.plan] || 0;

//       if (referrerId && amount > 0) {
//         const referrerDocRef = doc(db, "users", referrerId);
//         await updateDoc(referrerDocRef, {
//           earnings: increment(amount * 0.2),
//         });

//         const referrerSnap = await getDoc(referrerDocRef);
//         const referrerData = referrerSnap.data();
//         const uplineId = referrerData.referredBy;

//         if (uplineId) {
//           const uplineDocRef = doc(db, "users", uplineId);
//           await updateDoc(uplineDocRef, {
//             downlineEarnings: increment(amount * 0.005),
//           });
//         }
//       }

//       await updateDoc(userDocRef, {
//         subscription: {
//           plan: request.plan,
//           status: "active",
//           startDate: serverTimestamp(),
//           imageAttempts: 0,
//           contentPlanAttempts: 0,
//           videoAttempts: 0,
//         },
//       });

//       await deleteDoc(requestDocRef);

//       setSuccess(
//         `Approved ${request.userName}'s subscription and paid affiliate commissions.`
//       );
//     } catch (err) {
//       console.error(err);
//       setError("Failed to approve subscription: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReject = async (request) => {
//     if (loading) return;
//     setLoading(true);
//     setError("");
//     setSuccess("");

//     try {
//       const userDocRef = doc(db, "users", request.userId);
//       const requestDocRef = doc(db, "subscriptionRequests", request.id);

//       await updateDoc(userDocRef, {
//         "subscription.plan": "Free",
//         "subscription.status": "active",
//       });

//       await deleteDoc(requestDocRef);

//       setSuccess(`Rejected ${request.userName}'s subscription request.`);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to process rejection: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isAdmin) return <div>Access Denied</div>;

//   return (
//     <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-6 py-10">
//       <h1 className="text-3xl font-bold text-center text-[#5247bf]">
//         Admin Dashboard
//       </h1>

//       {error && <p className="text-red-500 text-center">{error}</p>}
//       {success && <p className="text-green-500 text-center">{success}</p>}

//       <div className="bg-white rounded-xl shadow-md mt-8">
//         <h2 className="p-4 text-xl font-semibold text-[#5247bf]">
//           Subscription Requests
//         </h2>
//         <div className="p-4 space-y-4">
//           {requests.length > 0 ? (
//             requests.map((req) => (
//               <div key={req.id} className="p-4 border rounded-xl">
//                 <p>
//                   <strong>Name:</strong> {req.userName}
//                 </p>
//                 <p>
//                   <strong>Email:</strong> {req.userEmail}
//                 </p>
//                 <p>
//                   <strong>Plan:</strong> {req.plan}
//                 </p>
//                 <p>
//                   <strong>Status:</strong> {req.status}
//                 </p>
//                 <div className="flex gap-4 mt-4">
//                   <button
//                     onClick={() => handleApprove(req)}
//                     className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
//                     disabled={loading}
//                   >
//                     Approve
//                   </button>
//                   <button
//                     onClick={() => handleReject(req)}
//                     className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
//                     disabled={loading}
//                   >
//                     Reject
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p className="text-center text-gray-500">
//               No pending subscription requests.
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

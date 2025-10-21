import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Receipt,
  FileText,
  List,
  X,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [users, setUsers] = useState([]);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalFinancialRecords, setTotalFinancialRecords] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({
    users: true,
    metrics: false,
  });

  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setModalError("");
    setLoading(true);

    try {
      const adminDocRef = doc(db, "admin", "adminAccess");
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
        setModalError("Admin credentials not found");
        setLoading(false);
        return;
      }

      const adminData = adminDoc.data();
      if (
        adminEmail === adminData.email &&
        adminPassword === adminData.password
      ) {
        setIsAdmin(true);
        setShowModal(false);
      } else {
        setModalError("Invalid admin email or password");
      }
    } catch (err) {
      setModalError("Failed to verify credentials: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch users
    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    // Fetch counts for receipts, invoices, financial records, and tasks
    const fetchCounts = async () => {
      try {
        const receiptsSnap = await getDocs(collection(db, "receipts"));
        setTotalReceipts(receiptsSnap.size);

        const invoicesSnap = await getDocs(collection(db, "invoices"));
        setTotalInvoices(invoicesSnap.size);

        const financialRecordsSnap = await getDocs(
          collection(db, "financialRecords")
        );
        setTotalFinancialRecords(financialRecordsSnap.size);

        const tasksSnap = await getDocs(collection(db, "tasks"));
        setTotalTasks(tasksSnap.size);
      } catch (err) {
        setError("Failed to fetch metrics: " + err.message);
      }
    };
    fetchCounts();

    return () => unsubscribe();
  }, [isAdmin]);

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto px-6 py-10 space-y-8 mb-12 text-gray-600">
      {/* Admin Login Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Admin Access
              </h2>
              <button
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter admin email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              {modalError && (
                <p className="text-red-600 text-sm">{modalError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Credentials"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {isAdmin && (
        <>
          <h1 className="text-3xl font-bold text-center text-blue-600">
            Admin Dashboard
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Metrics Overview Section */}
          <div className="bg-white rounded-xl shadow-md">
            <button
              onClick={() => toggleSection("metrics")}
              className="w-full flex justify-between items-center p-4 text-lg font-semibold text-blue-600"
            >
              <span>Platform Metrics</span>
              {sections.metrics ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>
            {sections.metrics && (
              <div className="p-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-xl font-bold text-gray-900">
                      {users.length}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <Receipt className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Receipts</p>
                    <p className="text-xl font-bold text-gray-900">
                      {totalReceipts}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-xl font-bold text-gray-900">
                      {totalInvoices}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <List className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-xl font-bold text-gray-900">
                      {totalTasks}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Users Section */}
          <div className="bg-white rounded-xl shadow-md">
            <button
              onClick={() => toggleSection("users")}
              className="w-full flex justify-between items-center p-4 text-lg font-semibold text-blue-600"
            >
              <span>Users ({users.length})</span>
              {sections.users ? (
                <ChevronUp className="w-6 h-6" />
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </button>
            {sections.users && (
              <div className="p-4 border-t">
                {users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-sm font-semibold text-gray-600">
                            Name
                          </th>
                          <th className="p-3 text-sm font-semibold text-gray-600">
                            Email
                          </th>
                          <th className="p-3 text-sm font-semibold text-gray-600">
                            Phone Number
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-t">
                            <td className="p-3 text-sm text-gray-900">
                              {user.name || "N/A"}
                            </td>
                            <td className="p-3 text-sm text-gray-900">
                              {user.email || "N/A"}
                            </td>
                            <td className="p-3 text-sm text-gray-900">
                              {user.phoneNumber || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No users found.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";

const TaskAnalytics = () => {
  const { user } = useUser();
  const [period, setPeriod] = useState("week");
  const [stats, setStats] = useState({ created: 0, completed: 0, rate: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, period]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (period === "week") start.setDate(start.getDate() - 7);
    else if (period === "month") start.setMonth(start.getMonth() - 1);
    else if (period === "year") start.setFullYear(start.getFullYear() - 1);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid),
        where("date", ">=", start),
        where("date", "<=", end)
      );
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map((doc) => doc.data());
      const created = tasks.length;
      const completed = tasks.filter((t) => t.completed).length;
      const rate = created ? (completed / created) * 100 : 0;
      setStats({ created, completed, rate });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 font-medium">
        Loading analytics...
      </div>
    );

  return (
    <div className="max-w-2xl hidden mx-auto mt-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Task Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="year">Past Year</option>
        </select>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
          <h2 className="text-lg font-semibold text-blue-700 mb-1">
            Tasks Created
          </h2>
          <p className="text-3xl font-bold text-blue-900">{stats.created}</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
          <h2 className="text-lg font-semibold text-green-700 mb-1">
            Tasks Completed
          </h2>
          <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
          <h2 className="text-lg font-semibold text-purple-700 mb-1">
            Success Rate
          </h2>
          <p className="text-3xl font-bold text-purple-900">
            {stats.rate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
          <span>Completion Progress</span>
          <span>{stats.rate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${stats.rate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics;

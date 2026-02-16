import { useState, useEffect, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import {
  Loader2,
  Flame,
  CheckCircle,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import api from "../lib/api";

const TaskAnalytics = () => {
  const { user } = useUser();
  const [period, setPeriod] = useState("week");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks/stats?period=${period}`);
      setStats(res.data);
    } catch (err) {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Build an ordered array of dates from byDate for the chart
  const chartDays = stats?.byDate
    ? Object.entries(stats.byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14) // max 14 bars
    : [];

  const maxCreated = Math.max(...chartDays.map(([, v]) => v.created), 1);

  return (
    <div className="max-w-2xl mx-auto mt-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Task Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="week">Past 7 Days</option>
          <option value="month">Past Month</option>
          <option value="year">Past Year</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading analytics...
        </div>
      ) : !stats ? null : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <ListTodo className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-900">
                {stats.created}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-0.5">
                Created
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-900">
                {stats.completed}
              </p>
              <p className="text-xs text-green-600 font-medium mt-0.5">
                Completed
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-900">
                {stats.rate.toFixed(0)}%
              </p>
              <p className="text-xs text-purple-600 font-medium mt-0.5">
                Success Rate
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-900">
                {stats.streak}
              </p>
              <p className="text-xs text-orange-600 font-medium mt-0.5">
                Day Streak
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
              <span>Completion Rate</span>
              <span>{stats.rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
          </div>

          {/* Daily chart */}
          {chartDays.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Daily Activity
              </p>
              <div className="flex items-end gap-1.5 h-24">
                {chartDays.map(([date, val]) => (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center gap-0.5 group relative"
                  >
                    {/* Completed bar (overlay) */}
                    <div
                      className="w-full relative flex flex-col justify-end"
                      style={{ height: `${(val.created / maxCreated) * 80}px` }}
                    >
                      <div
                        className="w-full bg-blue-200 rounded-t overflow-hidden absolute bottom-0"
                        style={{ height: "100%" }}
                      />
                      <div
                        className="w-full bg-blue-600 rounded-t absolute bottom-0"
                        style={{
                          height: `${val.created ? (val.completed / val.created) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {date}: {val.completed}/{val.created}
                    </div>
                    {/* Date label */}
                    <span className="text-[9px] text-gray-400 mt-1 font-mono">
                      {date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-3 h-3 bg-blue-200 rounded" /> Created
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-3 h-3 bg-blue-600 rounded" /> Completed
                </div>
              </div>
            </div>
          )}

          {chartDays.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No task data for this period yet.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskAnalytics;

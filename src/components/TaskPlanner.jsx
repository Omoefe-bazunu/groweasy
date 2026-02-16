import { useState, useEffect, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Save,
  X,
  Loader2,
  Flag,
} from "lucide-react";
import api from "../lib/api";

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
};

const TaskPlanner = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingOrder, setEditingOrder] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTask, setNewTask] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks?date=${date}`);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    setExpandedIds(new Set());
    fetchTasks();
  }, [fetchTasks]);

  // ── Add ───────────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    const optimisticTask = {
      id: `temp-${Date.now()}`,
      text: newTask.trim(),
      date,
      order: parseInt(newOrder) || tasks.length,
      priority: newPriority,
      completed: false,
    };
    setTasks((prev) =>
      [...prev, optimisticTask].sort((a, b) => a.order - b.order),
    );
    const text = newTask;
    setNewTask("");
    setNewOrder("");

    try {
      const res = await api.post("/tasks", {
        text: optimisticTask.text,
        date,
        order: optimisticTask.order,
        priority: newPriority,
      });
      // Replace temp id with real one
      setTasks((prev) =>
        prev.map((t) =>
          t.id === optimisticTask.id ? { ...t, id: res.data.id } : t,
        ),
      );
      toast.success("Task added");
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticTask.id));
      setNewTask(text);
      toast.error("Failed to add task");
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask();
  };

  // ── Toggle complete ────────────────────────────────────────────────────────
  const toggleComplete = async (task) => {
    setTogglingId(task.id);
    const newVal = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newVal } : t)),
    );
    try {
      await api.patch(`/tasks/${task.id}`, { completed: newVal });
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !newVal } : t)),
      );
      toast.error("Failed to update task");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const updateTask = async () => {
    if (!editingText.trim() || !editingTask) return;
    setSavingId(editingTask.id);
    const prev = { ...editingTask };
    const updates = {
      text: editingText.trim(),
      order: parseInt(editingOrder) || editingTask.order,
      priority: editingPriority,
    };
    setTasks((prevTasks) =>
      prevTasks
        .map((t) => (t.id === editingTask.id ? { ...t, ...updates } : t))
        .sort((a, b) => a.order - b.order),
    );
    setEditingTask(null);
    try {
      await api.patch(`/tasks/${prev.id}`, updates);
      toast.success("Task updated");
    } catch (err) {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === prev.id ? prev : t)),
      );
      setEditingTask(prev);
      toast.error("Failed to update task");
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete task?")) return;
    setDeletingId(taskId);
    const backup = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
    } catch (err) {
      setTasks((prev) => [...prev, backup].sort((a, b) => a.order - b.order));
      toast.error("Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  const completed = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? (completed / tasks.length) * 100 : 0;
  const highPending = tasks.filter(
    (t) => t.priority === "high" && !t.completed,
  ).length;

  return (
    <div className="max-w-2xl mx-auto p-6 mt-4 bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Task Planner</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <p className="text-sm text-gray-400 mb-5">
        {new Date(date + "T12:00:00").toDateString()}
      </p>

      {/* Summary pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
          {tasks.length} tasks
        </span>
        <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
          {completed} done
        </span>
        {highPending > 0 && (
          <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <Flag className="w-3 h-3" /> {highPending} high priority
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add task row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New task... (Enter to add)"
          className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        />
        <input
          type="number"
          value={newOrder}
          onChange={(e) => setNewOrder(e.target.value)}
          placeholder="Order"
          min="0"
          className="w-20 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <button
          onClick={addTask}
          disabled={adding || !newTask.trim()}
          className="flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center items-center h-24 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No tasks for this day</p>
          <p className="text-sm mt-1">Add one above to get started</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
            const isLong = task.text.length > 80;
            const isExpanded = expandedIds.has(task.id);

            return (
              <li
                key={task.id}
                className={`rounded-xl border transition-all ${
                  task.completed
                    ? "bg-gray-50 border-gray-100 opacity-70"
                    : `${p.bg} ${p.border}`
                }`}
              >
                {editingTask?.id === task.id ? (
                  /* ── Edit mode ─────────────────────────────────── */
                  <div className="p-3 flex flex-col gap-2">
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Order
                        </label>
                        <input
                          type="number"
                          value={editingOrder}
                          onChange={(e) => setEditingOrder(e.target.value)}
                          className="w-16 p-1.5 border border-gray-300 rounded text-sm"
                          min="0"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-40">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Task Description
                        </label>
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && updateTask()}
                          className="w-full p-1.5 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Priority
                        </label>
                        <select
                          value={editingPriority}
                          onChange={(e) => setEditingPriority(e.target.value)}
                          className="p-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="high">🔴 High</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🟢 Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-gray-200">
                      <button
                        onClick={updateTask}
                        disabled={savingId === task.id}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold flex justify-center items-center gap-1.5 hover:bg-blue-700 transition"
                      >
                        {savingId === task.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingTask(null)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold flex justify-center items-center gap-1.5 hover:bg-gray-300 transition"
                      >
                        <X className="w-3 h-3" /> Discard
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ─────────────────────────────────── */
                  <div className="p-3">
                    {/* Top: order + priority badge + text */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <span className="text-xs text-gray-400 font-mono mt-0.5 shrink-0 w-5 text-right">
                        {task.order}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${p.bg} ${p.color} border ${p.border}`}
                      >
                        {p.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-relaxed ${
                            task.completed
                              ? "line-through text-gray-400"
                              : "text-gray-800 font-medium"
                          } ${isLong && !isExpanded ? "line-clamp-2" : ""}`}
                        >
                          {task.text}
                        </p>
                        {isLong && (
                          <button
                            onClick={() =>
                              setExpandedIds((prev) => {
                                const next = new Set(prev);
                                next.has(task.id)
                                  ? next.delete(task.id)
                                  : next.add(task.id);
                                return next;
                              })
                            }
                            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium mt-0.5 flex items-center gap-0.5"
                          >
                            {isExpanded ? "▲ Show less" : "▼ Show more"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom: action controls */}
                    <div className="flex gap-2 pt-2.5 border-t border-black/5">
                      <button
                        onClick={() => toggleComplete(task)}
                        disabled={togglingId === task.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          task.completed
                            ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {togglingId === task.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : task.completed ? (
                          <>
                            <Circle size={13} /> Mark Pending
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} /> Mark Done
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setEditingText(task.text);
                          setEditingOrder(task.order?.toString() || "0");
                          setEditingPriority(task.priority || "medium");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      >
                        <Edit2 size={13} /> Edit Task
                      </button>

                      <button
                        onClick={() => deleteTask(task.id)}
                        disabled={deletingId === task.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50"
                      >
                        {deletingId === task.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Trash2 size={13} /> Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TaskPlanner;

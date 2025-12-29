import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { Plus, Edit2, Trash2, CheckCircle, Circle, Save } from "lucide-react";

const TaskPlanner = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskOrder, setNewTaskOrder] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingOrder, setEditingOrder] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, date]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid),
        where("date", "==", date),
        orderBy("order")
      );
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const order = parseInt(newTaskOrder) || tasks.length;

    try {
      const taskData = {
        userId: user.uid,
        date,
        text: newTask.trim(),
        completed: false,
        order,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "tasks"), taskData);
      setNewTask("");
      setNewTaskOrder("");
      fetchTasks();
      toast.success("Task added");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const updateTask = async () => {
    if (!editingText.trim()) return;
    const order = parseInt(editingOrder) || editingTask.order;

    try {
      await updateDoc(doc(db, "tasks", editingTask.id), {
        text: editingText.trim(),
        order,
      });
      setEditingTask(null);
      setEditingText("");
      setEditingOrder("");
      fetchTasks();
      toast.success("Task updated");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const toggleComplete = async (task) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        completed: !task.completed,
      });
      fetchTasks();
    } catch (error) {
      console.error("Error toggling complete:", error);
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete task?")) return;

    try {
      await deleteDoc(doc(db, "tasks", taskId));
      fetchTasks();
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const completionPercentage = tasks.length
    ? (tasks.filter((t) => t.completed).length / tasks.length) * 100
    : 0;

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 font-medium">
        Loading tasks...
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-6 mt-4 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-between">
        Task Planner
        <span className="text-sm text-gray-500 font-normal">
          {new Date(date).toDateString()}
        </span>
      </h1>

      {/* Date Picker */}
      <div className="flex justify-end mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Add Task */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter a new task..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="number"
          value={newTaskOrder}
          onChange={(e) => setNewTaskOrder(e.target.value)}
          placeholder="Order"
          className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          min="0"
        />
        <button
          onClick={addTask}
          className="flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
          <span>Progress</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Task List */}
      <ul className="space-y-3">
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 text-sm">
            No tasks found for this date.
          </div>
        )}

        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex flex-col sm:flex-row justify-between p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-all bg-gray-50"
          >
            <div className="flex items-center flex-1 gap-3">
              {editingTask?.id === task.id ? (
                <>
                  <input
                    type="number"
                    value={editingOrder}
                    onChange={(e) => setEditingOrder(e.target.value)}
                    className="w-16 p-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1 p-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </>
              ) : (
                <>
                  <span className="w-10 text-gray-500 text-sm">
                    {task.order}
                  </span>
                  <span
                    className={`flex-1 text-gray-800 ${
                      task.completed
                        ? "line-through text-gray-400 italic"
                        : "font-medium"
                    }`}
                  >
                    {task.text}
                  </span>
                </>
              )}
            </div>

            <div className="flex gap-6 sm:gap-2 border-t border-gray-200 pt-2 sm:pt-0 pl-12 sm:pl-0">
              <button
                onClick={() => toggleComplete(task)}
                className="text-green-600 hover:text-green-700"
              >
                {task.completed ? (
                  <CheckCircle size={18} />
                ) : (
                  <Circle size={18} />
                )}
              </button>

              {editingTask?.id === task.id ? (
                <button
                  onClick={updateTask}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Save size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingTask(task);
                    setEditingText(task.text);
                    setEditingOrder(task.order.toString());
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 size={18} />
                </button>
              )}

              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskPlanner;

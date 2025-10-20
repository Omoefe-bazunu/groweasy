// import { useState, useEffect } from "react";
// import { useUser } from "../context/UserContext";
// import { db } from "../lib/firebase";
// import {
//   collection,
//   addDoc,
//   query,
//   where,
//   orderBy,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { toast } from "react-toastify";
// import {
//   Plus,
//   Edit2,
//   Trash2,
//   X,
//   Calendar,
//   TrendingUp,
//   TrendingDown,
// } from "lucide-react";

// const FinancialRecordsCreator = () => {
//   const { user } = useUser();
//   const [records, setRecords] = useState([]);
//   const [groupedRecords, setGroupedRecords] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState(null);
//   const [formData, setFormData] = useState({
//     date: new Date().toISOString().split("T")[0],
//     details: "",
//     inflow: "",
//     outflow: "",
//   });

//   useEffect(() => {
//     if (user) fetchRecords();
//   }, [user]);

//   useEffect(() => {
//     groupRecordsByWeek();
//   }, [records]);

//   const getWeekIdentifier = (dateString) => {
//     const date = new Date(dateString);
//     const year = date.getFullYear();
//     const firstDayOfYear = new Date(year, 0, 1);
//     const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//     const weekNumber = Math.ceil(
//       (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
//     );
//     return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
//   };

//   const getWeekDateRange = (weekId) => {
//     const [year, week] = weekId.split("-W");
//     const firstDayOfYear = new Date(year, 0, 1);
//     const daysOffset = (parseInt(week) - 1) * 7;
//     const weekStart = new Date(
//       firstDayOfYear.getTime() + daysOffset * 86400000
//     );
//     const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

//     const formatDate = (date) => {
//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       });
//     };

//     return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
//   };

//   const fetchRecords = async () => {
//     setLoading(true);
//     try {
//       const q = query(
//         collection(db, "financialRecords"),
//         where("userId", "==", user.uid),
//         orderBy("date", "desc")
//       );
//       const querySnapshot = await getDocs(q);
//       const recordsData = querySnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setRecords(recordsData);
//     } catch (error) {
//       console.error("Error fetching records:", error);
//       toast.error("Failed to load records");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const groupRecordsByWeek = () => {
//     const grouped = {};
//     let runningBalance = 0;

//     // Sort records by date ascending for balance calculation
//     const sortedRecords = [...records].sort(
//       (a, b) => new Date(a.date) - new Date(b.date)
//     );

//     sortedRecords.forEach((record) => {
//       const weekId = getWeekIdentifier(record.date);
//       if (!grouped[weekId]) {
//         grouped[weekId] = {
//           records: [],
//           totalInflow: 0,
//           totalOutflow: 0,
//           startingBalance: runningBalance,
//         };
//       }

//       const inflow = parseFloat(record.inflow) || 0;
//       const outflow = parseFloat(record.outflow) || 0;
//       runningBalance += inflow - outflow;

//       grouped[weekId].records.push({ ...record, balance: runningBalance });
//       grouped[weekId].totalInflow += inflow;
//       grouped[weekId].totalOutflow += outflow;
//       grouped[weekId].endingBalance = runningBalance;
//     });

//     setGroupedRecords(grouped);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.date || !formData.details) {
//       toast.error("Date and details are required");
//       return;
//     }

//     if (!formData.inflow && !formData.outflow) {
//       toast.error("Please enter either inflow or outflow");
//       return;
//     }

//     try {
//       const recordData = {
//         userId: user.uid,
//         date: formData.date,
//         details: formData.details,
//         inflow: parseFloat(formData.inflow) || 0,
//         outflow: parseFloat(formData.outflow) || 0,
//         weekId: getWeekIdentifier(formData.date),
//         createdAt: serverTimestamp(),
//       };

//       if (editingRecord) {
//         await updateDoc(
//           doc(db, "financialRecords", editingRecord.id),
//           recordData
//         );
//         toast.success("Record updated successfully");
//       } else {
//         await addDoc(collection(db, "financialRecords"), recordData);
//         toast.success("Record added successfully");
//       }

//       setIsModalOpen(false);
//       setEditingRecord(null);
//       setFormData({
//         date: new Date().toISOString().split("T")[0],
//         details: "",
//         inflow: "",
//         outflow: "",
//       });
//       fetchRecords();
//     } catch (error) {
//       console.error("Error saving record:", error);
//       toast.error("Failed to save record");
//     }
//   };

//   const handleEdit = (record) => {
//     setEditingRecord(record);
//     setFormData({
//       date: record.date,
//       details: record.details,
//       inflow: record.inflow || "",
//       outflow: record.outflow || "",
//     });
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (recordId) => {
//     if (!window.confirm("Are you sure you want to delete this record?")) return;

//     try {
//       await deleteDoc(doc(db, "financialRecords", recordId));
//       toast.success("Record deleted successfully");
//       fetchRecords();
//     } catch (error) {
//       console.error("Error deleting record:", error);
//       toast.error("Failed to delete record");
//     }
//   };

//   const openModal = () => {
//     setEditingRecord(null);
//     setFormData({
//       date: new Date().toISOString().split("T")[0],
//       details: "",
//       inflow: "",
//       outflow: "",
//     });
//     setIsModalOpen(true);
//   };

//   if (loading) {
//     return (
//       <section
//         id="blog-details-loading"
//         className="flex flex-col items-center justify-center min-h-screen bg-white py-20"
//       >
//         <div className="flex flex-col items-center justify-center">
//           <div className="flex space-x-2">
//             <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
//             <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
//             <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
//           </div>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 text-gray-600 p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//           <div>
//             <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
//               Financial Records
//             </h1>
//             <p className="text-gray-600 mt-1">Track your income and expenses</p>
//           </div>
//           <button
//             onClick={openModal}
//             className="flex items-center gap-2 bg-[#5247bf] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
//           >
//             <Plus className="w-5 h-5" />
//             Add Record
//           </button>
//         </div>

//         {/* Records by Week */}
//         {Object.keys(groupedRecords).length === 0 ? (
//           <div className="bg-white rounded-xl shadow-md p-12 text-center">
//             <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">
//               No records yet
//             </h3>
//             <p className="text-gray-600 mb-6">
//               Start tracking your finances by adding your first record
//             </p>
//             <button
//               onClick={openModal}
//               className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
//             >
//               Add Your First Record
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {Object.entries(groupedRecords)
//               .sort(([a], [b]) => b.localeCompare(a))
//               .map(([weekId, weekData]) => {
//                 const netBalance = weekData.totalInflow - weekData.totalOutflow;
//                 const isProfit = netBalance >= 0;

//                 return (
//                   <div
//                     key={weekId}
//                     className="bg-white rounded-xl shadow-md overflow-hidden"
//                   >
//                     {/* Week Header */}
//                     <div className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] p-4 md:p-6">
//                       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                         <div>
//                           <h3 className="text-lg md:text-xl font-bold text-white">
//                             Week {weekId.split("-W")[1]}
//                           </h3>
//                           <p className="text-white/80 text-sm">
//                             {getWeekDateRange(weekId)}
//                           </p>
//                         </div>
//                         <div className="grid grid-cols-3 gap-3 md:gap-4">
//                           <div className="bg-white/10 backdrop-blur rounded-lg p-3">
//                             <p className="text-white/70 text-xs mb-1">Inflow</p>
//                             <p className="text-green-300 font-bold text-sm md:text-base">
//                               ${weekData.totalInflow.toFixed(2)}
//                             </p>
//                           </div>
//                           <div className="bg-white/10 backdrop-blur rounded-lg p-3">
//                             <p className="text-white/70 text-xs mb-1">
//                               Outflow
//                             </p>
//                             <p className="text-red-300 font-bold text-sm md:text-base">
//                               ${weekData.totalOutflow.toFixed(2)}
//                             </p>
//                           </div>
//                           <div
//                             className={`backdrop-blur rounded-lg p-3 ${isProfit ? "bg-green-500/20" : "bg-red-500/20"}`}
//                           >
//                             <p className="text-white/70 text-xs mb-1 flex items-center gap-1">
//                               Net{" "}
//                               {isProfit ? (
//                                 <TrendingUp className="w-3 h-3" />
//                               ) : (
//                                 <TrendingDown className="w-3 h-3" />
//                               )}
//                             </p>
//                             <p
//                               className={`font-bold text-sm md:text-base ${isProfit ? "text-green-300" : "text-red-300"}`}
//                             >
//                               ${Math.abs(netBalance).toFixed(2)}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Table */}
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm">
//                         <thead className="bg-gray-50 border-b border-gray-200">
//                           <tr>
//                             <th className="p-3 text-left font-semibold text-gray-700 min-w-[100px]">
//                               Date
//                             </th>
//                             <th className="p-3 text-left font-semibold text-gray-700 min-w-[200px]">
//                               Details
//                             </th>
//                             <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
//                               Inflow
//                             </th>
//                             <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
//                               Outflow
//                             </th>
//                             <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
//                               Balance
//                             </th>
//                             <th className="p-3 text-center font-semibold text-gray-700 min-w-[100px]">
//                               Actions
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {weekData.records
//                             .sort((a, b) => new Date(b.date) - new Date(a.date))
//                             .map((record) => (
//                               <tr
//                                 key={record.id}
//                                 className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
//                               >
//                                 <td className="p-3 text-gray-700">
//                                   {new Date(record.date).toLocaleDateString()}
//                                 </td>
//                                 <td className="p-3 text-gray-700">
//                                   {record.details}
//                                 </td>
//                                 <td className="p-3 text-right text-green-600 font-semibold">
//                                   {record.inflow
//                                     ? `$${record.inflow.toFixed(2)}`
//                                     : "-"}
//                                 </td>
//                                 <td className="p-3 text-right text-red-600 font-semibold">
//                                   {record.outflow
//                                     ? `$${record.outflow.toFixed(2)}`
//                                     : "-"}
//                                 </td>
//                                 <td className="p-3 text-right font-bold text-gray-900">
//                                   ${record.balance.toFixed(2)}
//                                 </td>
//                                 <td className="p-3">
//                                   <div className="flex items-center justify-center gap-2">
//                                     <button
//                                       onClick={() => handleEdit(record)}
//                                       className="text-blue-600 hover:text-blue-800 p-1"
//                                     >
//                                       <Edit2 className="w-4 h-4" />
//                                     </button>
//                                     <button
//                                       onClick={() => handleDelete(record.id)}
//                                       className="text-red-600 hover:text-red-800 p-1"
//                                     >
//                                       <Trash2 className="w-4 h-4" />
//                                     </button>
//                                   </div>
//                                 </td>
//                               </tr>
//                             ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 );
//               })}
//           </div>
//         )}

//         {/* Modal */}
//         {isModalOpen && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   {editingRecord ? "Edit Record" : "Add Record"}
//                 </h2>
//                 <button
//                   onClick={() => setIsModalOpen(false)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Date *
//                   </label>
//                   <input
//                     type="date"
//                     name="date"
//                     value={formData.date}
//                     onChange={handleInputChange}
//                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Details *
//                   </label>
//                   <textarea
//                     name="details"
//                     value={formData.details}
//                     onChange={handleInputChange}
//                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
//                     rows="3"
//                     placeholder="e.g., Client payment for Project X"
//                     required
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Inflow (+)
//                     </label>
//                     <input
//                       type="number"
//                       name="inflow"
//                       value={formData.inflow}
//                       onChange={handleInputChange}
//                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
//                       placeholder="0.00"
//                       step="0.01"
//                       min="0"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Outflow (-)
//                     </label>
//                     <input
//                       type="number"
//                       name="outflow"
//                       value={formData.outflow}
//                       onChange={handleInputChange}
//                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
//                       placeholder="0.00"
//                       step="0.01"
//                       min="0"
//                     />
//                   </div>
//                 </div>

//                 <div className="flex gap-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => setIsModalOpen(false)}
//                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="flex-1 px-4 py-3 bg-[#5247bf] text-white rounded-lg hover:bg-[#4238a6] transition-colors font-medium"
//                   >
//                     {editingRecord ? "Update" : "Add"} Record
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FinancialRecordsCreator;

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
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";

const FinancialRecordsCreator = () => {
  const { user, userData, hasAccessToCreate } = useUser();
  const [records, setRecords] = useState([]);
  const [groupedRecords, setGroupedRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    details: "",
    inflow: "",
    outflow: "",
  });

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  useEffect(() => {
    groupRecordsByWeek();
  }, [records]);

  const getWeekIdentifier = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
    );
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  };

  const getWeekDateRange = (weekId) => {
    const [year, week] = weekId.split("-W");
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (parseInt(week) - 1) * 7;
    const weekStart = new Date(
      firstDayOfYear.getTime() + daysOffset * 86400000
    );
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "financialRecords"),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(recordsData);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const groupRecordsByWeek = () => {
    const grouped = {};
    let runningBalance = 0;

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sortedRecords.forEach((record) => {
      const weekId = getWeekIdentifier(record.date);
      if (!grouped[weekId]) {
        grouped[weekId] = {
          records: [],
          totalInflow: 0,
          totalOutflow: 0,
          startingBalance: runningBalance,
        };
      }

      const inflow = parseFloat(record.inflow) || 0;
      const outflow = parseFloat(record.outflow) || 0;
      runningBalance += inflow - outflow;

      grouped[weekId].records.push({ ...record, balance: runningBalance });
      grouped[weekId].totalInflow += inflow;
      grouped[weekId].totalOutflow += outflow;
      grouped[weekId].endingBalance = runningBalance;
    });

    setGroupedRecords(grouped);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasAccessToCreate()) {
      const trialEnd = userData?.subscription?.trialEndDate
        ? new Date(userData.subscription.trialEndDate)
        : null;
      const daysLeft = trialEnd
        ? Math.max(
            0,
            Math.floor((trialEnd - new Date()) / (1000 * 60 * 60 * 24))
          )
        : 0;
      toast.error(
        daysLeft > 0
          ? `Your trial has ${daysLeft} days remaining. Subscribe to continue creating records.`
          : "Please subscribe to create records."
      );
      return;
    }

    if (!formData.date || !formData.details) {
      toast.error("Date and details are required");
      return;
    }

    if (!formData.inflow && !formData.outflow) {
      toast.error("Please enter either inflow or outflow");
      return;
    }

    try {
      const recordData = {
        userId: user.uid,
        date: formData.date,
        details: formData.details,
        inflow: parseFloat(formData.inflow) || 0,
        outflow: parseFloat(formData.outflow) || 0,
        weekId: getWeekIdentifier(formData.date),
        createdAt: serverTimestamp(),
      };

      if (editingRecord) {
        await updateDoc(
          doc(db, "financialRecords", editingRecord.id),
          recordData
        );
        toast.success("Record updated successfully");
      } else {
        await addDoc(collection(db, "financialRecords"), recordData);
        toast.success("Record added successfully");
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        details: "",
        inflow: "",
        outflow: "",
      });
      fetchRecords();
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error("Failed to save record");
    }
  };

  const handleEdit = (record) => {
    if (!hasAccessToCreate()) {
      const trialEnd = userData?.subscription?.trialEndDate
        ? new Date(userData.subscription.trialEndDate)
        : null;
      const daysLeft = trialEnd
        ? Math.max(
            0,
            Math.floor((trialEnd - new Date()) / (1000 * 60 * 60 * 24))
          )
        : 0;
      toast.error(
        daysLeft > 0
          ? `Your trial has ${daysLeft} days remaining. Subscribe to continue editing records.`
          : "Please subscribe to edit records."
      );
      return;
    }
    setEditingRecord(record);
    setFormData({
      date: record.date,
      details: record.details,
      inflow: record.inflow || "",
      outflow: record.outflow || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (recordId) => {
    if (!hasAccessToCreate()) {
      const trialEnd = userData?.subscription?.trialEndDate
        ? new Date(userData.subscription.trialEndDate)
        : null;
      const daysLeft = trialEnd
        ? Math.max(
            0,
            Math.floor((trialEnd - new Date()) / (1000 * 60 * 60 * 24))
          )
        : 0;
      toast.error(
        daysLeft > 0
          ? `Your trial has ${daysLeft} days remaining. Subscribe to continue deleting records.`
          : "Please subscribe to delete records."
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await deleteDoc(doc(db, "financialRecords", recordId));
      toast.success("Record deleted successfully");
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const openModal = () => {
    if (!hasAccessToCreate()) {
      const trialEnd = userData?.subscription?.trialEndDate
        ? new Date(userData.subscription.trialEndDate)
        : null;
      const daysLeft = trialEnd
        ? Math.max(
            0,
            Math.floor((trialEnd - new Date()) / (1000 * 60 * 60 * 24))
          )
        : 0;
      toast.error(
        daysLeft > 0
          ? `Your trial has ${daysLeft} days remaining. Subscribe to continue creating records.`
          : "Please subscribe to create records."
      );
      return;
    }
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      details: "",
      inflow: "",
      outflow: "",
    });
    setIsModalOpen(true);
  };

  if (!hasAccessToCreate()) {
    const trialEnd = userData?.subscription?.trialEndDate
      ? new Date(userData.subscription.trialEndDate)
      : null;
    const daysLeft = trialEnd
      ? Math.max(0, Math.floor((trialEnd - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Subscription Required
          </h2>
          <p className="text-gray-600 mb-6">
            {daysLeft > 0
              ? `Your trial has ${daysLeft} days remaining. Subscribe to continue managing financial records.`
              : "Your trial has expired. Please subscribe to manage financial records."}
          </p>
          <Link
            to="/subscribe"
            className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
          >
            Subscribe Now
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <section
        id="blog-details-loading"
        className="flex flex-col items-center justify-center min-h-screen bg-white py-20"
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex space-x-2">
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Financial Records
            </h1>
            <p className="text-gray-600 mt-1">Track your income and expenses</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-[#5247bf] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Record
          </button>
        </div>

        {Object.keys(groupedRecords).length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No records yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start tracking your finances by adding your first record
            </p>
            <button
              onClick={openModal}
              className="bg-[#5247bf] text-white px-6 py-3 rounded-lg hover:bg-[#4238a6] transition-colors"
            >
              Add Your First Record
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRecords)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([weekId, weekData]) => {
                const netBalance = weekData.totalInflow - weekData.totalOutflow;
                const isProfit = netBalance >= 0;

                return (
                  <div
                    key={weekId}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-[#5247bf] to-[#4238a6] p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-white">
                            Week {weekId.split("-W")[1]}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {getWeekDateRange(weekId)}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                            <p className="text-white/70 text-xs mb-1">Inflow</p>
                            <p className="text-green-300 font-bold text-sm md:text-base">
                              ${weekData.totalInflow.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                            <p className="text-white/70 text-xs mb-1">
                              Outflow
                            </p>
                            <p className="text-red-300 font-bold text-sm md:text-base">
                              ${weekData.totalOutflow.toFixed(2)}
                            </p>
                          </div>
                          <div
                            className={`backdrop-blur rounded-lg p-3 ${isProfit ? "bg-green-500/20" : "bg-red-500/20"}`}
                          >
                            <p className="text-white/70 text-xs mb-1 flex items-center gap-1">
                              Net{" "}
                              {isProfit ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                            </p>
                            <p
                              className={`font-bold text-sm md:text-base ${isProfit ? "text-green-300" : "text-red-300"}`}
                            >
                              ${Math.abs(netBalance).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-3 text-left font-semibold text-gray-700 min-w-[100px]">
                              Date
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700 min-w-[200px]">
                              Details
                            </th>
                            <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                              Inflow
                            </th>
                            <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                              Outflow
                            </th>
                            <th className="p-3 text-right font-semibold text-gray-700 min-w-[100px]">
                              Balance
                            </th>
                            <th className="p-3 text-center font-semibold text-gray-700 min-w-[100px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {weekData.records
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((record) => (
                              <tr
                                key={record.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="p-3 text-gray-700">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-gray-700">
                                  {record.details}
                                </td>
                                <td className="p-3 text-right text-green-600 font-semibold">
                                  {record.inflow
                                    ? `$${record.inflow.toFixed(2)}`
                                    : "-"}
                                </td>
                                <td className="p-3 text-right text-red-600 font-semibold">
                                  {record.outflow
                                    ? `$${record.outflow.toFixed(2)}`
                                    : "-"}
                                </td>
                                <td className="p-3 text-right font-bold text-gray-900">
                                  ${record.balance.toFixed(2)}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleEdit(record)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(record.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRecord ? "Edit Record" : "Add Record"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Details *
                  </label>
                  <textarea
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                    rows="3"
                    placeholder="e.g., Client payment for Project X"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inflow (+)
                    </label>
                    <input
                      type="number"
                      name="inflow"
                      value={formData.inflow}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outflow (-)
                    </label>
                    <input
                      type="number"
                      name="outflow"
                      value={formData.outflow}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5247bf] focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[#5247bf] text-white rounded-lg hover:bg-[#4238a6] transition-colors font-medium"
                  >
                    {editingRecord ? "Update" : "Add"} Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialRecordsCreator;

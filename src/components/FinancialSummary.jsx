import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Calendar,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { jsPDF } from "jspdf";

const FinancialSummary = () => {
  const { user } = useUser();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [expandedPeriods, setExpandedPeriods] = useState({});

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  useEffect(() => {
    if (records.length > 0) {
      calculateSummary();
      generateChartData();
      generateInsights();
    }
  }, [records, period, searchTerm, dateFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "financialRecords"),
        where("userId", "==", user.uid)
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

  const filterRecords = () => {
    return records.filter((record) => {
      const matchesSearch = searchTerm
        ? record.details?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const recordDate = new Date(record.date);
      const matchesDateRange =
        (!dateFilter.start || recordDate >= new Date(dateFilter.start)) &&
        (!dateFilter.end || recordDate <= new Date(dateFilter.end));

      return matchesSearch && matchesDateRange;
    });
  };

  const getPeriodKey = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;

    switch (period) {
      case "weekly": {
        const weekNum = Math.ceil(
          (date.getDate() + new Date(year, month, 1).getDay()) / 7
        );
        return `${year}-${String(month + 1).padStart(2, "0")}-W${weekNum}`;
      }
      case "monthly":
        return `${year}-${String(month + 1).padStart(2, "0")}`;
      case "quarterly":
        return `${year}-Q${quarter}`;
      case "annual":
        return `${year}`;
      default:
        return `${year}-${String(month + 1).padStart(2, "0")}`;
    }
  };

  const calculateSummary = () => {
    const filtered = filterRecords();
    const grouped = {};

    filtered.forEach((record) => {
      const key = getPeriodKey(record.date);
      if (!grouped[key]) {
        grouped[key] = { inflow: 0, outflow: 0, count: 0, transactions: [] };
      }
      grouped[key].inflow += record.inflow || 0;
      grouped[key].outflow += record.outflow || 0;
      grouped[key].count += 1;
      grouped[key].transactions.push(record);
    });

    const summaryData = Object.entries(grouped).map(([key, data]) => ({
      period: key,
      ...data,
      net: data.inflow - data.outflow,
    }));

    setSummary({
      totalInflow: filtered.reduce((sum, r) => sum + (r.inflow || 0), 0),
      totalOutflow: filtered.reduce((sum, r) => sum + (r.outflow || 0), 0),
      periods: summaryData,
    });
  };

  const generateChartData = () => {
    const filtered = filterRecords();
    const grouped = {};

    filtered.forEach((record) => {
      const key = getPeriodKey(record.date);
      if (!grouped[key]) {
        grouped[key] = { period: key, inflow: 0, outflow: 0 };
      }
      grouped[key].inflow += record.inflow || 0;
      grouped[key].outflow += record.outflow || 0;
    });

    const data = Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((item) => ({
        ...item,
        net: item.inflow - item.outflow,
      }));

    setChartData(data);
  };

  const generateInsights = () => {
    const filtered = filterRecords();
    if (filtered.length === 0) {
      setInsights([]);
      return;
    }

    const insights = [];
    const totalInflow = filtered.reduce((sum, r) => sum + (r.inflow || 0), 0);
    const totalOutflow = filtered.reduce((sum, r) => sum + (r.outflow || 0), 0);
    const netBalance = totalInflow - totalOutflow;

    insights.push({
      type: netBalance >= 0 ? "positive" : "negative",
      icon: netBalance >= 0 ? TrendingUp : TrendingDown,
      title: netBalance >= 0 ? "Profitable Period" : "Deficit Period",
      description: `Net ${netBalance >= 0 ? "surplus" : "deficit"} of $${Math.abs(netBalance).toFixed(2)}`,
    });

    if (summary.periods && summary.periods.length > 0) {
      const bestPeriod = summary.periods.reduce((max, p) =>
        p.net > max.net ? p : max
      );
      insights.push({
        type: "info",
        icon: Activity,
        title: `Best ${period.charAt(0).toUpperCase() + period.slice(1)}`,
        description: `${bestPeriod.period} with $${bestPeriod.net.toFixed(2)} net`,
      });
    }

    const avgInflow =
      totalInflow / (filtered.filter((r) => r.inflow > 0).length || 1);
    insights.push({
      type: "info",
      icon: DollarSign,
      title: "Average Inflow",
      description: `$${avgInflow.toFixed(2)} per transaction`,
    });

    if (summary.periods && summary.periods.length >= 2) {
      const sorted = [...summary.periods].sort((a, b) =>
        a.period.localeCompare(b.period)
      );
      const current = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];
      const change =
        ((current.net - previous.net) / Math.abs(previous.net)) * 100;

      insights.push({
        type: change >= 0 ? "positive" : "negative",
        icon: change >= 0 ? TrendingUp : TrendingDown,
        title: "Period Change",
        description: `${change >= 0 ? "+" : ""}${change.toFixed(1)}% from previous period`,
      });
    }

    setInsights(insights);
  };

  const togglePeriodExpand = (period) => {
    setExpandedPeriods((prev) => ({
      ...prev,
      [period]: !prev[period],
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Financial Summary Report", 14, 20);

    doc.setFontSize(12);
    doc.text(
      `Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      14,
      30
    );
    doc.text(`Total Inflow: $${summary.totalInflow?.toFixed(2) || 0}`, 14, 38);
    doc.text(
      `Total Outflow: $${summary.totalOutflow?.toFixed(2) || 0}`,
      14,
      46
    );
    doc.text(
      `Net: $${(summary.totalInflow - summary.totalOutflow).toFixed(2)}`,
      14,
      54
    );

    doc.text("Period Breakdown:", 14, 68);
    let yPos = 76;

    (summary.periods || []).forEach((p, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(
        `${p.period}: Inflow $${p.inflow.toFixed(2)}, Outflow $${p.outflow.toFixed(2)}, Net $${p.net.toFixed(2)}`,
        14,
        yPos
      );
      yPos += 8;
    });

    doc.save("financial-summary.pdf");
    toast.success("PDF exported successfully!");
  };

  const exportToCSV = () => {
    const headers = ["Period", "Inflow", "Outflow", "Net", "Transaction Count"];
    const rows = (summary.periods || []).map((p) => [
      p.period,
      p.inflow.toFixed(2),
      p.outflow.toFixed(2),
      p.net.toFixed(2),
      p.count,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financial-summary.csv";
    a.click();
    toast.success("CSV exported successfully!");
  };

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

  const netBalance = summary.totalInflow - summary.totalOutflow;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 mt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Financial Summary
          </h1>
          <p className="text-gray-600">
            Analytics and insights for your financial performance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Total Inflow</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              ${summary.totalInflow?.toFixed(2) || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Total Outflow</p>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              ${summary.totalOutflow?.toFixed(2) || 0}
            </p>
          </div>

          <div
            className={`rounded-xl shadow-md p-6 ${netBalance >= 0 ? "bg-green-50" : "bg-red-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Net Balance</p>
              {netBalance >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p
              className={`text-3xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ${Math.abs(netBalance).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {netBalance >= 0 ? "Surplus" : "Deficit"}
            </p>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Smart Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                const colors = {
                  positive: "bg-green-50 border-green-200 text-green-700",
                  negative: "bg-red-50 border-red-200 text-red-700",
                  info: "bg-blue-50 border-blue-200 text-blue-700",
                };

                return (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 ${colors[insight.type]}`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold mb-1">{insight.title}</h3>
                    <p className="text-sm opacity-80">{insight.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Inflow vs Outflow Trends
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="inflow"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Inflow"
                    />
                    <Line
                      type="monotone"
                      dataKey="outflow"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Outflow"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Net Balance by Period
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="net" fill="#3b82f6" name="Net Balance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Period Breakdown with Transaction Details */}
        {summary.periods && summary.periods.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Period Breakdown
            </h2>
            <div className="space-y-3">
              {summary.periods
                .sort((a, b) => b.period.localeCompare(a.period))
                .map((p, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg"
                  >
                    <button
                      onClick={() => togglePeriodExpand(p.period)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">
                          {p.period}
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-1 text-sm">
                          <div>
                            <span className="text-gray-600">Inflow:</span>
                            <span className="font-semibold text-green-600 ml-2">
                              ${p.inflow.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Outflow:</span>
                            <span className="font-semibold text-red-600 mx-2">
                              ${p.outflow.toFixed(2)}
                            </span>
                          </div>
                          <div className="ml-2">
                            <span className="text-gray-600 ">Net:</span>
                            <span
                              className={`font-semibold ml-2 ${p.net >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              ${p.net.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Transactions:</span>
                            <span className="font-semibold ml-2">
                              {p.count}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {expandedPeriods[p.period] ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Transaction Details */}
                    {expandedPeriods[p.period] && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <table className="w-full">
                          <thead className="">
                            <tr className="border-b border-gray-200">
                              <th className="text-left p-2 font-semibold text-gray-700">
                                Date
                              </th>
                              <th className="text-left p-2 font-semibold text-gray-700">
                                Details
                              </th>
                              <th className="text-right p-2 font-semibold text-gray-700">
                                Inflow
                              </th>
                              <th className="text-right p-2 font-semibold text-gray-700">
                                Outflow
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.transactions
                              .sort(
                                (a, b) => new Date(a.date) - new Date(b.date)
                              )
                              .map((t, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-100 text-xs hover:bg-white"
                                >
                                  <td className="p-2 text-gray-700">
                                    {new Date(t.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-2 text-gray-700">
                                    {t.details}
                                  </td>
                                  <td className="p-2 text-right text-green-600 font-semibold">
                                    {t.inflow ? `$${t.inflow.toFixed(2)}` : "-"}
                                  </td>
                                  <td className="p-2 text-right text-red-600 font-semibold">
                                    {t.outflow
                                      ? `$${t.outflow.toFixed(2)}`
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {records.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No data available
            </h3>
            <p className="text-gray-600">
              Start adding financial records to see your summary and analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;

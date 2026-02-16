import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { toast } from "react-toastify";
import api from "../lib/api";
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
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { jsPDF } from "jspdf";
// ✅ Import supported currencies for fallback logic
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

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

  // ✅ Updated Dynamic Currency Formatter
  const formatCurrency = (value, currencyObj) => {
    const curr = currencyObj || SUPPORTED_CURRENCIES[0];
    return new Intl.NumberFormat(curr.locale, {
      style: "currency",
      currency: curr.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value || 0));
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get("/financial-records");
      setRecords(res.data.records);
    } catch (err) {
      console.error("Error fetching records:", err);
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
          (date.getDate() + new Date(year, month, 1).getDay()) / 7,
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
        grouped[key] = {
          inflow: 0,
          outflow: 0,
          count: 0,
          transactions: [],
          paymentMethods: { Cash: 0, Bank: 0 },
          currency: record.currency || SUPPORTED_CURRENCIES[0],
        };
      }
      grouped[key].inflow += record.inflow || 0;
      grouped[key].outflow += record.outflow || 0;
      grouped[key].count += 1;
      grouped[key].transactions.push(record);
      const paymentMethod = record.paymentMethod || "Cash";
      grouped[key].paymentMethods[paymentMethod] =
        (grouped[key].paymentMethods[paymentMethod] || 0) + 1;
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
      // Default reporting currency from first record or fallback
      reportCurrency: filtered[0]?.currency || SUPPORTED_CURRENCIES[0],
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

    const newInsights = [];
    const totalInflow = filtered.reduce((sum, r) => sum + (r.inflow || 0), 0);
    const totalOutflow = filtered.reduce((sum, r) => sum + (r.outflow || 0), 0);
    const netBalance = totalInflow - totalOutflow;
    const activeCurrency = filtered[0]?.currency || SUPPORTED_CURRENCIES[0];

    newInsights.push({
      type: netBalance >= 0 ? "positive" : "negative",
      icon: netBalance >= 0 ? TrendingUp : TrendingDown,
      title: netBalance >= 0 ? "Profitable Period" : "Deficit Period",
      description: `Net ${netBalance >= 0 ? "surplus" : "deficit"} of ${formatCurrency(Math.abs(netBalance), activeCurrency)}`,
    });

    if (summary.periods && summary.periods.length > 0) {
      const bestPeriod = summary.periods.reduce((max, p) =>
        p.net > max.net ? p : max,
      );
      newInsights.push({
        type: "info",
        icon: Activity,
        title: `Best ${period.charAt(0).toUpperCase() + period.slice(1)}`,
        description: `${bestPeriod.period} with ${formatCurrency(bestPeriod.net, activeCurrency)} net`,
      });
    }

    const avgInflow =
      totalInflow / (filtered.filter((r) => r.inflow > 0).length || 1);
    newInsights.push({
      type: "info",
      icon: Activity,
      title: "Average Inflow",
      description: `${formatCurrency(avgInflow, activeCurrency)} per transaction`,
    });

    const paymentCounts = filtered.reduce((acc, r) => {
      const method = r.paymentMethod || "Cash";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    const dominantMethod = Object.entries(paymentCounts).reduce(
      (max, [method, count]) => (count > max.count ? { method, count } : max),
      { method: "Cash", count: 0 },
    );
    newInsights.push({
      type: "info",
      icon: Activity,
      title: "Payment Method",
      description: `${dominantMethod.method} used in ${dominantMethod.count} transaction(s)`,
    });

    setInsights(newInsights);
  };

  const togglePeriodExpand = (periodKey) => {
    setExpandedPeriods((prev) => ({
      ...prev,
      [periodKey]: !prev[periodKey],
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const curr = summary.reportCurrency || SUPPORTED_CURRENCIES[0];

    doc.setFontSize(18);
    doc.text("Financial Summary Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Period: ${period.toUpperCase()}`, 14, 30);
    doc.text(
      `Total Inflow: ${formatCurrency(summary.totalInflow, curr)}`,
      14,
      38,
    );
    doc.text(
      `Total Outflow: ${formatCurrency(summary.totalOutflow, curr)}`,
      14,
      46,
    );
    doc.text(
      `Net: ${formatCurrency(summary.totalInflow - summary.totalOutflow, curr)}`,
      14,
      54,
    );

    doc.text("Period Breakdown:", 14, 68);
    let yPos = 76;

    (summary.periods || []).forEach((p) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(
        `${p.period}: In +${formatCurrency(p.inflow, curr)}, Out -${formatCurrency(p.outflow, curr)}, Net ${formatCurrency(p.net, curr)}`,
        14,
        yPos,
      );
      yPos += 8;
    });

    doc.save("financial-summary.pdf");
    toast.success("PDF exported successfully!");
  };

  const exportToCSV = () => {
    const headers = ["Period", "Inflow", "Outflow", "Net", "Count", "Currency"];
    const rows = (summary.periods || []).map((p) => [
      p.period,
      p.inflow.toFixed(2),
      p.outflow.toFixed(2),
      p.net.toFixed(2),
      p.count,
      p.currency?.code || "NGN",
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
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  const netBalance = (summary.totalInflow || 0) - (summary.totalOutflow || 0);
  const displayCurr = summary.reportCurrency || SUPPORTED_CURRENCIES[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                View Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Filter by details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) =>
                  setDateFilter((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Top Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-black uppercase">
                Total Inflow
              </p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-black text-green-700">
              {formatCurrency(summary.totalInflow, displayCurr)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-black uppercase">
                Total Outflow
              </p>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-black text-red-700">
              {formatCurrency(summary.totalOutflow, displayCurr)}
            </p>
          </div>

          <div
            className={`rounded-xl shadow-md p-6 border-l-4 ${netBalance >= 0 ? "bg-green-50 border-green-600" : "bg-red-50 border-red-600"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-xs font-black uppercase">
                Net Balance
              </p>
              <Activity
                className={`w-5 h-5 ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              />
            </div>
            <p
              className={`text-3xl font-black ${netBalance >= 0 ? "text-green-700" : "text-red-700"}`}
            >
              {formatCurrency(Math.abs(netBalance), displayCurr)}
            </p>
            <p className="text-xs font-bold mt-1 opacity-70">
              {netBalance >= 0 ? "Surplus" : "Deficit"}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">
                Inflow vs Outflow
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 10, fontWeight: "bold" }}
                    />
                    <YAxis tick={{ fontSize: 10, fontWeight: "bold" }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value, displayCurr)}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="inflow"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      name="Inflow"
                    />
                    <Line
                      type="monotone"
                      dataKey="outflow"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      name="Outflow"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">
                Net Performance
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 10, fontWeight: "bold" }}
                    />
                    <YAxis tick={{ fontSize: 10, fontWeight: "bold" }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value, displayCurr)}
                    />
                    <Legend />
                    <Bar
                      dataKey="net"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Net Balance"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight uppercase">
              Smart Business Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                const colors = {
                  positive: "bg-green-50 border-green-200 text-green-900",
                  negative: "bg-red-50 border-red-200 text-red-900",
                  info: "bg-blue-50 border-blue-200 text-blue-900",
                };
                return (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-4 ${colors[insight.type]}`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <h3 className="font-black text-sm mb-1 uppercase tracking-tighter">
                      {insight.title}
                    </h3>
                    <p className="text-xs font-bold opacity-80">
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Breakdown List */}
        {summary.periods && summary.periods.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight uppercase">
              Period Breakdown
            </h2>
            <div className="space-y-3">
              {summary.periods
                .sort((a, b) => b.period.localeCompare(a.period))
                .map((p, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => togglePeriodExpand(p.period)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white"
                    >
                      <div className="flex-1 text-left">
                        <div className="font-black text-gray-900">
                          {p.period}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-xs">
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-gray-500">IN:</span>
                            <span className="text-green-700">
                              {formatCurrency(p.inflow, p.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-gray-500">OUT:</span>
                            <span className="text-red-700">
                              {formatCurrency(p.outflow, p.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-bold border-l pl-4 border-gray-200">
                            <span className="text-gray-500">NET:</span>
                            <span
                              className={
                                p.net >= 0 ? "text-green-700" : "text-red-700"
                              }
                            >
                              {formatCurrency(p.net, p.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedPeriods[p.period] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedPeriods[p.period] && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="text-gray-500 font-black uppercase tracking-widest border-b border-gray-200">
                              <tr>
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Details</th>
                                <th className="pb-2 text-right">Amount</th>
                                <th className="pb-2 text-right">Method</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {p.transactions.map((t, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-white transition-colors"
                                >
                                  <td className="py-2.5 font-bold text-gray-700">
                                    {new Date(t.date).toLocaleDateString()}
                                  </td>
                                  <td className="py-2.5 text-gray-900 font-medium">
                                    {t.details}
                                  </td>
                                  <td
                                    className={`py-2.5 text-right font-black ${t.inflow > 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {t.inflow > 0
                                      ? `+${formatCurrency(t.inflow, p.currency)}`
                                      : `-${formatCurrency(t.outflow, p.currency)}`}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-bold text-[10px]">
                                      {t.paymentMethod}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">
              No Data to Summarize
            </h3>
            <p className="text-gray-600 font-medium">
              Add some financial records to see your business analytics here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;

import { Users, MapPin, ShoppingBag } from "lucide-react";

const CustomerAnalytics = ({ customers }) => {
  // Helper to count occurrences
  const getCounts = (key) => {
    const counts = {};
    customers.forEach((c) => {
      const val = c[key] ? c[key].trim() : "Unknown";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort desc
      .slice(0, 5); // Top 5
  };

  const topStates = getCounts("state");
  const topProducts = getCounts("productInterest");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#5247bf] to-[#4238a6] p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-purple-100 text-sm">Total Database</p>
              <p className="text-3xl font-bold">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Top Region</p>
              <p className="text-xl font-bold text-gray-800">
                {topStates[0]?.[0] || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Top Interest</p>
              <p className="text-xl font-bold text-gray-800">
                {topProducts[0]?.[0] || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Region Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#5247bf]" /> Top Customer Regions
          </h3>
          <div className="space-y-4">
            {topStates.map(([state, count], index) => (
              <div key={state}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{state}</span>
                  <span className="text-gray-500">{count} customers</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-[#5247bf] h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(count / customers.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {topStates.length === 0 && (
              <p className="text-gray-400 text-sm">
                No location data available.
              </p>
            )}
          </div>
        </div>

        {/* Product Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" /> Popular Interests
          </h3>
          <div className="space-y-4">
            {topProducts.map(([product, count], index) => (
              <div key={product}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{product}</span>
                  <span className="text-gray-500">{count} interested</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(count / customers.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-gray-400 text-sm">
                No product data available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;

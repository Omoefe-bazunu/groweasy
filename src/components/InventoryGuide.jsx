import { Check, AlertTriangle, TrendingUp } from "lucide-react";

const InventoryGuide = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-violet-900">
          Understanding Inventory Management
        </h2>
        <p className="text-violet-700 mt-2">
          Inventory is simply the list of goods and materials you have available
          for sale. Managing it well ensures you don't run out of popular items
          (losing sales) or hold too much stock (tying up cash).
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border h-fit">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              1. Adding Products
            </h3>
            <p className="text-gray-600 mt-1">
              Go to the <strong>Manage Stock</strong> tab. Fill in the "Add New
              Product" form. Always set a <strong>Cost Price</strong> (how much
              you bought it for) to calculate your business value accurately.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border h-fit">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              2. Adjusting Stock (In/Out)
            </h3>
            <p className="text-gray-600 mt-1">
              You don't need to edit a product to change its quantity. Use the{" "}
              <strong>Stock Adjustment</strong> tool.
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
              <li>
                Use <strong>Stock In</strong> when you receive new supplies from
                a vendor.
              </li>
              <li>
                Use <strong>Stock Out</strong> when you make a sale or if an
                item is damaged/expired.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border h-fit">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              3. Low Stock Alerts
            </h3>
            <p className="text-gray-600 mt-1">
              The <strong>Dashboard</strong> will automatically show a yellow
              badge for "Low Stock" when an item's quantity drops below the "Min
              Level" you set. This is your signal to re-order immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryGuide;

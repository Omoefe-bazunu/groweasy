import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const CurrencySelector = ({
  selectedCurrency,
  onCurrencyChange,
  label = "Select Currency",
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={selectedCurrency.code}
        onChange={(e) => {
          const currency = SUPPORTED_CURRENCIES.find(
            (c) => c.code === e.target.value,
          );
          onCurrencyChange(currency);
        }}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] bg-white"
      >
        {SUPPORTED_CURRENCIES.map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.label} ({curr.symbol})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;

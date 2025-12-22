import { useState, useEffect } from "react";
import {
  Calculator,
  Building2,
  User,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const NigeriaTaxCalculator = () => {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-4 py-25 md:px-8 md:pt-8 md:py-25 font-sans text-gray-700">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#008751] text-white p-6 md:p-8">
          {" "}
          {/* Nigeria Green */}
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Nigeria Tax Calculator (2026 Act)
            </h1>
          </div>
          <p className="opacity-90 max-w-2xl">
            Based on the <strong>Nigeria Tax Act 2025</strong> (Effective Jan 1,
            2026). Includes the new ₦800k tax-free threshold, abolished CRA, and
            new Corporate Development Levy.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-4 text-sm md:text-base font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "personal"
                ? "bg-white border-t-4 border-t-[#008751] text-[#008751] shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Personal Tax (PAYE)
          </button>
          <button
            onClick={() => setActiveTab("corporate")}
            className={`flex-1 py-4 text-sm md:text-base font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "corporate"
                ? "bg-white border-t-4 border-t-[#008751] text-[#008751] shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Corporate Tax (CIT)
          </button>
          <button
            onClick={() => setActiveTab("education")}
            className={`flex-1 py-4 text-sm md:text-base font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "education"
                ? "bg-white border-t-4 border-t-[#008751] text-[#008751] shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Learn the Law
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8">
          {activeTab === "personal" && <PersonalTaxCalculator />}
          {activeTab === "corporate" && <CorporateTaxCalculator />}
          {activeTab === "education" && <TaxEducation />}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Personal Tax Calculator ---
const PersonalTaxCalculator = () => {
  const [values, setValues] = useState({
    grossIncome: "",
    pensionRate: 8, // Standard 8%
    nhfRate: 0, // National Housing Fund (2.5% optional often)
    nhisRate: 0, // Health Insurance
    annualRent: "", // For Rent Relief
  });

  const [results, setResults] = useState(null);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  const calculatePAYE = () => {
    const gross = parseFloat(values.grossIncome) || 0;
    const rent = parseFloat(values.annualRent) || 0;

    // 1. Calculate Statutory Deductions (Tax Exempt)
    const pension = gross * (values.pensionRate / 100);
    const nhf = gross * (values.nhfRate / 100);
    const nhis = gross * (values.nhisRate / 100);

    // 2. Calculate New Rent Relief (Lower of N500k or 20% of Rent)
    // Source: Nigeria Tax Act 2025 summaries
    const rentReliefLimit = 500000;
    const rentReliefCalc = rent * 0.2;
    const rentRelief = Math.min(rentReliefLimit, rentReliefCalc);

    const totalExemptions = pension + nhf + nhis + rentRelief;

    // 3. Chargeable Income
    // Note: The N800k threshold is built into the tax bands (0% band), not deducted upfront.
    const chargeableIncome = Math.max(0, gross - totalExemptions);

    // 4. Apply 2026 Tax Bands
    // Band 1: First 800k @ 0%
    // Band 2: Next 2.2m @ 15%
    // Band 3: Next 9.0m @ 18%
    // Band 4: Next 13.0m @ 21%
    // Band 5: Next 25.0m @ 23%
    // Band 6: Above 50m @ 25%

    let tax = 0;
    let incomeToTax = chargeableIncome;
    let breakdown = [];

    const bands = [
      { limit: 800000, rate: 0 },
      { limit: 2200000, rate: 0.15 },
      { limit: 9000000, rate: 0.18 },
      { limit: 13000000, rate: 0.21 },
      { limit: 25000000, rate: 0.23 },
      { limit: Infinity, rate: 0.25 },
    ];

    let processed = 0;

    for (const band of bands) {
      if (incomeToTax <= 0) break;

      const taxableInThisBand = Math.min(incomeToTax, band.limit);
      const taxInThisBand = taxableInThisBand * band.rate;

      breakdown.push({
        band:
          band.rate === 0
            ? "First ₦800k (Tax Free)"
            : `${band.rate * 100}% Band`,
        amount: taxableInThisBand,
        tax: taxInThisBand,
      });

      tax += taxInThisBand;
      incomeToTax -= taxableInThisBand;
      processed += taxableInThisBand;
    }

    setResults({
      gross,
      pension,
      nhf,
      nhis,
      rentRelief,
      totalExemptions,
      chargeableIncome,
      tax,
      netPay: gross - pension - nhf - nhis - tax, // Net Pay = Gross - (Deductions + Tax)
      breakdown,
    });
  };

  useEffect(() => {
    calculatePAYE();
  }, [values]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      {/* Inputs */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Annual Gross Income (₦)
          </label>
          <input
            type="number"
            value={values.grossIncome}
            onChange={(e) =>
              setValues({ ...values, grossIncome: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008751] focus:border-transparent transition"
            placeholder="e.g. 5,000,000"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-blue-800 font-semibold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> Reliefs & Deductions
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pension (%)
              </label>
              <input
                type="number"
                value={values.pensionRate}
                onChange={(e) =>
                  setValues({ ...values, pensionRate: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                NHF (%)
              </label>
              <input
                type="number"
                value={values.nhfRate}
                onChange={(e) =>
                  setValues({ ...values, nhfRate: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Rent Paid (for Relief)
            </label>
            <input
              type="number"
              value={values.annualRent}
              onChange={(e) =>
                setValues({ ...values, annualRent: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 1,500,000"
            />
            <p className="text-xs text-gray-500 mt-1">
              New Law: Relief is 20% of rent, capped at ₦500k.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Calculation Result
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Total Exemptions (Pension/NHF/Rent):
                </span>
                <span className="font-medium text-gray-800">
                  - {formatCurrency(results.totalExemptions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chargeable Income:</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(results.chargeableIncome)}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  Annual Tax Payable
                </span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(results.tax)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600 font-medium">Monthly Tax</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(results.tax / 12)}
                </span>
              </div>
              <div className="flex justify-between items-center  rounded">
                <span className="text-[#008751] font-bold">Annual Net Pay</span>
                <span className="text-lg font-bold text-[#008751]">
                  {formatCurrency(results.netPay)}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Tax Band Breakdown
              </p>
              <div className="space-y-1">
                {results.breakdown.map((b, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500">{b.band}</span>
                    <span className="text-gray-900">
                      {formatCurrency(b.tax)}{" "}
                      <span className="text-gray-400">
                        on {formatCurrency(b.amount)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT: Corporate Tax Calculator ---
const CorporateTaxCalculator = () => {
  const [values, setValues] = useState({
    turnover: "",
    assessableProfit: "",
    assets: "",
  });

  const [result, setResult] = useState(null);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  useEffect(() => {
    const turnover = parseFloat(values.turnover) || 0;
    const profit = parseFloat(values.assessableProfit) || 0;
    const assets = parseFloat(values.assets) || 0;

    // Small Company Logic (2026 Act)
    // Definition: Turnover <= 100m AND Assets <= 250m
    const isSmallCompany = turnover <= 100000000 && assets <= 250000000;

    let cit = 0;
    let devLevy = 0; // Replaces Education Tax
    let breakdown = "";

    if (turnover === 0) {
      setResult(null);
      return;
    }

    if (isSmallCompany) {
      cit = 0;
      devLevy = 0;
      breakdown = "Exempt (Small Company Status)";
    } else {
      // Large Company Rate: 30% (Standard)
      // Note: Medium companies (turnover > 100m) are effectively taxed as large/standard now in many interpretations of the new single consolidation,
      // but usually standard rate is 30%.
      cit = profit * 0.3;

      // Development Levy: 4% of Assessable Profit
      devLevy = profit * 0.04;

      breakdown = "Standard Rate (30% CIT + 4% Dev Levy)";
    }

    setResult({
      isSmallCompany,
      cit,
      devLevy,
      totalTax: cit + devLevy,
      breakdown,
    });
  }, [values]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Annual Turnover (Revenue)
          </label>
          <input
            type="number"
            value={values.turnover}
            onChange={(e) => setValues({ ...values, turnover: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008751]"
            placeholder="Total Sales"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessable Profit
          </label>
          <input
            type="number"
            value={values.assessableProfit}
            onChange={(e) =>
              setValues({ ...values, assessableProfit: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008751]"
            placeholder="Profit before tax adjustments"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Fixed Assets
          </label>
          <input
            type="number"
            value={values.assets}
            onChange={(e) => setValues({ ...values, assets: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008751]"
            placeholder="For Small Company check"
          />
          <p className="text-xs text-gray-500 mt-1">
            New Rule: Companies with Turnover ≤ ₦100m AND Assets ≤ ₦250m are tax
            exempt.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        {result ? (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${result.isSmallCompany ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
            >
              {result.isSmallCompany ? (
                <CheckCircle2 className="w-6 h-6 shrink-0" />
              ) : (
                <Building2 className="w-6 h-6 shrink-0" />
              )}
              <div>
                <h4 className="font-bold">
                  {result.isSmallCompany
                    ? "Small Company Status"
                    : "Standard Company Status"}
                </h4>
                <p className="text-sm opacity-90">{result.breakdown}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Company Income Tax (CIT)</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(result.cit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Development Levy (4%)</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(result.devLevy)}
                </span>
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">
                    Total Tax Liability
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(result.totalTax)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Calculator className="w-12 h-12 mb-2 opacity-20" />
            <p>Enter turnover to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT: Educational Guide ---
const TaxEducation = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggle = (id) => setOpenSection(openSection === id ? null : id);

  const GuideItem = ({ id, title, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        {openSection === id ? "-" : "+"}
      </button>
      {openSection === id && (
        <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
        <div>
          <h4 className="font-bold text-yellow-800">
            Effective January 1, 2026
          </h4>
          <p className="text-sm text-yellow-700">
            The information below is based on the{" "}
            <strong>Nigeria Tax Act 2025</strong>. Old laws like the "CRA"
            (Consolidated Relief Allowance) and "Tertiary Education Tax" have
            been abolished or renamed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Personal Tax Changes
          </h3>
          <GuideItem id="p1" title="What happened to the CRA?">
            <p>
              The <strong>Consolidated Relief Allowance (CRA)</strong>—which
              used to give you ₦200,000 + 20% of income tax-free—has been{" "}
              <strong>abolished</strong>.
            </p>
            <p className="mt-2">
              It has been replaced by specific deductions (like Rent Relief) and
              a new generous tax-free income band. The first ₦800,000 you earn
              every year is now completely tax-free (0% tax rate).
            </p>
          </GuideItem>
          <GuideItem id="p2" title="How does the new Rent Relief work?">
            <p>
              You can now deduct <strong>20% of your annual rent</strong> from
              your taxable income.
            </p>
            <p className="mt-2">
              However, there is a cap: the maximum relief you can claim is{" "}
              <strong>₦500,000</strong>. If 20% of your rent is higher than
              ₦500k, you only get ₦500k relief.
            </p>
          </GuideItem>
          <GuideItem id="p3" title="What are the new Tax Bands?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>First ₦800k:</strong> 0% (Tax Free)
              </li>
              <li>
                <strong>Next ₦2.2m:</strong> 15%
              </li>
              <li>
                <strong>Next ₦9.0m:</strong> 18%
              </li>
              <li>
                <strong>Next ₦13m:</strong> 21%
              </li>
              <li>
                <strong>Next ₦25m:</strong> 23%
              </li>
              <li>
                <strong>Above ₦50m:</strong> 25%
              </li>
            </ul>
            <p className="mt-2">
              This is a "progressive" system. You only pay the higher rate on
              the money that falls into that specific chunk, not your whole
              salary.
            </p>
          </GuideItem>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Corporate Tax Changes
          </h3>
          <GuideItem id="c1" title="Small Company Exemption">
            <p>
              If your company earns <strong>₦100 Million or less</strong> in a
              year (Turnover), AND your fixed assets are worth{" "}
              <strong>₦250 Million or less</strong>, you are classified as a
              "Small Company".
            </p>
            <p className="mt-2 font-medium text-green-600">
              Small Companies pay 0% Corporate Income Tax.
            </p>
          </GuideItem>
          <GuideItem id="c2" title="What is the Development Levy?">
            <p>
              The old "Tertiary Education Tax" (2.5% or 3%) and "Police Trust
              Fund" levies are gone.
            </p>
            <p className="mt-2">
              They are replaced by a single{" "}
              <strong>Development Levy of 4%</strong> charged on your assessable
              profit. Small companies are exempt from this levy.
            </p>
          </GuideItem>
          <GuideItem id="c3" title="What is the Corporate Tax Rate?">
            <p>
              For most companies (Medium and Large), the standard Companies
              Income Tax (CIT) rate remains at <strong>30%</strong> of
              assessable profit.
            </p>
          </GuideItem>
        </div>
      </div>
    </div>
  );
};

export default NigeriaTaxCalculator;

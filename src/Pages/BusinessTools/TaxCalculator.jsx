import { useState, useEffect } from "react";
import {
  Calculator,
  Building2,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Wallet,
  Percent,
} from "lucide-react";
import BacktoTools from "../../components/BacktoTools";

const NigeriaTaxCalculator = () => {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-20">
      <div className="max-w-7xl mx-auto">
        <BacktoTools />
        {/* Header Banner */}
        <div className="bg-[#008751] rounded-2xl p-8 mb-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Calculator className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  Tax Calculator <span className="text-green-200">2026</span>
                </h1>
                <p className="text-green-50 opacity-90 text-sm md:text-base">
                  Based on the <strong>Nigeria Tax Act 2025</strong> (Effective
                  Jan 1, 2026).
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-xs font-bold uppercase tracking-widest">
              Updated for 2026 Act
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-fit mx-auto">
          {[
            { id: "personal", label: "Personal Tax (PAYE)", icon: Wallet },
            { id: "corporate", label: "Corporate Tax (CIT)", icon: Building2 },
            { id: "education", label: "Learn the Law", icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[#008751] text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    pensionRate: 8,
    nhfRate: 0,
    nhisRate: 0,
    annualRent: "",
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

    const pension = gross * (values.pensionRate / 100);
    const nhf = gross * (values.nhfRate / 100);
    const nhis = gross * (values.nhisRate / 100);

    const rentReliefLimit = 500000;
    const rentReliefCalc = rent * 0.2;
    const rentRelief = Math.min(rentReliefLimit, rentReliefCalc);

    const totalExemptions = pension + nhf + nhis + rentRelief;
    const chargeableIncome = Math.max(0, gross - totalExemptions);

    let tax = 0;
    let incomeToTax = chargeableIncome;
    let breakdown = [];

    const bands = [
      { limit: 800000, rate: 0, label: "First ₦800k" },
      { limit: 2200000, rate: 0.15, label: "Next ₦2.2m" },
      { limit: 9000000, rate: 0.18, label: "Next ₦9.0m" },
      { limit: 13000000, rate: 0.21, label: "Next ₦13m" },
      { limit: 25000000, rate: 0.23, label: "Next ₦25m" },
      { limit: Infinity, rate: 0.25, label: "Above ₦50m" },
    ];

    for (const band of bands) {
      if (incomeToTax <= 0) break;
      const taxableInThisBand = Math.min(incomeToTax, band.limit);
      const taxInThisBand = taxableInThisBand * band.rate;

      breakdown.push({
        label: band.label,
        rate: `${band.rate * 100}%`,
        amount: taxableInThisBand,
        tax: taxInThisBand,
      });

      tax += taxInThisBand;
      incomeToTax -= taxableInThisBand;
    }

    setResults({
      gross,
      totalExemptions,
      chargeableIncome,
      tax,
      netPay: gross - pension - nhf - nhis - tax,
      breakdown,
    });
  };

  useEffect(() => {
    calculatePAYE();
  }, [values]);

  return (
    <div className="grid grid-cols-1lg:grid-cols-12 text-gray-700  gap-8 items-start">
      {/* Inputs Column */}
      <div className="lg:col-span-5 space-y-6 text-gray-700 ">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Landmark className="text-[#008751] w-5 h-5" /> Income Details
          </h2>
          <div className="space-y-6 flex flex-col w-full">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Annual Gross Income (₦)
              </label>
              <input
                type="number"
                value={values.grossIncome}
                onChange={(e) =>
                  setValues({ ...values, grossIncome: e.target.value })
                }
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751] transition-all font-bold text-lg"
                placeholder="e.g. 5,000,000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Pension (%)
                </label>
                <input
                  type="number"
                  value={values.pensionRate}
                  onChange={(e) =>
                    setValues({ ...values, pensionRate: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  NHF (%)
                </label>
                <input
                  type="number"
                  value={values.nhfRate}
                  onChange={(e) =>
                    setValues({ ...values, nhfRate: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Annual Rent (for Relief)
              </label>
              <input
                type="number"
                value={values.annualRent}
                onChange={(e) =>
                  setValues({ ...values, annualRent: e.target.value })
                }
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
                placeholder="e.g. 1,500,000"
              />
              <p className="text-[10px] text-gray-400 mt-2 italic font-medium leading-tight">
                *Relief is 20% of rent, capped at ₦500,000 annually.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 p-8 border-b border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-1">
              Tax Summary
            </h2>
            <p className="text-gray-500 text-sm">Calculated annual breakdown</p>
          </div>

          <div className="p-8 space-y-8">
            {/* NEW EXTRA TIP SECTION */}
            {results && (
              <div className="p-4 bg-[#008751]/5 border-l-4 border-[#008751] rounded-r-xl">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-black text-[#008751]">Pro Tip: </span>
                  {results.tax === 0 ? (
                    <>
                      You are <strong>not paying any tax</strong> because your
                      chargeable income of{" "}
                      {formatCurrency(results.chargeableIncome)} falls entirely
                      within the <strong>₦800,000 tax-free threshold</strong>.
                    </>
                  ) : (
                    <>
                      You are paying{" "}
                      <strong>{formatCurrency(results.tax)}</strong> in tax for
                      the year because your income exceeds the ₦800,000 tax-free
                      limit. You are only taxed on the{" "}
                      <strong>
                        {formatCurrency(results.chargeableIncome)}
                      </strong>{" "}
                      remaining after your exemptions (pension, rent, etc.) are
                      removed.
                    </>
                  )}
                </p>
              </div>
            )}
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                  Annual Tax Payable
                </p>
                <p className="text-3xl font-black text-red-600">
                  {formatCurrency(results?.tax || 0)}
                </p>
                <p className="text-xs text-red-500 font-medium mt-1">
                  Monthly: {formatCurrency((results?.tax || 0) / 12)}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">
                  Annual Take-Home (Net)
                </p>
                <p className="text-3xl font-black text-green-600">
                  {formatCurrency(results?.netPay || 0)}
                </p>
                <p className="text-xs text-green-500 font-medium mt-1">
                  Monthly: {formatCurrency((results?.netPay || 0) / 12)}
                </p>
              </div>
            </div>

            {/* Band Breakdown */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Tax Band Analysis
              </h3>
              <div className="space-y-3">
                {results?.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black text-[#008751] shadow-sm">
                        {item.rate}
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">
                        {formatCurrency(item.tax)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        on {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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

    if (turnover === 0) return setResult(null);

    const isSmallCompany = turnover <= 100000000 && assets <= 250000000;
    const cit = isSmallCompany ? 0 : profit * 0.3;
    const devLevy = isSmallCompany ? 0 : profit * 0.04;

    setResult({ isSmallCompany, cit, devLevy, totalTax: cit + devLevy });
  }, [values]);

  return (
    <div className="grid grid-cols-1 text-gray-700  lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-6">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="text-[#008751] w-5 h-5" /> Business Metrics
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Annual Turnover (Revenue)
            </label>
            <input
              type="number"
              value={values.turnover}
              onChange={(e) =>
                setValues({ ...values, turnover: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
              placeholder="Total Sales"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Assessable Profit
            </label>
            <input
              type="number"
              value={values.assessableProfit}
              onChange={(e) =>
                setValues({ ...values, assessableProfit: e.target.value })
              }
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
              placeholder="Profit after adjustments"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Total Fixed Assets
            </label>
            <input
              type="number"
              value={values.assets}
              onChange={(e) => setValues({ ...values, assets: e.target.value })}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
              placeholder="Value of company assets"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
          <div className="bg-gray-50 p-8 border-b border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-1">
              Liability Assessment
            </h2>
            <p className="text-gray-500 text-sm">
              Corporate tax compliance report
            </p>
          </div>

          <div className="p-8 flex-grow flex flex-col justify-center">
            {result ? (
              <div className="space-y-8">
                {/* NEW EXTRA TIP SECTION */}
                <div
                  className={`p-4 border-l-4 rounded-r-xl ${result.isSmallCompany ? "bg-green-50 border-green-500" : "bg-blue-50 border-blue-500"}`}
                >
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span
                      className={`font-black ${result.isSmallCompany ? "text-green-600" : "text-blue-600"}`}
                    >
                      Business Tip:{" "}
                    </span>
                    {result.isSmallCompany ? (
                      <>
                        Your business is{" "}
                        <strong>not paying any CIT or Development Levy</strong>{" "}
                        because your turnover is ₦100M or less and assets are
                        ₦250M or less, qualifying you as a{" "}
                        <strong>Small Company</strong> under the 2026 Act.
                      </>
                    ) : (
                      <>
                        You are paying{" "}
                        <strong>{formatCurrency(result.totalTax)}</strong> in
                        total tax. This is because your company exceeds the
                        small business threshold, triggering the{" "}
                        <strong>30% CIT</strong> and the new{" "}
                        <strong>4% Development Levy</strong> on your assessable
                        profit.
                      </>
                    )}
                  </p>
                </div>
                <div
                  className={`p-6 rounded-2xl flex items-center gap-4 border ${
                    result.isSmallCompany
                      ? "bg-green-50 border-green-100 text-green-800"
                      : "bg-blue-50 border-blue-100 text-blue-800"
                  }`}
                >
                  {result.isSmallCompany ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <Landmark className="w-10 h-10" />
                  )}
                  <div>
                    <h4 className="font-black text-lg">
                      {result.isSmallCompany
                        ? "Tax Exempt"
                        : "Standard Company"}
                    </h4>
                    <p className="text-sm opacity-80">
                      {result.isSmallCompany
                        ? "Classified as a small company under the 2026 Act."
                        : "Standard tax rates (30% CIT + 4% Levy) apply."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-bold text-gray-500">CIT (30%)</span>
                    <span className="font-black text-gray-900">
                      {formatCurrency(result.cit)}
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-bold text-gray-500">
                      Development Levy (4%)
                    </span>
                    <span className="font-black text-gray-900">
                      {formatCurrency(result.devLevy)}
                    </span>
                  </div>
                  <div className="flex justify-between p-6 bg-[#008751]/5 border border-[#008751]/10 rounded-2xl mt-4">
                    <span className="text-xl font-black text-[#008751]">
                      Total Tax Liability
                    </span>
                    <span className="text-2xl font-black text-red-600">
                      {formatCurrency(result.totalTax)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Calculator className="w-16 h-16 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-medium italic">
                  Enter business metrics to see the calculation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Educational Guide ---
const TaxEducation = () => {
  const [openSection, setOpenSection] = useState(null);

  const GuideItem = ({ id, title, children }) => (
    <div className="bg-white rounded-2xl text-gray-700  shadow-sm border border-gray-100 overflow-hidden mb-4">
      <button
        onClick={() => setOpenSection(openSection === id ? null : id)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-black text-gray-800">{title}</span>
        <div
          className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${openSection === id ? "rotate-180" : ""}`}
        >
          <Percent className="w-4 h-4 text-gray-400" />
        </div>
      </button>
      {openSection === id && (
        <div className="p-8 pt-0 mt-4 text-gray-600 text-sm leading-relaxed animate-in slide-in-from-top-4">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 p-6 bg-yellow-50 border border-yellow-200 rounded-3xl flex gap-4">
        <div>
          <h4 className="font-black text-yellow-800 text-lg">
            Legislative Update
          </h4>
          <p className="text-sm text-yellow-700 font-medium">
            This calculator implements the <strong>Nigeria Tax Act 2025</strong>
            . These changes supersede the old CRA and Tertiary Education Tax
            laws effective January 1, 2026.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-black text-gray-900 mb-6 px-2">
            Personal Taxation
          </h3>
          <GuideItem id="p1" title="Abolishment of CRA">
            The Consolidated Relief Allowance is replaced by a high 0% tax band.
            The first ₦800,000 you earn annually is completely exempt from
            taxation.
          </GuideItem>
          <GuideItem id="p2" title="Rent Relief (New)">
            Deduct 20% of your rent from taxable income, capped at ₦500,000
            annually. This is a significant direct relief for tenants.
          </GuideItem>
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 mb-6 px-2">
            Corporate Taxation
          </h3>
          <GuideItem id="c1" title="Small Business Exemption">
            Businesses with turnover ≤ ₦100M and assets ≤ ₦250M pay 0% CIT. This
            is designed to drive MSME growth in Nigeria.
          </GuideItem>
          <GuideItem id="c2" title="Development Levy (4%)">
            Replaces Tertiary Education Tax. It is a consolidated 4% levy on
            assessable profit for large and medium enterprises.
          </GuideItem>
        </div>
      </div>
    </div>
  );
};

export default NigeriaTaxCalculator;

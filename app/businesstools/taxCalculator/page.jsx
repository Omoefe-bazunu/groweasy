"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Building2,
  BookOpen,
  Landmark,
  Wallet,
  Percent,
  CheckCircle2,
} from "lucide-react";
import BacktoTools from "@/components/Shared/BacktoTools";

// --- HELPER: Move GuideItem OUTSIDE the render function ---
const GuideItem = ({ id, title, children, openSection, setOpenSection }) => (
  <div className="bg-white rounded-2xl text-gray-700 shadow-sm border border-gray-100 overflow-hidden mb-4">
    <button
      onClick={() => setOpenSection(openSection === id ? null : id)}
      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
    >
      <span className="font-black text-gray-800">{title}</span>
      <div
        className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${
          openSection === id ? "rotate-180" : ""
        }`}
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

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  // --- USE useMemo instead of useEffect ---
  const results = useMemo(() => {
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

    return {
      gross,
      totalExemptions,
      chargeableIncome,
      tax,
      netPay: gross - pension - nhf - nhis - tax,
      breakdown,
    };
  }, [values]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 text-gray-700 gap-8 items-start">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Landmark className="text-[#008751] w-5 h-5" /> Income Details
          </h2>
          <div className="space-y-6">
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
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751] font-bold text-lg"
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
                Annual Rent
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
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8 space-y-8">
          <div className="p-4 bg-[#008751]/5 border-l-4 border-[#008751] rounded-r-xl">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-black text-[#008751]">Pro Tip: </span>
              {results.tax === 0 ? (
                <>
                  You are <strong>not paying any tax</strong> because your
                  income falls within the{" "}
                  <strong>₦800,000 tax-free threshold</strong>.
                </>
              ) : (
                <>
                  You are paying <strong>{formatCurrency(results.tax)}</strong>{" "}
                  annually because your income exceeds the ₦800k limit.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                Annual Tax
              </p>
              <p className="text-3xl font-black text-red-600">
                {formatCurrency(results.tax)}
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">
                Annual Net
              </p>
              <p className="text-3xl font-black text-green-600">
                {formatCurrency(results.netPay)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {results.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <span className="text-sm font-bold text-gray-700">
                  {item.label} ({item.rate})
                </span>
                <span className="text-sm font-black text-gray-900">
                  {formatCurrency(item.tax)}
                </span>
              </div>
            ))}
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

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(val);

  const result = useMemo(() => {
    const turnover = parseFloat(values.turnover) || 0;
    const profit = parseFloat(values.assessableProfit) || 0;
    const assets = parseFloat(values.assets) || 0;

    if (turnover === 0) return null;

    const isSmallCompany = turnover <= 100000000 && assets <= 250000000;
    const cit = isSmallCompany ? 0 : profit * 0.3;
    const devLevy = isSmallCompany ? 0 : profit * 0.04;

    return { isSmallCompany, cit, devLevy, totalTax: cit + devLevy };
  }, [values]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-gray-700">
      <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-6">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="text-[#008751] w-5 h-5" /> Business Metrics
        </h2>
        <div className="space-y-5">
          <input
            type="number"
            value={values.turnover}
            onChange={(e) => setValues({ ...values, turnover: e.target.value })}
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
            placeholder="Annual Turnover"
          />
          <input
            type="number"
            value={values.assessableProfit}
            onChange={(e) =>
              setValues({ ...values, assessableProfit: e.target.value })
            }
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#008751]"
            placeholder="Assessable Profit"
          />
        </div>
      </div>

      <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl p-8">
        {result ? (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-2xl border ${result.isSmallCompany ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100"}`}
            >
              <h4 className="font-black text-lg">
                {result.isSmallCompany ? "Tax Exempt" : "Standard Company"}
              </h4>
              <p className="text-sm">
                Total Tax Liability:{" "}
                <span className="font-black text-red-600">
                  {formatCurrency(result.totalTax)}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 italic">
            Enter metrics to calculate...
          </p>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT: Educational Guide ---
const TaxEducation = () => {
  const [openSection, setOpenSection] = useState(null);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 p-6 bg-yellow-50 border border-yellow-200 rounded-3xl">
        <h4 className="font-black text-yellow-800 text-lg">
          Legislative Update
        </h4>
        <p className="text-sm text-yellow-700">
          Implementing the <strong>Nigeria Tax Act 2025</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-black text-gray-900 mb-6 px-2">
            Personal Taxation
          </h3>
          <GuideItem
            id="p1"
            title="Abolishment of CRA"
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            The first ₦800,000 earned annually is exempt from taxation.
          </GuideItem>
          <GuideItem
            id="p2"
            title="Rent Relief"
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            Deduct 20% of rent, capped at ₦500,000 annually.
          </GuideItem>
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 mb-6 px-2">
            Corporate Taxation
          </h3>
          <GuideItem
            id="c1"
            title="Small Business Exemption"
            openSection={openSection}
            setOpenSection={setOpenSection}
          >
            Turnover ≤ ₦100M and assets ≤ ₦250M pay 0% CIT.
          </GuideItem>
        </div>
      </div>
    </div>
  );
};

export default NigeriaTaxCalculator;

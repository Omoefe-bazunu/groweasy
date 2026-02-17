import { useState } from "react";
import {
  FileText,
  Receipt,
  Banknote,
  BarChart3,
  FileJson,
  ChevronDown,
  ChevronUp,
  BookOpen,
  PieChart,
  Package,
} from "lucide-react";

const KnowledgeBase = () => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleCard = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const documents = [
    {
      id: "quotations",
      title: "Quotations (Estimates)",
      icon: FileText,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200",
      whatIsIt:
        "A Quotation is a document you send to a client *before* you start working. It tells them exactly how much you plan to charge for your goods or services.",
      whenToUse: [
        "When a client asks 'How much will this cost?'",
        "To agree on a price before starting a project so there are no arguments later.",
        "To outline exactly what is included (and what isn't) in your service.",
      ],
    },
    {
      id: "invoices",
      title: "Invoices",
      icon: FileJson,
      color: "text-[#5247bf]",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      whatIsIt:
        "An Invoice is a formal request for payment. You send this after you have delivered the goods or finished the work (or reached a milestone).",
      whenToUse: [
        "When you have finished a job and want to get paid.",
        "When selling goods on credit (the customer pays later).",
        "To give the client a formal record of what they owe you.",
      ],
    },
    {
      id: "receipts",
      title: "Receipts",
      icon: Receipt,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      whatIsIt:
        "A Receipt is proof of payment. It confirms that you have actually received the money from the client.",
      whenToUse: [
        "Immediately after a customer pays you cash.",
        "After a bank transfer clears in your account.",
        "When a client needs proof of purchase for their own records.",
      ],
    },
    {
      id: "payroll",
      title: "Payroll (Payslips)",
      icon: Banknote,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      whatIsIt:
        "Payroll is the process of paying your employees. A Payslip is the document given to staff showing how their final salary was calculated.",
      whenToUse: [
        "At the end of every month (or week) when paying salaries.",
        "To keep records of tax deductions and bonuses.",
        "To provide employees with proof of income for loans or rent.",
      ],
      keyTerms: [
        {
          term: "Allowances",
          def: "Extra money added to the basic salary — Transport, Housing, Lunch, or Wardrobe allowances.",
        },
        {
          term: "Deductions",
          def: "Money subtracted from the salary — Taxes (PAYE), Pension, Health Insurance, or salary loan repayments.",
        },
        {
          term: "Net Pay",
          def: "The final amount that lands in the employee's account (Basic Salary + Allowances − Deductions).",
        },
      ],
    },
    {
      id: "finance",
      title: "Financial Records",
      icon: BarChart3,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      whatIsIt:
        "Financial Records track your Cash Inflow (money coming in) and Cash Outflow (money going out). It is the health monitor of your business.",
      whenToUse: [
        "Every time you spend money on business expenses (Outflow).",
        "Every time you receive a payment (Inflow).",
        "Review weekly to see if you are making a profit or losing money.",
      ],
      keyTerms: [
        {
          term: "Inflow",
          def: "Any money that enters the business — sales, client payments, refunds received.",
        },
        {
          term: "Outflow",
          def: "Any money that leaves the business — rent, salaries, supplies, bills.",
        },
        {
          term: "Net Balance",
          def: "Total Inflow minus Total Outflow. A positive balance means profit; negative means you spent more than you earned.",
        },
      ],
    },
    {
      id: "budgets",
      title: "Budgets",
      icon: PieChart,
      color: "text-violet-500",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
      whatIsIt:
        "A Budget is a financial plan that sets spending limits and income targets for a specific period — weekly, monthly, quarterly, or annually. It helps you control where your money goes before you spend it.",
      whenToUse: [
        "At the start of a new month or quarter to plan your expected income and expenses.",
        "When launching a project and you need to estimate costs upfront.",
        "To compare what you planned to spend vs. what you actually spent.",
        "When trying to reduce expenses or save towards a business goal.",
      ],
      keyTerms: [
        {
          term: "Allocated Amount",
          def: "The amount you planned or budgeted for a category before the period starts.",
        },
        {
          term: "Actual Amount",
          def: "The amount you actually spent or earned in that category by the end of the period.",
        },
        {
          term: "Variance",
          def: "The difference between Allocated and Actual. A positive variance means you saved; negative means you overspent.",
        },
        {
          term: "Budget Period",
          def: "The time frame your budget covers — Weekly, Monthly, Quarterly, or Annual.",
        },
      ],
    },
    {
      id: "inventory",
      title: "Inventory",
      icon: Package,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      whatIsIt:
        "Inventory is a real-time record of the physical goods or products your business holds in stock. It tracks what you have, how much it's worth, and when stock is running low.",
      whenToUse: [
        "Every time you receive new stock from a supplier (stock in).",
        "Every time you sell a product and need to reduce your stock count (stock out).",
        "To know when to reorder before you run out of a product.",
        "To calculate the total value of goods you currently hold.",
      ],
      keyTerms: [
        {
          term: "Stock In",
          def: "Adding items to your inventory — when you purchase new goods or receive a delivery.",
        },
        {
          term: "Stock Out",
          def: "Removing items from inventory — when goods are sold, used, or damaged.",
        },
        {
          term: "Reorder Level",
          def: "The minimum quantity at which you should place a new order so you never run out.",
        },
        {
          term: "Stock Valuation",
          def: "The total monetary value of all items currently in your inventory (Quantity × Unit Cost).",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-25 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Business Knowledge Base
          </h1>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            Confused about which document to use? Here is a simple guide to
            understanding your business paperwork.
          </p>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => {
            const Icon = doc.icon;
            const isOpen = expandedId === doc.id;

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "ring-2 ring-offset-2 ring-blue-100"
                    : "hover:shadow-md"
                }`}
              >
                <button
                  onClick={() => toggleCard(doc.id)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg shrink-0 ${doc.bgColor} ${doc.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doc.title}
                      </h3>
                      {!isOpen && (
                        <p className="text-sm text-gray-500 mt-1 max-w-xs md:max-w-md line-clamp-2">
                          {doc.whatIsIt}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 pt-0">
                    <div className="pl-[4.5rem]">
                      <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                        <p className="text-base leading-relaxed border-l-4 border-gray-200 pl-4 italic">
                          {doc.whatIsIt}
                        </p>

                        <div>
                          <h4
                            className={`text-sm font-bold uppercase tracking-wider mb-2 ${doc.color}`}
                          >
                            When to use it
                          </h4>
                          <ul className="list-disc list-outside ml-4 space-y-1 text-sm">
                            {doc.whenToUse.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {doc.keyTerms && (
                          <div
                            className={`mt-4 p-4 rounded-lg ${doc.bgColor} border ${doc.borderColor}`}
                          >
                            <h4
                              className={`text-sm font-bold uppercase tracking-wider mb-3 ${doc.color}`}
                            >
                              Key Terms to Know
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {doc.keyTerms.map((term, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white p-3 rounded shadow-sm"
                                >
                                  <span className="block font-bold text-gray-800 text-sm mb-1">
                                    {term.term}
                                  </span>
                                  <span className="block text-xs text-gray-600 leading-snug">
                                    {term.def}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;

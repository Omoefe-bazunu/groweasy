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
        "An Invoice is a formal request for payment. You send this *after* you have delivered the goods or finished the work (or reached a milestone).",
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
          def: "Extra money added to the basic salary. These are benefits like Transport, Housing, Lunch, or Wardrobe allowances.",
        },
        {
          term: "Deductions",
          def: "Money subtracted from the salary. This includes Taxes (PAYE), Pension contributions, Health Insurance, or repayment of salary loans.",
        },
        {
          term: "Net Pay",
          def: "The final amount that actually lands in the employee's bank account (Basic Salary + Allowances - Deductions).",
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
        "This refers to tracking your Cash Inflow (money coming in) and Cash Outflow (money going out). It is the health monitor of your business.",
      whenToUse: [
        "Every time you spend money on business expenses (Outflow).",
        "Every time you receive a payment (Inflow).",
        "Review this weekly to see if you are making a profit or losing money.",
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
                className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${isOpen ? "ring-2 ring-offset-2 ring-blue-100" : "hover:shadow-md"}`}
              >
                <button
                  onClick={() => toggleCard(doc.id)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${doc.bgColor} ${doc.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doc.title}
                      </h3>
                      {!isOpen && (
                        <p className="text-sm text-gray-500 text-wrap mt-1 max-w-xs md:max-w-md">
                          {doc.whatIsIt}
                        </p>
                      )}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="pl-[4.5rem]">
                      {" "}
                      {/* Indent to align with text, skipping icon width */}
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

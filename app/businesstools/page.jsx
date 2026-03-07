"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  ClipboardList,
  BookOpen,
  Calculator,
  Package2,
  User2Icon,
  ArrowRight,
  Star,
  CalendarCheck2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const BusinessTools = () => {
  const router = useRouter();

  const creationOptions = [
    {
      id: "quotations",
      title: "Quotations",
      icon: <ClipboardList className="w-6 h-6" />,
      description: "Generate and manage professional business quotations.",
      action: () => router.push("/businesstools/quotation"),
      color: "bg-blue-50",
    },
    {
      id: "invoices",
      title: "Invoices",
      icon: <ClipboardList className="w-6 h-6" />,
      description: "Create and track invoices for your clients.",
      action: () => router.push("/businesstools/invoice"),
      color: "bg-purple-50",
    },
    {
      id: "receipts",
      title: "Receipts",
      icon: <FileText className="w-6 h-6" />,
      description: "Issue payment receipts instantly.",
      action: () => router.push("/businesstools/receipt"),
      color: "bg-green-50",
    },
    {
      id: "payroll",
      title: "Payroll",
      icon: <FileText className="w-6 h-6" />,
      description: "Manage employee salaries and payments.",
      action: () => router.push("/businesstools/payroll"),
      color: "bg-yellow-50",
    },
    {
      id: "financial-records",
      title: "Financial Records",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Track income and expenses in one place.",
      action: () => router.push("/businesstools/finance"),
      color: "bg-indigo-50",
    },
    {
      id: "budgets",
      title: "Budgets",
      icon: <CalendarCheck2 className="w-6 h-6" />,
      description: "Create and manage budgets for your business.",
      action: () => router.push("/businesstools/budget"),
      color: "bg-red-50",
    },
    {
      id: "receivables",
      title: "Receivables",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Track money owed to you by customers.",
      action: () => router.push("/businesstools/receivables"),
      color: "bg-emerald-50",
    },
    {
      id: "payables",
      title: "Payables",
      icon: <TrendingDown className="w-6 h-6" />,
      description: "Manage amounts you owe to suppliers.",
      action: () => router.push("/businesstools/payables"),
      color: "bg-rose-50",
    },
    {
      id: "tax-calculator",
      title: "Tax Calculator",
      icon: <Calculator className="w-6 h-6" />,
      description: "Calculate tax liabilities with ease. (Nigeria only)",
      action: () => router.push("/businesstools/taxCalculator"),
      color: "bg-red-50",
    },
    {
      id: "inventory",
      title: "Inventory Manager",
      icon: <Package2 className="w-6 h-6" />,
      description: "Keep track of your stock and products.",
      action: () => router.push("/businesstools/inventory"),
      color: "bg-orange-50",
    },
    {
      id: "customers",
      title: "Customers",
      icon: <User2Icon className="w-6 h-6" />,
      description: "Maintain a directory of your clients.",
      action: () => router.push("/businesstools/customers"),
      color: "bg-teal-50",
    },
    {
      id: "satisfaction",
      title: "Customer Satisfaction",
      icon: <Star className="w-6 h-6" />,
      description:
        "Track ratings, analyze scores, and share your feedback link.",
      action: () => router.push("/businesstools/rate"),
      color: "bg-amber-50",
    },
    {
      id: "tasks",
      title: "Business Tasks",
      icon: <BookOpen className="w-6 h-6" />,
      description: "Organize and plan daily business operations.",
      action: () => router.push("/businesstools/task"),
      color: "bg-cyan-50",
    },
  ];

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-12 md:py-16 font-sans">
      {/* Background Image Optimization */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/gebg.jpg"
          alt="GrowEasy Tools Background"
          fill
          priority
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-brand-warm/80" />
      </div>

      <div className="max-w-7xl mx-auto animate-page-reveal">
        {/* Header Banner */}
        <div className="bg-brand-primary rounded-[2.5rem] p-10 mb-12 shadow-2xl text-center max-w-4xl mx-auto text-white">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            Business Tools
          </h1>
          <p className="text-indigo-100 font-medium opacity-90 max-w-xl mx-auto text-sm md:text-base">
            Everything you need to manage your business operations efficiently,
            built for the Nigerian entrepreneur.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24">
          {creationOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={option.action}
              className="group bg-white/95 border-b-4 border-brand-primary backdrop-blur-sm rounded-[2rem] p-8 shadow-lg hover:shadow-2xl hover-lift transition-all duration-300 flex flex-col justify-between cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <div
                  className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-all duration-300`}
                >
                  <div className="text-brand-primary group-hover:text-white transition-colors duration-300">
                    {option.icon}
                  </div>
                </div>
                <h3 className="text-xl font-black text-brand-dark mb-2 uppercase tracking-tight">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                  {option.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-brand-primary font-black uppercase text-[10px] tracking-widest">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessTools;

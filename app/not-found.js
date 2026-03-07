"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-warm flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="animate-page-reveal max-w-md w-full">
        {/* Visual Icon */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-brand-primary opacity-10 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-gray-100">
            <FileQuestion className="w-12 h-12 text-brand-primary animate-bounce" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-8xl font-black text-brand-dark uppercase tracking-tighter leading-none mb-4">
          404
        </h1>
        <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 font-medium mb-10 leading-relaxed">
          It looks like this business tool or record went off the grid.
          Don&apos;t worry, your data is safe—this URL just doesn&apos;t exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-active hover-lift transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>

          <Link
            href="/contact"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-brand-primary text-brand-primary px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all"
          >
            Report Issue
          </Link>
        </div>

        {/* Branding Footer */}
        <div className="mt-16">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
            Powered by HIGH-ER ENTERPRISES
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCopy, Info } from "lucide-react";
import { FaStar } from "react-icons/fa";
import { MdContactPage } from "react-icons/md";

const TopNav = () => {
  const router = useRouter();

  // Navigation handlers
  const handleLogoClick = () => router.push("/dashboard");
  const handleContactClick = () => router.push("/contact");
  const handleAboutClick = () => router.push("/about");
  const handleTestimonialsClick = () => router.push("/testimonials");
  const handleKnowledgeBaseClick = () => router.push("/knowledgeBase");

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={handleLogoClick}
          >
            <h1 className="text-[#5247bf] font-bold text-2xl">GrowEasy</h1>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-[#5247bf] font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/knowledgeBase"
              className="text-gray-600 hover:text-[#5247bf] font-medium"
            >
              Knowledge Base
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-[#5247bf] font-medium"
            >
              About
            </Link>
            <Link
              href="/testimonials"
              className="text-gray-600 hover:text-[#5247bf] font-medium"
            >
              Testimonials
            </Link>
            <button
              onClick={handleContactClick}
              className="bg-[#5247bf] text-white px-5 py-2 rounded-lg hover:bg-[#4339a3] transition-colors"
            >
              Contact Us
            </button>
          </div>

          {/* Mobile Navigation Icons */}
          <div className="flex md:hidden space-x-5 items-center">
            <button
              onClick={handleKnowledgeBaseClick}
              className="text-[#5247bf]"
              title="Knowledge Base"
            >
              <BookCopy className="w-6 h-6" />
            </button>
            <button
              onClick={handleContactClick}
              className="text-[#5247bf]"
              title="Contact"
            >
              <MdContactPage className="w-6 h-6" />
            </button>
            <button
              onClick={handleAboutClick}
              className="text-[#5247bf]"
              title="About"
            >
              <Info className="w-6 h-6" />
            </button>
            <button
              onClick={handleTestimonialsClick}
              className="text-[#5247bf]"
              title="Testimonials"
            >
              <FaStar className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;

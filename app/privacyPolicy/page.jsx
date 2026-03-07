import React from "react";
import { Shield, Lock, Eye, FileText, Globe } from "lucide-react";

const PrivacyPolicy = () => {
  const lastUpdated = "February 17, 2026";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#5247bf] p-8 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-indigo-100 font-medium">
            GrowEasy by HIGH-ER ENTERPRISES
          </p>
          <p className="text-xs mt-4 opacity-70">Last Updated: {lastUpdated}</p>
        </div>

        <div className="p-6 md:p-12 space-y-10">
          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <Eye className="w-6 h-6 text-[#5247bf]" /> 1. Data We Collect
            </h2>
            <p className="leading-relaxed mb-4">
              To provide our business management services, we collect
              information that you provide directly to us:
            </p>
            <ul className="list-disc ml-6 space-y-2 font-medium text-gray-700">
              <li>
                <strong>Account Information:</strong> Name, email address, and
                business details.
              </li>
              <li>
                <strong>Business Data:</strong> Inventory items, payroll
                details, invoices, receipts, and financial records.
              </li>
              <li>
                <strong>Payment Proofs:</strong> Images or documents uploaded as
                evidence of subscription payments.
              </li>
              <li>
                <strong>Client Data:</strong> Names and contact information of
                your customers/clients stored within your documents.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <Lock className="w-6 h-6 text-[#5247bf]" /> 2. How We Use Your
              Data
            </h2>
            <p className="leading-relaxed">
              Your data is used solely to facilitate the features of GrowEasy.
              We do not sell your business data to third parties. We use your
              information to:
            </p>
            <ul className="list-disc ml-6 mt-4 space-y-2 font-medium text-gray-700">
              <li>
                Generate and store your business documents (Invoices, Payrolls,
                etc.).
              </li>
              <li>Calculate financial analytics and inventory trends.</li>
              <li>
                Verify subscription payments and manage Pro account access.
              </li>
              <li>Provide customer support and technical troubleshooting.</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <Globe className="w-6 h-6 text-[#5247bf]" /> 3. Data Storage &
              Security
            </h2>
            <p className="leading-relaxed">
              We utilize <strong>Google Firebase</strong> for secure data
              storage and authentication. While we implement industry-standard
              encryption, no method of transmission over the internet is 100%
              secure. You are responsible for maintaining the confidentiality of
              your login credentials.
            </p>
          </section>

          <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-black text-gray-900 mb-2 uppercase">
              Contact Us
            </h2>
            <p className="text-sm font-medium text-gray-700">
              If you have any questions regarding this Privacy Policy, please
              contact HIGH-ER ENTERPRISES at:
              <br />
              <span className="text-[#5247bf] font-bold">
                info@higher.com.ng
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

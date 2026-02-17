import React from "react";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Scale,
} from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gray-900 p-8 text-white text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-gray-400 font-medium">
            Standard Service Agreement for GrowEasy Users
          </p>
        </div>

        <div className="p-6 md:p-12 space-y-10">
          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <CheckCircle className="w-6 h-6 text-orange-500" /> 1. Acceptance
              of Terms
            </h2>
            <p className="leading-relaxed font-medium text-gray-700">
              By accessing or using the GrowEasy platform, provided by HIGH-ER
              ENTERPRISES, you agree to be bound by these Terms and Conditions.
              If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <CreditCard className="w-6 h-6 text-orange-500" /> 2. Subscription
              & Payments
            </h2>
            <div className="space-y-4 font-medium text-gray-700">
              <p>
                <strong>Free Tier:</strong> Users are entitled to a maximum of
                10 items per collection (Invoices, Receipts, Budgets, etc.).
              </p>
              <p>
                <strong>Pro Tier:</strong> Unlimited access is granted upon
                verification of payment. Payments are made via bank transfer
                (Local or International).
              </p>
              <p>
                <strong>Verification:</strong> You must upload a clear
                screenshot of your payment. HIGH-ER ENTERPRISES reserves the
                right to approve or reject proofs based on bank verification.
                Approval typically occurs within 24 hours.
              </p>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <AlertTriangle className="w-6 h-6 text-orange-500" /> 3. User
              Responsibilities
            </h2>
            <p className="leading-relaxed mb-4">As a user, you agree not to:</p>
            <ul className="list-disc ml-6 space-y-2 font-medium text-gray-700">
              <li>Upload fraudulent payment screenshots.</li>
              <li>
                Use the platform for money laundering or illegal financial
                activities.
              </li>
              <li>
                Attempt to bypass the 10-item limit without a valid Pro
                subscription.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mb-4 uppercase tracking-wide">
              <Scale className="w-6 h-6 text-orange-500" /> 4. Limitation of
              Liability
            </h2>
            <p className="leading-relaxed font-medium text-gray-700">
              GrowEasy is provided "as is." HIGH-ER ENTERPRISES is not liable
              for any financial losses, data inaccuracies, or business
              interruptions resulting from the use of our document generation or
              bookkeeping tools. Users are encouraged to double-check all
              generated values before finalizing transactions.
            </p>
          </section>

          <div className="text-center pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              © 2026 HIGH-ER ENTERPRISES. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

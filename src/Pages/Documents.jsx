import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Documents = () => {
  const initialDocuments = [
    {
      id: 1,
      name: "Business Registration Certificate",
      description:
        "A legal document issued by the Corporate Affairs Commission (CAC) that serves as conclusive evidence of a business's registration in Nigeria. For sole proprietorships, it is the Certificate of Registration; for companies (Ltd/PLC), it is the Certificate of Incorporation.",
      importance:
        "It grants your business a distinct legal personality, protecting your brand name from unauthorized use. It is mandatory for opening a corporate bank account, applying for government loans/grants, and bidding for contracts. Operating without it is illegal and risks closure or fines.",
      requirements:
        "Two distinct proposed business names for availability check. Valid identification (NIN, International Passport, or Voter's Card) of proprietors/directors. Passport photographs and signatures. Nature of business and principal address. Payment of filing fees via the CAC Company Registration Portal (CRP).",
    },
    {
      id: 2,
      name: "Tax Identification Number (TIN)",
      description:
        "A unique identifier issued by the Federal Inland Revenue Service (FIRS) or the Joint Tax Board (JTB) to individuals and corporate entities for tax administration purposes. It tracks tax compliance and history across the federation.",
      importance:
        "It is a compulsory requirement for opening a corporate bank account and filing annual tax returns (CIT, VAT, PAYE). It prevents multiple taxation and is often required to obtain other licenses, permits, or government contracts.",
      requirements:
        "For Companies: Certificate of Incorporation (RC Number) and director details. For Individuals/Enterprises: Bank Verification Number (BVN), Date of Birth, and registered phone number. Registration can be done online via the JTB portal or at an FIRS office.",
    },
    {
      id: 3,
      name: "Proof of Address",
      description:
        "A verifiable document that confirms the physical location of your business or residence. It is a critical component of the Know Your Customer (KYC) process for financial institutions and regulators.",
      importance:
        "Mandatory for verifying your identity when opening bank accounts to prevent fraud and money laundering. It is also required for CAC post-incorporation filings and obtaining other location-based permits like the Business Premises Permit.",
      requirements:
        "A recent Utility Bill (Electricity, Water, or Waste) not older than 3 months bearing the business/owner's name. Alternatively, a Bank Statement (stamped/signed) showing the address, a Tenancy Agreement, or a government-issued letter/Tax Clearance Certificate.",
    },
    {
      id: 4,
      name: "Business License / Premises Permit",
      description:
        "An operational permit issued by the State Ministry of Commerce or Local Government Authority (LGA) authorizing a business to operate within a specific locale. Specialized businesses (e.g., Food, Drugs) require additional federal licenses (NAFDAC, SON).",
      importance:
        "It ensures compliance with local town planning and environmental laws, preventing harassment or closure by local government officials. Sector-specific licenses (like NAFDAC) build consumer trust and are required to stock products in major retail outlets.",
      requirements:
        "Payment of the annual fee to the State or LGA designated bank account. Submission of the Business Registration Certificate (CAC) and Tax Identification Number (TIN). Inspection of the business premises by government officials for health and safety compliance.",
    },
    {
      id: 5,
      name: "SMEDAN Certificate",
      description:
        "A digital certificate issued by the Small and Medium Enterprises Development Agency of Nigeria (SMEDAN) that provides a Unique Identification Number (SUIN) for Micro, Small, and Medium Enterprises (MSMEs). It formally registers a business with the agency to access government support.",
      importance:
        "It grants access to government and private sector loans, grants, and insurance. It enables participation in capacity-building training and mentorship programs. It establishes business credibility and is often a prerequisite for federal intervention funds.",
      requirements:
        "Business Name, Email Address, and Phone Number. Business Address (State & LGA). Nature of Business/Sector. Business Type (e.g., Sole Proprietorship). CAC Registration Number (optional but recommended). Business Owner's personal details.",
    },
    {
      id: 6,
      name: "SCUML Certificate",
      description:
        "A certificate issued by the Special Control Unit Against Money Laundering (SCUML) under the EFCC. It certifies that a Designated Non-Financial Business or Profession (DNFBP) is registered and monitored for anti-money laundering (AML) compliance.",
      importance:
        "It is mandatory for opening and operating corporate bank accounts for DNFBPs (e.g., NGOs, Real Estate, Car Dealers, Law Firms). It ensures legal compliance with the Money Laundering (Prevention and Prohibition) Act, 2022, preventing account restrictions (Post No Debit) and legal sanctions. It builds credibility with international partners and financial institutions.",
      requirements:
        "Certificate of Incorporation (CAC). Status Report (CAC 1.1) or Forms CAC 2 & 7. Memorandum and Articles of Association (MEMART) or Constitution (for NGOs). Tax Identification Number (TIN). Bank Verification Number (BVN) of directors. Valid Government ID of directors/trustees. Company Profile. Specific professional licenses (e.g., for lawyers, accountants).",
    },
  ];

  const [documents, setDocuments] = useState(initialDocuments);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [experts, setExperts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const expertsPerPage = 4;

  const toggleDoc = (docId) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const handleChatWithExpert = async (doc) => {
    setSelectedDocument(doc);
    setIsExpertModalOpen(true);
    setCurrentPage(1);

    // Fetch experts for the selected document
    try {
      const q = query(
        collection(db, "experts"),
        where("specialty", "==", doc.name)
      );
      const querySnapshot = await getDocs(q);
      const expertsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExperts(expertsList);
    } catch (err) {
      console.error("Error fetching experts:", err);
    }
  };

  const handleCloseExpertModal = () => {
    setIsExpertModalOpen(false);
    setSelectedDocument(null);
    setExperts([]);
  };

  // Pagination logic
  const totalPages = Math.ceil(experts.length / expertsPerPage);
  const startIndex = (currentPage - 1) * expertsPerPage;
  const currentExperts = experts.slice(startIndex, startIndex + expertsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen  p-6 pb-25">
      <div className="bg-[#5247bf] rounded-xl p-6 mb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white text-center">
          Business Documents
        </h1>
        <p className="text-sm text-white w-80 mx-auto mb-2 text-center">
          Below is a list of important documents you need to have for your
          business.
        </p>
      </div>

      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] py-8 overflow-y-auto">
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl shadow-lg transition-all duration-300"
            >
              <div
                className="p-6 flex items-center justify-between cursor-pointer"
                onClick={() => toggleDoc(doc.id)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {doc.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  {expandedDocs[doc.id] ? (
                    <ChevronUp className="w-5 h-5 text-[#5247bf]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#5247bf]" />
                  )}
                </div>
              </div>
              {expandedDocs[doc.id] && (
                <div className="p-6 pt-2 space-y-4 border-t border-gray-200 ">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      Description
                    </h3>
                    <p className="text-gray-600 text-sm">{doc.description}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      Importance
                    </h3>
                    <p className="text-gray-600 text-sm">{doc.importance}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      Requirements
                    </h3>
                    <p className="text-gray-600 text-sm">{doc.requirements}</p>
                  </div>
                  <button
                    onClick={() => handleChatWithExpert(doc)}
                    className="w-full bg-[#5247bf] text-white cursor-pointer px-4 py-2 rounded-lg hover:bg-[#58528f] transition-all duration-200"
                  >
                    Chat with an Expert
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Experts Modal */}
      {isExpertModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-purple-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
            <button
              onClick={handleCloseExpertModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6 cursor-pointer" />
            </button>
            <h2 className=" font-semibold text-[#5247bf] mb-4">
              Experts for {selectedDocument.name}
            </h2>
            {experts.length === 0 ? (
              <p className="text-gray-600 text-center">
                No experts available for this document.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {currentExperts.map((expert) => (
                    <div
                      key={expert.id}
                      className="flex items-center space-x-3 border p-2 rounded-lg"
                    >
                      <img
                        src={expert.image}
                        alt={expert.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {expert.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {expert.contact}
                        </p>
                        <a
                          href={expert.chatLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 bg-[#5247bf] text-white px-4 py-1 rounded-full text-xs hover:bg-[#4238a6] transition-all duration-200"
                        >
                          Chat
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="gap-4 flex items-center justify-center">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="bg-[#5247bf] cursor-pointer text-white px-3 py-1 rounded-full hover:bg-gray-300 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="bg-[#5247bf] cursor-pointer text-white px-3 py-1 rounded-full hover:bg-gray-300 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;

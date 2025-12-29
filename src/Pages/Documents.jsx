import { useState } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  FileCheck,
  Info,
  ClipboardList,
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Documents = () => {
  const initialDocuments = [
    {
      id: 1,
      name: "Business Registration Certificate",
      description:
        "A legal document issued by the Corporate Affairs Commission (CAC) that serves as conclusive evidence of a business's registration in Nigeria.",
      importance:
        "It grants your business a distinct legal personality and is mandatory for corporate banking and government contracts.",
      requirements:
        "Two proposed names, valid ID (NIN/Passport), passport photos, and payment of filing fees via CAC portal.",
    },
    {
      id: 2,
      name: "Tax Identification Number (TIN)",
      description:
        "A unique identifier issued by the FIRS or JTB to individuals and corporate entities for tax administration.",
      importance:
        "Compulsory for corporate accounts, filing annual tax returns, and obtaining government permits.",
      requirements:
        "CAC Certificate for companies; BVN and personal details for individuals. Can be done online via JTB portal.",
    },
    {
      id: 3,
      name: "Proof of Address",
      description:
        "A verifiable document confirming the physical location of your business or residence for KYC purposes.",
      importance:
        "Mandatory for fraud prevention during bank account opening and obtaining Business Premises Permits.",
      requirements:
        "Utility bill (not older than 3 months), stamped bank statement, or tenancy agreement.",
    },
    {
      id: 4,
      name: "Business License / Premises Permit",
      description:
        "An operational permit issued by State or Local Government authorizing business operations in a specific locale.",
      importance:
        "Ensures compliance with local town planning laws and prevents harassment from local officials.",
      requirements:
        "Payment of annual fee, submission of CAC and TIN documents, and safety inspection of premises.",
    },
    {
      id: 5,
      name: "SMEDAN Certificate",
      description:
        "A digital certificate for MSMEs providing a Unique Identification Number (SUIN) for government support.",
      importance:
        "Grants access to government loans, grants, insurance, and capacity-building programs.",
      requirements:
        "Business name, contact details, nature of business, and owner's personal information.",
    },
    {
      id: 6,
      name: "SCUML Certificate",
      description:
        "A certificate issued by the EFCC's Special Control Unit certifying AML compliance for specific professions.",
      importance:
        "Mandatory for corporate banking for DNFBPs (Lawyers, NGOs, Real Estate) to prevent account restrictions.",
      requirements:
        "CAC documents, TIN, BVN of directors, company profile, and specific professional licenses.",
    },
  ];

  const [documents] = useState(initialDocuments);
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

  const totalPages = Math.ceil(experts.length / expertsPerPage);
  const startIndex = (currentPage - 1) * expertsPerPage;
  const currentExperts = experts.slice(startIndex, startIndex + expertsPerPage);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-8 px-4 md:px-12">
      {/* Header Banner - Responsive Width */}
      <div className="bg-[#5247bf] rounded-2xl p-8 mb-10 max-w-6xl mx-auto shadow-xl text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
          Business Documents
        </h1>
        <p className="text-indigo-100 max-w-xl mx-auto text-sm md:text-base opacity-90">
          Essential legal and operational documents required for running a
          compliant business in Nigeria.
        </p>
      </div>

      {/* Documents Grid: Single column mobile, Two columns desktop */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 h-fit ${
                expandedDocs[doc.id] ? "ring-2 ring-[#5247bf]/20 shadow-md" : ""
              }`}
            >
              {/* Card Header */}
              <div
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => toggleDoc(doc.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl">
                    <FileCheck className="w-6 h-6 text-[#5247bf]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">
                    {doc.name}
                  </h3>
                </div>
                <div className="bg-gray-50 p-2 rounded-full">
                  {expandedDocs[doc.id] ? (
                    <ChevronUp className="w-5 h-5 text-[#5247bf]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Card Content (Expandable) */}
              {expandedDocs[doc.id] && (
                <div className="p-6 pt-0 space-y-5 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-1 text-[#5247bf]">
                      <Info className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Description
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 text-[#5247bf]">
                      <FileCheck className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Importance
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {doc.importance}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 text-[#5247bf]">
                      <ClipboardList className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Requirements
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {doc.requirements}
                    </p>
                  </div>

                  <button
                    onClick={() => handleChatWithExpert(doc)}
                    className="w-full bg-[#5247bf] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4238a6] transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Consult an Expert
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Experts Modal */}
      {isExpertModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative animate-in zoom-in-95">
            <button
              onClick={handleCloseExpertModal}
              className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {selectedDocument.name}
              </h2>
              <p className="text-[#5247bf] font-medium text-sm mt-1">
                Available Specialists
              </p>
            </div>

            {experts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 italic">
                  No experts currently listed for this category.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentExperts.map((expert) => (
                    <div
                      key={expert.id}
                      className="group border border-gray-100 p-4 rounded-2xl hover:border-[#5247bf] transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={expert.image}
                          alt={expert.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-50"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#5247bf]">
                            {expert.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                            {expert.contact}
                          </p>
                        </div>
                      </div>
                      <a
                        href={expert.chatLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center bg-[#5247bf] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#4238a6] transition-all"
                      >
                        Start Chat
                      </a>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-50">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-bold disabled:opacity-30 text-[#5247bf]"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-bold disabled:opacity-30 text-[#5247bf]"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;

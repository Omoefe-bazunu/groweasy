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
        "A legal document that proves your business is officially registered with the government.",
      importance:
        "Essential for establishing your business’s legal identity and enabling operations.",
      requirements:
        "Register with the local business authority, provide business details, and pay the registration fee.",
    },
    {
      id: 2,
      name: "Tax Identification Number",
      description:
        "A unique number assigned to your business for tax purposes.",
      importance:
        "Required for filing taxes and complying with government regulations.",
      requirements:
        "Apply through the tax authority with your business registration details.",
    },
    {
      id: 3,
      name: "Proof of Address",
      description:
        "A document verifying the physical address of your business.",
      importance:
        "May be needed for banking, licensing, or regulatory purposes.",
      requirements:
        "Provide a utility bill, lease agreement, or other official document with your business address.",
    },
    {
      id: 4,
      name: "Business License",
      description:
        "A permit allowing your business to operate in a specific jurisdiction.",
      importance:
        "Ensures compliance with local laws and regulations for your industry.",
      requirements:
        "Apply through the local government, meet industry-specific requirements, and pay the licensing fee.",
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
    <div className="min-h-screen  p-6 pb-20">
      <h1 className="text-3xl font-extrabold text-[#5247bf] mb-2 text-center">
        Important Documents
      </h1>
      <p className="text-xs text-gray-600 mb-6 w-full text-center">
        Tap on each item to see details
      </p>
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto">
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
                    <p className="text-gray-600">{doc.description}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      Importance
                    </h3>
                    <p className="text-gray-600">{doc.importance}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      Requirements
                    </h3>
                    <p className="text-gray-600">{doc.requirements}</p>
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

const BlogPostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "blogPosts"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const postsData = [];

        querySnapshot.forEach((doc) => {
          postsData.push({ id: doc.id, ...doc.data() });
        });

        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await deleteDoc(doc(db, "blogPosts", postId));
        setPosts(posts.filter((post) => post.id !== postId));
      } catch (error) {
        console.error("Error deleting blog post:", error);
      }
    }
  };

  const handleDownloadPDF = (post) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let yPosition = margin;

    const addText = (text, x, y, options = {}) => {
      const maxWidth = options.maxWidth || 190;
      const lineHeight = options.lineHeight || 5;

      const lines = doc.splitTextToSize(text, maxWidth);
      const requiredHeight = lines.length * lineHeight;

      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(lines, x, yPosition, options);
      yPosition += requiredHeight;
    };

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addText(post.title, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    addText(`Topic: ${post.topic}`, margin, yPosition);
    yPosition += 5;
    addText(
      `Created: ${new Date(post.createdAt).toLocaleDateString()}`,
      margin,
      yPosition
    );
    yPosition += 10;

    // Add post sections
    if (post.post.excerpt) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Excerpt", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(post.post.excerpt, margin, yPosition, {
        maxWidth: 190,
        lineHeight: 5,
      });
      yPosition += (post.post.excerpt.split(" ").length / 10) * 5 + 10;
    }

    if (post.post.contentBody) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Content", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(post.post.contentBody, margin, yPosition, {
        maxWidth: 190,
        lineHeight: 5,
      });
      yPosition += (post.post.contentBody.split(" ").length / 10) * 5 + 10;
    }

    if (post.post.hashtags && post.post.hashtags.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      addText("Hashtags", margin, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      addText(post.post.hashtags.join(" "), margin, yPosition);
    }

    doc.save(`${post.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
  };

  const toggleExpand = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  if (loading)
    return <div className="text-center py-8">Loading blog posts...</div>;
  if (posts.length === 0)
    return (
      <div className="text-center py-8 min-h-screen mx-auto p-6 pb-32">
        <p className="text-gray-600 mb-4">No blog posts found.</p>
        <button
          onClick={() => navigate("/blog-posts/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
        >
          Create New Post
        </button>
      </div>
    );

  return (
    <div className="min-h-screen max-w-2xl mx-auto h-[calc(100vh-12rem)] overflow-y-auto p-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Blog Posts</h1>
        <button
          onClick={() => navigate("/blog-posts/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create New Post
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(post.id)}
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {post.topic} • {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPDF(post);
                  }}
                  className="text-gray-500 hover:text-indigo-600 p-1 rounded-full"
                  title="Download as PDF"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(post.id);
                  }}
                  className="text-gray-500 hover:text-red-600 p-1 rounded-full"
                  title="Delete post"
                >
                  <Trash2 size={18} />
                </button>
                {expandedPost === post.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {expandedPost === post.id && (
              <div className="border-t border-gray-200 p-4">
                {post.post.excerpt && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-1">Excerpt</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {post.post.excerpt}
                    </p>
                  </div>
                )}

                {post.post.contentBody && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-1">Content</h4>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                      {post.post.contentBody}
                    </div>
                  </div>
                )}

                {post.post.hashtags && post.post.hashtags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {post.post.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 px-2 py-1 rounded text-sm"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPostList;

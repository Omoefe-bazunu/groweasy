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
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

const BlogPostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
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
        setExpandedSections((prev) => {
          const newSections = { ...prev };
          delete newSections[postId];
          return newSections;
        });
      } catch (error) {
        console.error("Error deleting blog post:", error);
      }
    }
  };

  const toggleExpand = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const toggleSection = (postId, section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        [section]: !prev[postId]?.[section],
      },
    }));
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return "Date unavailable";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      if (isNaN(date.getTime())) return "Date unavailable";
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date unavailable";
    }
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
        <h1 className="text-2xl font-bold text-[#5247bf]">Your Blog Posts</h1>
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
                <h3 className="font-semibold text-lg text-[#5247bf]">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {post.topic} • {formatDate(post.createdAt)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(post.id);
                  }}
                  className="text-gray-500 mt-2 hover:text-red-600 p-1 rounded-full"
                  title="Delete post"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                {expandedPost === post.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {expandedPost === post.id && (
              <div className="border-t border-gray-200 p-4">
                {/* Slug Section */}
                <div className="mb-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection(post.id, "slug")}
                  >
                    <h4 className="font-medium text-gray-800">Slug</h4>
                    {expandedSections[post.id]?.slug ? (
                      <ChevronUp size={20} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600" />
                    )}
                  </div>
                  {expandedSections[post.id]?.slug && (
                    <p className="text-gray-700 whitespace-pre-wrap mt-2 ">
                      {post.post.slug || "No slug available"}
                    </p>
                  )}
                </div>

                {/* Excerpt Section */}
                {post.post.excerpt && (
                  <div className="mb-4">
                    <div
                      className="flex justify-between items-center cursor-pointer border-t border-gray-200 py-2"
                      onClick={() => toggleSection(post.id, "excerpt")}
                    >
                      <h4 className="font-medium text-gray-800">Excerpt</h4>
                      {expandedSections[post.id]?.excerpt ? (
                        <ChevronUp size={20} className="text-gray-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                    </div>
                    {expandedSections[post.id]?.excerpt && (
                      <p className="text-gray-700 whitespace-pre-wrap mt-2">
                        {post.post.excerpt}
                      </p>
                    )}
                  </div>
                )}

                {/* Content Section */}
                {post.post.contentBody && (
                  <div className="mb-4">
                    <div
                      className="flex justify-between items-center cursor-pointer border-t border-gray-200 py-2"
                      onClick={() => toggleSection(post.id, "contentBody")}
                    >
                      <h4 className="font-medium text-gray-800">Content</h4>
                      {expandedSections[post.id]?.contentBody ? (
                        <ChevronUp size={20} className="text-gray-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                    </div>
                    {expandedSections[post.id]?.contentBody && (
                      <div className="prose max-w-none text-gray-700 whitespace-pre-wrap mt-2">
                        {post.post.contentBody}
                      </div>
                    )}
                  </div>
                )}

                {/* Hashtags Section */}
                {post.post.hashtags && post.post.hashtags.length > 0 && (
                  <div>
                    <div
                      className="flex justify-between items-center cursor-pointer border-t border-gray-200 py-2"
                      onClick={() => toggleSection(post.id, "hashtags")}
                    >
                      <h4 className="font-medium text-gray-800">Hashtags</h4>
                      {expandedSections[post.id]?.hashtags ? (
                        <ChevronUp size={20} className="text-gray-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                    </div>
                    {expandedSections[post.id]?.hashtags && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.post.hashtags.map((hashtag, index) => (
                          <span
                            key={index}
                            className="bg-indigo-500 px-2 py-1 rounded text-sm"
                          >
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    )}
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

// import { useState, useEffect } from "react";
// import { useUser } from "../context/UserContext";
// import { db } from "../lib/firebase";
// import {
//   collection,
//   getDocs,
//   doc,
//   deleteDoc,
//   query,
//   orderBy,
// } from "firebase/firestore";
// import { Edit, Trash2 } from "lucide-react";
// import CreatePostForm from "../components/CreatePostForm";

// const Blog = () => {
//   const { user } = useUser();
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [editingPost, setEditingPost] = useState(null);
//   const [deletingPostId, setDeletingPostId] = useState(null);

//   useEffect(() => {
//     const fetchPosts = async () => {
//       try {
//         const postsQuery = query(
//           collection(db, "blogPosts"),
//           orderBy("createdAt", "desc")
//         );
//         const postsSnapshot = await getDocs(postsQuery);
//         const postsList = postsSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setPosts(postsList);
//       } catch (err) {
//         setError("Failed to fetch blog posts. Please try again later.");
//         console.error("Firestore fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPosts();
//   }, []);

//   const handleDeletePost = async (postId) => {
//     if (
//       !user ||
//       !window.confirm("Are you sure you want to delete this post?")
//     ) {
//       return;
//     }

//     setDeletingPostId(postId);
//     try {
//       await deleteDoc(doc(db, "blogPosts", postId));
//       setPosts(posts.filter((post) => post.id !== postId));
//     } catch (err) {
//       setError("Failed to delete post. Please try again.");
//       console.error("Firestore delete error:", err);
//     } finally {
//       setDeletingPostId(null);
//     }
//   };

//   const handlePostSaved = (updatedPost) => {
//     if (editingPost) {
//       setPosts(
//         posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
//       );
//     } else {
//       setPosts([updatedPost, ...posts]);
//     }
//     setEditingPost(null);
//   };

//   const isAdmin = user?.email === "phenomenalwt03@gmail.com";

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 flex items-center justify-center">
//         <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5247bf]"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6 pb-20">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-3xl font-extrabold text-[#5247bf] mb-8 text-center">
//           Blog
//         </h1>

//         {error && (
//           <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
//             <p>{error}</p>
//           </div>
//         )}

//         {user && isAdmin && (
//           <div className="mb-8">
//             <button
//               onClick={() => setEditingPost({})}
//               className="w-full bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 mb-4"
//             >
//               Create New Post
//             </button>
//             {editingPost && (
//               <CreatePostForm
//                 post={editingPost}
//                 onPostSaved={handlePostSaved} // Make sure this is passed
//                 onCancel={() => setEditingPost(null)}
//               />
//             )}
//           </div>
//         )}

//         <div className="space-y-6">
//           {posts.length === 0 ? (
//             <div className="bg-white rounded-xl shadow-lg p-6 text-center">
//               <p className="text-gray-600">No blog posts available.</p>
//               {user && isAdmin && (
//                 <p className="mt-2 text-gray-500">
//                   Click "Create New Post" above to add your first post.
//                 </p>
//               )}
//             </div>
//           ) : (
//             posts.map((post) => (
//               <div key={post.id} className="bg-white rounded-xl shadow-lg p-6">
//                 <div className="flex justify-between items-start mb-4">
//                   <h2 className="text-xl font-semibold text-gray-800">
//                     {post.title}
//                   </h2>
//                   {isAdmin && (
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => setEditingPost(post)}
//                         className="text-gray-600 hover:text-[#5247bf] disabled:opacity-50"
//                         disabled={deletingPostId === post.id}
//                         aria-label="Edit post"
//                       >
//                         <Edit className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => handleDeletePost(post.id)}
//                         className="text-red-600 hover:text-red-800 disabled:opacity-50"
//                         disabled={deletingPostId === post.id}
//                         aria-label="Delete post"
//                       >
//                         {deletingPostId === post.id ? (
//                           <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
//                         ) : (
//                           <Trash2 className="w-5 h-5" />
//                         )}
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 <div
//                   className="prose max-w-none"
//                   dangerouslySetInnerHTML={{ __html: post.content }}
//                 />

//                 <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
//                   <p>
//                     Posted by: {post.author || "Anonymous"} •{" "}
//                     {post.createdAt?.toDate
//                       ? post.createdAt.toDate().toLocaleDateString()
//                       : new Date(post.createdAt).toLocaleDateString()}
//                   </p>
//                   {post.updatedAt && (
//                     <p className="text-xs mt-1">
//                       Last updated:{" "}
//                       {post.updatedAt?.toDate
//                         ? post.updatedAt.toDate().toLocaleString()
//                         : new Date(post.updatedAt).toLocaleString()}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Blog;

// import { useState, useEffect } from "react";
// import { useUser } from "../context/UserContext";
// import { db } from "../lib/firebase";
// import {
//   doc,
//   setDoc,
//   addDoc,
//   collection,
//   serverTimestamp,
// } from "firebase/firestore";
// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Link from "@tiptap/extension-link";
// import MenuBar from "./TipTapMenuBar";

// const CreatePostForm = ({ post, onPostSaved, onCancel }) => {
//   const { user } = useUser();
//   const [title, setTitle] = useState(post?.title || "");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Link.configure({
//         openOnClick: false,
//       }),
//     ],
//     content: post?.content || "",
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!user) {
//       setError("You must be logged in to create a post.");
//       return;
//     }

//     if (!title.trim()) {
//       setError("Title is required.");
//       return;
//     }

//     if (!editor?.getText().trim()) {
//       setError("Content is required.");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const postData = {
//         title: title.trim(),
//         content: editor?.getHTML(),
//         userId: user.uid,
//         author: user.displayName || user.email.split("@")[0],
//         createdAt: post?.createdAt || serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       };

//       if (post?.id) {
//         await setDoc(doc(db, "blogPosts", post.id), postData);
//         onPostSaved({ id: post.id, ...postData });
//       } else {
//         const newPostRef = await addDoc(collection(db, "blogPosts"), postData);
//         onPostSaved({ id: newPostRef.id, ...postData });
//       }
//     } catch (err) {
//       setError("Failed to save post. Please try again.");
//       console.error("Error saving post:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (post && editor) {
//       setTitle(post.title);
//       editor.commands.setContent(post.content);
//     } else if (editor) {
//       setTitle("");
//       editor.commands.clearContent();
//     }
//   }, [post, editor]);

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-gray-700">
//       <h2 className="text-2xl font-semibold text-[#5247bf] mb-4">
//         {post ? "Edit Post" : "Create a New Post"}
//       </h2>
//       {error && <p className="text-red-500 mb-4">{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label className="block text-gray-700 font-medium mb-1">Title*</label>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5247bf] focus:border-transparent"
//             placeholder="Enter the post title"
//             required
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block text-gray-700 font-medium mb-1">
//             Content*
//           </label>
//           <MenuBar editor={editor} />
//           <div className="prose max-w-none border border-gray-300 rounded-lg p-3 min-h-[200px]">
//             <EditorContent editor={editor} />
//           </div>
//         </div>
//         <div className="flex space-x-3">
//           <button
//             type="submit"
//             className="flex-1 bg-[#5247bf] text-white p-3 rounded-lg hover:bg-[#4238a6] transition-all duration-300 disabled:bg-gray-400"
//             disabled={loading}
//           >
//             {loading ? "Saving..." : post ? "Update Post" : "Create Post"}
//           </button>
//           {post && (
//             <button
//               type="button"
//               onClick={onCancel}
//               className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//           )}
//         </div>
//       </form>
//     </div>
//   );
// };

// export default CreatePostForm;

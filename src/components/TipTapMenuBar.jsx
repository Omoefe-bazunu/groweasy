// import { useEditor } from "@tiptap/react";

// const MenuBar = ({ editor }) => {
//   if (!editor) {
//     return null;
//   }

//   return (
//     <div className="flex flex-wrap gap-1 mb-2 text-gray-700">
//       <button
//         type="button"
//         onClick={() => editor.chain().focus().toggleBold().run()}
//         disabled={!editor.can().chain().focus().toggleBold().run()}
//         className={`p-2 rounded ${
//           editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
//         }`}
//       >
//         Bold
//       </button>
//       <button
//         type="button"
//         onClick={() => editor.chain().focus().toggleItalic().run()}
//         disabled={!editor.can().chain().focus().toggleItalic().run()}
//         className={`p-2 rounded ${
//           editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
//         }`}
//       >
//         Italic
//       </button>
//       <button
//         type="button"
//         onClick={() => editor.chain().focus().toggleBulletList().run()}
//         className={`p-2 rounded ${
//           editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
//         }`}
//       >
//         Bullet List
//       </button>
//       <button
//         type="button"
//         onClick={() => editor.chain().focus().toggleOrderedList().run()}
//         className={`p-2 rounded ${
//           editor.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"
//         }`}
//       >
//         Numbered List
//       </button>
//       <button
//         type="button"
//         onClick={() => {
//           const previousUrl = editor.getAttributes("link").href;
//           const url = window.prompt("URL", previousUrl);

//           if (url === null) return;
//           if (url === "") {
//             editor.chain().focus().extendMarkRange("link").unsetLink().run();
//             return;
//           }

//           editor
//             .chain()
//             .focus()
//             .extendMarkRange("link")
//             .setLink({ href: url })
//             .run();
//         }}
//         className={`p-2 rounded ${
//           editor.isActive("link") ? "bg-gray-200" : "hover:bg-gray-100"
//         }`}
//       >
//         Link
//       </button>
//     </div>
//   );
// };

// export default MenuBar;

import { useState } from "react";
import { generateImage, imageStyles, imageSizes } from "../lib/geminiImage";
import { Download } from "lucide-react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(imageStyles[0]);
  const [sizeLabel, setSizeLabel] = useState("Instagram Post");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setImageUrl(null);
    try {
      const size = imageSizes[sizeLabel];
      const url = await generateImage({ prompt, style, size });
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (format) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-image.${format}`;
    link.click();
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-start max-w-2xl mx-auto px-6 pb-20 pt-6 space-y-6 text-gray-500 bg-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <h1 className="text-2xl font-bold text-center">🎨 Create an Image</h1>

      <div className="space-y-4 grid grid-cols-1 ">
        <div className=" flex flex-col gap-2 border-b pb-4">
          <label>Enter a Prompt</label>
          <input
            type="text"
            placeholder="Describe the image you want to create"
            className="w-full p-3 border rounded-xl"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 border-b pb-4">
          <label>Choose a Style</label>
          <select
            className="flex-1 p-3 border rounded-xl"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {imageStyles.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 ">
          <label>Enter Image Size</label>
          <select
            className="flex-1 p-3 border rounded-xl"
            value={sizeLabel}
            onChange={(e) => setSizeLabel(e.target.value)}
          >
            {Object.keys(imageSizes).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
        </div>

        <button
          className=" px-8 py-2 bg-blue-800 text-white rounded"
          onClick={handleGenerate}
          disabled={loading || !prompt}
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </div>

      {imageUrl && (
        <div className="space-y-4 mb-10">
          <img
            src={imageUrl}
            alt="Generated"
            className="rounded-xl w-full border shadow-md"
          />

          <div className="grid grid-cols-2 gap-4 justify-center">
            {["png", "jpg", "webp", "svg"].map((format) => (
              <button
                className=" px-8 py-2 bg-blue-800 text-white rounded flex items-center justify-center"
                key={format}
                variant="outline"
                onClick={() => downloadImage(format)}
              >
                <Download className="w-4 h-4 mr-2" /> {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

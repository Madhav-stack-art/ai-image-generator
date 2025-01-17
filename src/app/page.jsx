"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [referenceImage, setReferenceImage] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeImage = async () => {
    if (!referenceImage) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/integrations/gpt-vision/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe this image in detail focusing on art style, composition, colors, and key elements. Make it suitable as a prompt for generating similar images.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: referenceImage,
                  },
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        setPrompt(data.choices[0].message.content);
      }
    } catch (err) {
      setError("Failed to analyze image");
    }
    setAnalyzing(false);
  };

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { url, error } = await upload({ file });
        if (error) {
          setError("Failed to upload reference image");
          return;
        }
        setReferenceImage(url);
      } catch (err) {
        setError("Failed to upload reference image");
      }
    }
  };

  const generateImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const basePrompt = prompt + ", anime style, 2d, high quality";
      const finalPrompt = referenceImage
        ? `${basePrompt}, similar to reference image`
        : basePrompt;

      const response = await fetch(
        `/integrations/stable-diffusion-v-3/?prompt=${encodeURIComponent(
          finalPrompt
        )}&width=1024&height=1024`
      );
      const data = await response.json();
      if (data.data && data.data[0]) {
        setImage(data.data[0]);
      } else {
        setError("No image was generated. Please try again.");
      }
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 text-center font-inter">
          What do you want to generate?
        </h1>
        <p className="text-[#888888] text-center mb-12 text-lg">
          Prompt, run, and generate AI anime artwork.
        </p>

        <div className="space-y-8">
          <div className="bg-[#111111] border border-[#333333] rounded-xl p-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="How can AI help you create anime art today?"
                  className="w-full h-24 p-4 bg-transparent text-white rounded-lg focus:outline-none placeholder-[#444444] text-lg resize-none border-none"
                />
              </div>
              {referenceImage && (
                <div className="w-24 h-24 relative">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="absolute -top-2 -right-2 bg-[#FF0000] rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="absolute -bottom-2 -right-2 bg-[#0066FF] rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <i
                      className={`fas ${
                        analyzing ? "fa-spinner fa-spin" : "fa-magic"
                      }`}
                    ></i>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={generateImage}
                disabled={loading || !prompt}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm ${
                  loading || !prompt
                    ? "bg-[#222222] text-[#444444] cursor-not-allowed"
                    : "bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </span>
                ) : (
                  "Generate"
                )}
              </button>
              <label className="p-3 rounded-lg bg-[#111111] border border-[#333333] hover:bg-[#222222] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <i className="fas fa-image"></i>
              </label>
              <button className="p-3 rounded-lg bg-[#111111] border border-[#333333] hover:bg-[#222222] transition-colors">
                <i className="fas fa-link"></i>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-[#FF000022] border border-[#FF0000] text-[#FF0000] p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-[#111111] border border-[#333333] rounded-xl p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[512px]">
                <div className="loading-pulse w-64 h-64 rounded-full"></div>
                <p className="mt-4 text-[#888888]">
                  Creating your masterpiece...
                </p>
              </div>
            ) : (
              image && (
                <div className="bg-[#111111] border border-[#333333] rounded-xl p-4">
                  <img
                    src={image}
                    alt="Generated anime artwork"
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="flex gap-4 mt-4">
                    <a
                      href={image}
                      download="anime-art.png"
                      className="flex-1 py-3 px-4 bg-[#111111] border border-[#333333] hover:bg-[#222222] rounded-lg transition-colors text-center text-sm"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Download Image
                    </a>
                    <button className="p-3 rounded-lg bg-[#111111] border border-[#333333] hover:bg-[#222222] transition-colors">
                      <i className="fas fa-share"></i>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
        }
        
        .loading-pulse {
          background: radial-gradient(circle, #0066FF, transparent);
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;
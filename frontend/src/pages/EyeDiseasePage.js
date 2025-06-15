import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/layout/NavBar";
import { CloudArrowUpIcon, ArrowPathIcon, XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { RiRobot2Line } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = process.env.REACT_APP_API_URL || "";

const EyeDiseasePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const { token } = useAuth();
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select an image file first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      const response = await fetch(`${API_URL}/api/eye-disease-image-classification`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Prediction failed. Please try again.");
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput, timestamp: new Date().toLocaleTimeString() };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    try {
      const response = await fetch(`${API_URL}/api/eye-disease-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ message: userMsg.content }),
      });
      if (!response.ok) throw new Error("Failed to get AI response");
      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.response, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process your question.", timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Analysis Section */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Eye Image Analysis</h2>
                <button onClick={() => setShowInfo(!showInfo)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <InformationCircleIcon className="h-5 w-5" />
                  <span>How it works</span>
                </button>
              </div>
              {showInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800 mb-2">About Eye Disease Detection</h3>
                  <p className="text-sm text-blue-700">Our AI analyzes eye images to detect potential diseases. Upload clear, high-quality images for best results. This tool assists healthcare professionals but does not replace medical diagnosis.</p>
                </div>
              )}
              <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${preview ? "border-transparent" : "border-gray-300 hover:border-blue-400"}`} onClick={() => !preview && fileInputRef.current.click()}>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-sm" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">
                      Click to upload or drag and drop
                      <br />
                      <span className="text-sm text-gray-400">Eye images (retina, cornea, etc.)</span>
                    </p>
                  </>
                )}
                <input type="file" ref={fileInputRef} accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={handleSubmit} disabled={!selectedFile || loading} className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 ${!selectedFile || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Image"
                  )}
                </button>
                <button onClick={handleClear} disabled={!selectedFile} className={`py-3 px-6 rounded-lg font-medium border flex items-center justify-center gap-2 ${!selectedFile ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                  <XMarkIcon className="h-5 w-5" />
                  Clear
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis Results</h2>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XMarkIcon className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              {result ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="font-medium text-gray-700 mb-2">Prediction</h3>
                    <div className="text-2xl font-bold text-blue-600 capitalize">{result.predicted_class.replace(/_/g, " ")}</div>
                  </div>
                  {result.confidence !== undefined && (
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h3 className="font-medium text-gray-700 mb-3">Confidence Level</h3>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.max(0, Math.min(result.confidence / 100, 1)) * 100}%` }}></div>
                        </div>
                        <span className="ml-3 text-gray-900 font-medium">{Math.max(0, Math.min(result.confidence, 100)).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                    <InformationCircleIcon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No results yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload and analyze an image to see prediction results.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Assistant Section */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Eye Disease Assistant</h2>
              <p className="text-sm text-gray-500 mb-4">Ask questions about eye conditions, symptoms, or treatments</p>

              <form onSubmit={handleChatSubmit} className="flex gap-2 mb-4">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about eye symptoms, conditions, treatments..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={loading} />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2" disabled={!chatInput.trim() || loading}>
                  {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <RiRobot2Line className="h-4 w-4" />}
                  <span>Ask</span>
                </button>
              </form>
            </div>

            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto max-h-[500px]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <RiRobot2Line className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">How can I help you today?</h3>
                  <p className="mt-2 text-sm text-gray-500">Ask me anything about eye diseases, symptoms, or treatments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                        <div className={`p-4 rounded-lg shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"}`}>
                          <div className="flex items-center mb-2">
                            {msg.role === "assistant" ? <RiRobot2Line className="mr-2 text-blue-500" /> : <span className="mr-2 font-bold">You</span>}
                            <span className="text-xs opacity-80">{msg.timestamp}</span>
                          </div>
                          <div className="whitespace-pre-line">
                            <ReactMarkdown
                              children={msg.content}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                strong: ({ node, ...props }) => <strong className={`font-semibold ${msg.role === "user" ? "text-blue-100" : "text-blue-700"}`} {...props} />,
                                li: ({ node, ...props }) => <li className="ml-4 list-disc" {...props} />,
                                ul: ({ node, ...props }) => <ul className="mb-2 pl-4" {...props} />,
                                h2: ({ node, ...props }) => {
                                  const children = props.children && React.Children.count(props.children) > 0 ? props.children : <span className="sr-only">Section heading</span>;
                                  return (
                                    <h2 className={`text-lg font-bold mt-4 mb-2 ${msg.role === "user" ? "text-blue-100" : "text-blue-800"}`} aria-label={typeof props.children === "string" && props.children.trim() === "" ? "Section heading" : undefined}>
                                      {children}
                                    </h2>
                                  );
                                },
                                h3: ({ node, ...props }) => {
                                  const children = props.children && React.Children.count(props.children) > 0 ? props.children : <span className="sr-only">Section heading</span>;
                                  return (
                                    <h3 className={`text-base font-semibold mt-3 mb-1 ${msg.role === "user" ? "text-blue-100" : "text-blue-700"}`} aria-label={typeof props.children === "string" && props.children.trim() === "" ? "Section heading" : undefined}>
                                      {children}
                                    </h3>
                                  );
                                },
                                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                a: ({ node, ...props }) => {
                                  // Ensure anchor has accessible content
                                  const children = props.children && React.Children.count(props.children) > 0 ? props.children : <span className="sr-only">Link</span>;
                                  return (
                                    <a className={`underline ${msg.role === "user" ? "text-blue-200" : "text-blue-600"}`} {...props} aria-label={!props.children || (typeof props.children === "string" && props.children.trim() === "") ? "Link" : undefined}>
                                      {children}
                                    </a>
                                  );
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded max-w-6xl mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> This tool provides preliminary analysis only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider regarding any medical condition.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EyeDiseasePage;

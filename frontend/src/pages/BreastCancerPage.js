import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/layout/NavBar";
import { CloudArrowUpIcon, ArrowPathIcon, XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RiRobot2Line } from "react-icons/ri";

const API_URL = process.env.REACT_APP_API_URL || "";

const BreastCancerPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
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

      const response = await fetch(`${API_URL}/api/breast-cancer-image-classification`, {
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
    setChatLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/breast-cancer-chat`, {
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
    } finally {
      setChatLoading(false);
    }
  };

  const getResultSeverity = () => {
    if (!result?.predicted_class) return null;

    const lowerCaseResult = result.predicted_class.toLowerCase();
    if (lowerCaseResult.includes("malignant") || lowerCaseResult.includes("cancer")) {
      return {
        color: "red",
        icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
      };
    } else if (lowerCaseResult.includes("benign")) {
      return {
        color: "green",
        icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
      };
    }
    return {
      color: "blue",
      icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
    };
  };

  const severity = getResultSeverity();

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Analysis Section */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Breast Image Analysis</h2>
                <button onClick={() => setShowInfo(!showInfo)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <InformationCircleIcon className="h-5 w-5" />
                  <span>How it works</span>
                </button>
              </div>

              {showInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800 mb-2">About Breast Cancer Detection</h3>
                  <p className="text-sm text-blue-700">Our AI analyzes medical images using deep learning algorithms trained on thousands of cases. For best results, upload clear, high-quality images in DICOM, PNG, or JPEG format.</p>
                </div>
              )}

              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${preview ? "border-transparent" : "border-gray-300 hover:border-pink-400 bg-gray-50 hover:bg-gray-100"}`} onClick={() => !preview && fileInputRef.current.click()}>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-sm object-contain" />
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
                      <span className="text-sm text-gray-400">Mammograms, Ultrasound, MRI, Histopathology</span>
                    </p>
                  </>
                )}
                <input type="file" ref={fileInputRef} accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button onClick={handleSubmit} disabled={!selectedFile || loading} className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 ${!selectedFile || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700 text-white"}`}>
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
                  {/* For segmentation results with multiple images */}
                  {result.images && result.images.length >= 4 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2 text-sm">Original Image</h3>
                        <img src={`data:image/png;base64,${result.images[0]}`} alt="Original" className="w-full rounded-md" />
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2 text-sm">AI Detection Map</h3>
                        <img src={`data:image/png;base64,${result.images[1]}`} alt="Detection Map" className="w-full rounded-md" />
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2 text-sm">Processed Analysis</h3>
                        <img src={`data:image/png;base64,${result.images[2]}`} alt="Processed Analysis" className="w-full rounded-md" />
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-700 mb-2 text-sm">Overlay Visualization</h3>
                        <img src={`data:image/png;base64,${result.images[3]}`} alt="Overlay Visualization" className="w-full rounded-md" />
                      </div>
                    </div>
                  ) : (
                    result.images && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.images.map((img, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <h3 className="font-medium text-gray-700 mb-2 text-sm">Image {idx + 1}</h3>
                            <img src={`data:image/png;base64,${img}`} alt={`Result ${idx + 1}`} className="w-full rounded-md" />
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {result.predicted_class && (
                    <div className={`p-4 rounded-lg border ${severity.borderColor} ${severity.bgColor}`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">{severity.icon}</div>
                        <div className="ml-3">
                          <h3 className={`text-lg font-bold ${severity.textColor}`}>{result.predicted_class.replace(/_/g, " ")}</h3>
                          {result.confidence !== undefined && (
                            <div className="mt-3">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className={`h-2.5 rounded-full ${severity.color === "red" ? "bg-red-500" : severity.color === "green" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${result.confidence * 100}%` }}></div>
                                </div>
                                <span className="ml-3 text-sm font-medium text-gray-700">{(result.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Breast Cancer Assistant</h2>
              <p className="text-sm text-gray-500 mb-4">Ask questions about symptoms, treatments, or prevention</p>

              <form onSubmit={handleChatSubmit} className="flex gap-2 mb-4">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about breast cancer..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" disabled={chatLoading} />
                <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center gap-2" disabled={!chatInput.trim() || chatLoading}>
                  {chatLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <RiRobot2Line className="h-4 w-4" />}
                  <span>Ask</span>
                </button>
              </form>
            </div>

            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto max-h-[500px]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <RiRobot2Line className="h-12 w-12 text-pink-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">How can I help you today?</h3>
                  <p className="mt-2 text-sm text-gray-500">Ask me anything about breast cancer symptoms or treatments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                        <div className={`p-4 rounded-lg shadow-sm ${msg.role === "user" ? "bg-pink-600 text-white" : "bg-white border border-gray-200"}`}>
                          <div className="flex items-center mb-2">
                            {msg.role === "assistant" ? <RiRobot2Line className="mr-2 text-pink-500" /> : <span className="mr-2 font-bold">You</span>}
                            <span className="text-xs opacity-80">{msg.timestamp}</span>
                          </div>
                          <div className="whitespace-pre-line">
                            <ReactMarkdown
                              children={msg.content}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                strong: ({ node, ...props }) => <strong className={`font-semibold ${msg.role === "user" ? "text-pink-100" : "text-pink-700"}`} {...props} />,
                                li: ({ node, ...props }) => <li className="ml-4 list-disc" {...props} />,
                                ul: ({ node, ...props }) => <ul className="mb-2 pl-4" {...props} />,
                                h2: ({ node, children, ...props }) => (
                                  <h2 className={`text-lg font-bold mt-4 mb-2 ${msg.role === "user" ? "text-pink-100" : "text-pink-800"}`} {...props}>
                                    {children && children.length > 0 ? children : <span className="sr-only">Section heading</span>}
                                  </h2>
                                ),
                                h3: ({ node, children, ...props }) => (
                                  <h3 className={`text-base font-semibold mt-3 mb-1 ${msg.role === "user" ? "text-pink-100" : "text-pink-700"}`} {...props}>
                                    {children && children.length > 0 ? children : <span className="sr-only">Section heading</span>}
                                  </h3>
                                ),
                                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                a: ({ node, children, ...props }) => (
                                  <a className={`underline ${msg.role === "user" ? "text-pink-200" : "text-pink-600"}`} {...props}>
                                    {children && children.length > 0 ? children : <span className="sr-only">Link</span>}
                                  </a>
                                ),
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

        {/* Comprehensive Disclaimer */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-6xl mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Important Disclaimer</h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              <strong>This is not a diagnostic tool.</strong> The breast cancer detection AI provides preliminary analysis only and is intended for use by qualified healthcare professionals.
            </p>
            <ul className="mt-2 space-y-1">
              <li>• Results should always be verified by a board-certified radiologist</li>
              <li>• False positives and false negatives may occur</li>
              <li>• Not all breast cancers may be detected by this system</li>
              <li>• Clinical correlation with patient history is essential</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default BreastCancerPage;

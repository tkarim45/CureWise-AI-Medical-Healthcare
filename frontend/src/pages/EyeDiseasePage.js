import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/layout/NavBar";
import { CloudArrowUpIcon, ArrowPathIcon, XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

const API_URL = process.env.REACT_APP_API_URL || "";

const EyeDiseasePage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
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

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Eye Disease Detection</h1>
            <p className="text-lg text-gray-600">Upload an eye image for AI-powered disease detection.</p>
          </div>
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Image Upload</h2>
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
            <div className="p-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-700 mb-2">Prediction</h3>
                      <div className="text-2xl font-bold text-gray-900 capitalize">{result.predicted_class.replace(/_/g, " ")}</div>
                    </div>
                    {result.confidence !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 mb-2">Confidence Level</h3>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${Math.max(0, Math.min(result.confidence / 100, 1)) * 100}%` }}></div>
                          </div>
                          <span className="ml-3 text-gray-900 font-medium">{Math.max(0, Math.min(result.confidence, 100)).toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                    <InformationCircleIcon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No results yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload and analyze an image to see prediction results.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
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
      </div>
    </>
  );
};

export default EyeDiseasePage;

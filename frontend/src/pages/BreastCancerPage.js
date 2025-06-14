import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/layout/NavBar";
import { CloudArrowUpIcon, ArrowPathIcon, XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

const API_URL = process.env.REACT_APP_API_URL || "";

const BreastCancerPage = () => {
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

  // Determine result severity and styling
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
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Breast Cancer Detection AI</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Advanced analysis of mammogram and histopathology images for early detection of breast cancer</p>
          </div>

          {/* Main Card */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            {/* Upload Section */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Upload Medical Image</h2>
                  <p className="text-gray-500 mt-1">Supported: Mammograms, Ultrasound, MRI, Histopathology</p>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2 md:mt-0">
                  <InformationCircleIcon className="h-5 w-5" />
                  <span>How it works</span>
                </button>
              </div>

              {showInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800 mb-2">About Breast Cancer Detection</h3>
                  <p className="text-sm text-blue-700">Our AI analyzes medical images using deep learning algorithms trained on thousands of cases. For best results, upload clear, high-quality images in DICOM, PNG, or JPEG format. This tool is designed to assist radiologists and does not replace professional diagnosis.</p>
                </div>
              )}

              {/* Upload Area */}
              <div className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${preview ? "border-transparent" : "border-gray-300 hover:border-pink-400 bg-gray-50 hover:bg-gray-100"}`} onClick={() => !preview && fileInputRef.current.click()}>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-80 mx-auto rounded-lg shadow-sm object-contain" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Drag & drop your image here, or click to browse</p>
                    <p className="text-sm text-gray-400 mt-2">Supports: PNG, JPG, DICOM (Max 20MB)</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button onClick={handleSubmit} disabled={!selectedFile || loading} className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${!selectedFile || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary hover:bg-blue-500 text-white shadow-md"}`}>
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Image"
                  )}
                </button>
                <button onClick={handleClear} disabled={!selectedFile} className={`py-3 px-6 rounded-lg font-medium border flex items-center justify-center gap-2 transition-colors ${!selectedFile ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                  <XMarkIcon className="h-5 w-5" />
                  Clear
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Analysis Results</h2>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
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
                <div className="space-y-8">
                  {/* For segmentation results with multiple images */}
                  {result.images ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h3 className="font-medium text-gray-700 mb-3">Original Image</h3>
                          <img src={`data:image/png;base64,${result.images[0]}`} alt="Original" className="w-full rounded-lg shadow-sm" />
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h3 className="font-medium text-gray-700 mb-3">AI Detection Map</h3>
                          <img src={`data:image/png;base64,${result.images[1]}`} alt="Predicted Mask" className="w-full rounded-lg shadow-sm" />
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h3 className="font-medium text-gray-700 mb-3">Processed Analysis</h3>
                          <img src={`data:image/png;base64,${result.images[2]}`} alt="Processed Mask" className="w-full rounded-lg shadow-sm" />
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <h3 className="font-medium text-gray-700 mb-3">Overlay Visualization</h3>
                          <img src={`data:image/png;base64,${result.images[3]}`} alt="Overlay" className="w-full rounded-lg shadow-sm" />
                        </div>
                      </div>

                      {result.predicted_class && (
                        <div className={`p-4 rounded-lg border ${severity.borderColor} ${severity.bgColor}`}>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">{severity.icon}</div>
                            <div className="ml-3">
                              <h3 className={`text-lg font-medium ${severity.textColor}`}>{result.predicted_class.replace(/_/g, " ")}</h3>
                              {result.confidence !== undefined && (
                                <div className="mt-2">
                                  <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div className={`h-2.5 rounded-full ${severity.color === "red" ? "bg-red-500" : severity.color === "green" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${result.confidence * 100}%` }}></div>
                                    </div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // For classification results
                    <div className="space-y-6">
                      <div className={`p-6 rounded-lg border ${severity.borderColor} ${severity.bgColor}`}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">{severity.icon}</div>
                          <div className="ml-4">
                            <h3 className={`text-xl font-bold ${severity.textColor}`}>{result.predicted_class.replace(/_/g, " ")}</h3>
                            {result.confidence !== undefined && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Confidence Level</h4>
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className={`h-3 rounded-full ${severity.color === "red" ? "bg-red-500" : severity.color === "green" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${result.confidence * 100}%` }}></div>
                                  </div>
                                  <span className="ml-3 text-sm font-medium text-gray-700">{(result.confidence * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`p-5 rounded-lg border ${severity.borderColor} ${severity.bgColor}`}>
                        <h3 className={`font-medium ${severity.textColor} mb-2`}>Recommended Next Steps</h3>
                        <p className={`text-sm ${severity.textColor}`}>{result.predicted_class.toLowerCase().includes("benign") ? "No immediate signs of malignancy detected. Continue with regular screenings as recommended by your healthcare provider." : "Potential malignancy detected. Please consult with a breast specialist or oncologist immediately for further evaluation, diagnostic testing, and treatment planning."}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <InformationCircleIcon className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">This analysis should be reviewed by a qualified radiologist or oncologist. The results do not constitute a medical diagnosis.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                    <InformationCircleIcon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No analysis results yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload a medical image and click "Analyze" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Comprehensive Disclaimer */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Important Disclaimer</h3>
            <div className="prose prose-sm text-gray-600">
              <p>
                <strong>This is not a diagnostic tool.</strong> The breast cancer detection AI provides preliminary analysis only and is intended for use by qualified healthcare professionals as a secondary assessment tool.
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Results should always be verified by a board-certified radiologist</li>
                <li>• False positives and false negatives may occur</li>
                <li>• Not all breast cancers may be detected by this system</li>
                <li>• Clinical correlation with patient history and other diagnostic tests is essential</li>
              </ul>
              <p className="mt-3">By using this tool, you acknowledge that it does not replace professional medical judgment and agree to use it in accordance with applicable laws and regulations.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BreastCancerPage;

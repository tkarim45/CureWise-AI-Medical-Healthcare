import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CameraIcon, ArrowPathIcon, XMarkIcon, ArrowUpCircleIcon, UserIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";

const DiseaseDetectionPage = () => {
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [chat, setChat] = useState([]);
  const [followup, setFollowup] = useState("");
  const [referral, setReferral] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const { token } = useAuth();

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/acne-analysis`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(data.response);
      setActiveTab("analysis");
    } catch (err) {
      setError(err.response?.data?.detail || "Error analyzing image");
      console.error("Request failed:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImageFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setChat([]);
    setReferral(null);
    imageInputRef.current.value = null;
  };

  const handleFollowup = async (e) => {
    e.preventDefault();
    if (!followup.trim()) return;

    const userMessage = { role: "user", text: followup };
    setChat((prev) => [...prev, userMessage]);
    setFollowup("");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/disease-followup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: followup, context: result }),
      });
      const data = await res.json();
      setChat((prev) => [...prev, { role: "agent", text: data.response }]);
      if (data.referral) setReferral(data.referral);
    } catch {
      setChat((prev) => [
        ...prev,
        {
          role: "agent",
          text: "I'm unable to process your request right now. For medical advice, please consult a healthcare professional.",
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <NavBar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Skin Health Analysis</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a clear image of your skin condition to receive instant analysis and recommendations.
            <span className="block text-sm text-gray-500 mt-2">Note: This is not a medical diagnosis. Always consult a dermatologist for professional advice.</span>
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col items-center">
              {/* Image Upload Area */}
              <div
                className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center mb-6 
                  ${preview ? "border-transparent" : "border-gray-300 hover:border-primary cursor-pointer"}`}
                onClick={() => !preview && imageInputRef.current.click()}
              >
                {preview ? (
                  <div className="relative w-full h-full">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
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
                    <CameraIcon className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500 text-center">
                      Click to upload an image <br />
                      <span className="text-sm text-gray-400">(JPEG or PNG, max 5MB)</span>
                    </p>
                  </>
                )}
              </div>
              <input type="file" accept="image/jpeg,image/png" ref={imageInputRef} className="hidden" onChange={handleImageChange} disabled={loading} />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button onClick={() => imageInputRef.current.click()} className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2" disabled={loading}>
                  <CameraIcon className="h-5 w-5" />
                  {preview ? "Change Image" : "Upload Image"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!imageFile || loading}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                    ${!imageFile || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"}`}
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Image"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button className={`flex-1 py-4 font-medium text-center ${activeTab === "analysis" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("analysis")}>
                Analysis Results
              </button>
              <button className={`flex-1 py-4 font-medium text-center ${activeTab === "chat" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("chat")} disabled={!result}>
                Ask Questions
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <XMarkIcon className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "analysis" && (
                  <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {result ? (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Skin Analysis</h3>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {result.split("\n").map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                        {referral && (
                          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Professional Referral Recommended</h4>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-blue-800">{referral.name}</p>
                                <p className="text-sm text-blue-700">{referral.specialty}</p>
                                <p className="text-sm text-blue-600 mt-1">Contact: {referral.contact}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No analysis yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Upload an image and click "Analyze" to get started.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "chat" && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto max-h-96 mb-4 space-y-4 pr-2">
                      {chat.length > 0 ? (
                        chat.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}>{msg.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-lg font-medium text-gray-900">Ask about your results</h3>
                          <p className="mt-1 text-sm text-gray-500">Get more information by asking questions about your analysis.</p>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleFollowup} className="mt-auto">
                      <div className="flex rounded-lg shadow-sm">
                        <input type="text" className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Ask a question about your results..." value={followup} onChange={(e) => setFollowup(e.target.value)} disabled={!result} />
                        <button type="submit" disabled={!followup.trim() || !result} className={`px-4 py-2 rounded-r-lg ${!followup.trim() || !result ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"}`}>
                          <ArrowUpCircleIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This tool provides preliminary analysis only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetectionPage;

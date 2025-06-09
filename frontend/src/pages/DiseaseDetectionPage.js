import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CameraIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar"; // Adjust path if needed

const DiseaseDetectionPage = () => {
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const imageInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setError(null);
      // Generate image preview
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

    // Log FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key}=${value instanceof File ? value.name : value}`);
    }

    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/acne-analysis`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(data.response);
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
    imageInputRef.current.value = null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary font-inter">
      {/* Navbar */}
      <NavBar />

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">Acne Detection</h1>
        <p className="text-text/80 text-center mb-8">Upload a clear image of your skin to get insights about acne. This is not a medical diagnosis—consult a dermatologist for professional advice.</p>

        {/* Image Upload Section */}
        <div className="bg-bgLight p-6 rounded-xl shadow-soft mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <button type="button" onClick={() => imageInputRef.current.click()} className="p-3 bg-primary text-white rounded-full hover:bg-accent hover:text-text transition-colors" disabled={loading}>
                <CameraIcon className="h-6 w-6" />
              </button>
              <input type="file" accept="image/jpeg,image/png" ref={imageInputRef} className="hidden" onChange={handleImageChange} disabled={loading} />
              <button type="submit" disabled={!imageFile || loading} className="p-3 bg-primary text-white rounded-full hover:bg-accent hover:text-text disabled:bg-gray-300 disabled:text-gray-500 transition-colors">
                {loading ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : "Analyze Image"}
              </button>
              {imageFile && (
                <button type="button" onClick={handleClear} className="p-3 bg-error text-white rounded-full hover:bg-red-700 transition-colors">
                  Clear
                </button>
              )}
            </div>
            {preview && (
              <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <img src={preview} alt="Preview" className="max-w-xs rounded-lg shadow-soft" />
              </motion.div>
            )}
          </form>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {error && (
            <motion.p className="text-error text-center mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error}
            </motion.p>
          )}
          {result && (
            <motion.div className="bg-bgLight p-6 rounded-xl shadow-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-semibold text-primary mb-4">Analysis Results</h2>
              <p className="text-text">{result}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiseaseDetectionPage;

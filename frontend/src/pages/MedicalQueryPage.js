import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiSend, FiX, FiMenu, FiTrash2, FiUser } from "react-icons/fi";
import { PaperClipIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";

const MedicalQueryPage = () => {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "system",
          content: `CTC report "${e.target.files[0].name}" uploaded. You can now ask follow-up questions!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !query.trim()) {
      setError("Please upload a CTC report or enter a question.");
      return;
    }
    setLoading(true);
    setError(null);
    const apiUrl = process.env.REACT_APP_API_URL || "";
    const token = localStorage.getItem("token");
    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("query", query.trim() || "Explain my CTC report");
    try {
      // Add user message
      if (query.trim()) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "user",
            content: query,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
      setQuery("");
      const response = await axios.post(`${apiUrl}/api/medical-query`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      setError(err.response?.data?.detail || "Error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (text) => {
    setQuery(text);
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    setError(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed md:relative z-20 w-64 h-full bg-white border-r border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">CTC Report Chat</h2>
              </div>
              <div className="p-4">
                <button onClick={handleClearHistory} className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
                  <FiTrash2 />
                  <span>Clear Chat</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {chatHistory.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <FiUser className="text-blue-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload your CTC Report</h3>
                <p className="text-gray-600 max-w-md mb-6">Upload a CTC (Complete Blood Count) report and ask follow-up questions. The AI will help you understand your results in simple terms.</p>
                <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center space-x-2">
                  <PaperClipIcon className="h-5 w-5 mr-2" />
                  <span>Upload CTC Report (PDF)</span>
                </button>
              </div>
            )}
            <div className="max-w-3xl mx-auto space-y-6">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                    <motion.div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : msg.role === "system" ? "bg-gray-100 text-gray-700 text-center" : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                      <div className="flex items-center mb-1 justify-between">
                        {msg.role === "assistant" ? <FiUser className="mr-2 text-blue-500" /> : msg.role === "user" ? <FiUser className="mr-2 text-blue-200" /> : null}
                        <span className="text-xs opacity-70">{msg.timestamp}</span>
                      </div>
                      <p>{msg.content}</p>
                    </motion.div>
                  </div>
                </div>
              ))}
              {loading && (
                <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="max-w-[85%] bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                        <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                        <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                      </div>
                      <span className="text-sm text-gray-500">AI is analyzing your report...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="relative flex items-center space-x-3">
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="Upload CTC Report">
                  <PaperClipIcon className="h-6 w-6" />
                </button>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask a follow-up question about your CTC report..." className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={loading || (!file && chatHistory.length === 0)} />
                <button type="submit" disabled={loading || (!file && !query.trim())} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
                  <FiSend />
                </button>
              </form>
              {error && (
                <motion.p className="text-red-500 text-sm mt-2 text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  {error}
                </motion.p>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden fixed bottom-6 left-6 z-10 bg-white p-3 rounded-full shadow-lg border border-gray-200">
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>
    </div>
  );
};

export default MedicalQueryPage;

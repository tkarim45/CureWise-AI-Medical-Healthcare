import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar"; // Adjust path if needed

const MedicalQueryPage = () => {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasReport, setHasReport] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsUploading(true);
      setTimeout(() => {
        setChatHistory([
          ...chatHistory,
          {
            role: "system",
            content: "File uploaded, processing...",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setIsUploading(false);
      }, 1000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Get query directly from form input
    const formData = new FormData(formRef.current);
    const currentQuery = formData.get("query")?.toString().trim() || "";
    console.log(`Form query: ${currentQuery}`);

    // Validation
    if (!hasReport && !file && !currentQuery) {
      setError("Please upload a report or enter a query.");
      return;
    }
    if (hasReport && !file && !currentQuery) {
      setError("Please enter a question about your report.");
      return;
    }

    setLoading(true);
    setError(null);

    const effectiveQuery = currentQuery || "Explain my blood test results";
    console.log(`Raw query state: ${query}`);
    console.log(`Sending query: ${effectiveQuery}, file: ${file ? file.name : "none"}`);

    const requestData = new FormData();
    requestData.append("query", effectiveQuery);
    if (file) requestData.append("file", file);

    try {
      const { data } = await axios.post("http://localhost:8000/api/medical-query", requestData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setChatHistory([
        ...chatHistory,
        {
          role: "user",
          content: effectiveQuery || "Uploaded a blood report",
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setQuery("");
      if (file) {
        setHasReport(true);
        setFile(null);
        fileInputRef.current.value = null;
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error processing query");
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default Enter behavior
      formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  const handleNewReport = () => {
    setHasReport(false);
    setChatHistory([]);
    setFile(null);
    fileInputRef.current.value = null;
    setQuery("");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-secondary font-inter">
      <NavBar />
      <div className="flex flex-1">
        <div className={`fixed inset-y-0 left-0 w-64 bg-primary text-white transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 mt-16 md:mt-0`}>
          <div className="p-6">
            <h1 className="text-2xl font-bold">HealthSync AI</h1>
          </div>
          <div className="p-6">
            <button onClick={handleNewReport} className="w-full bg-accent text-text p-3 rounded-lg hover:bg-white hover:text-primary transition-colors shadow-soft">
              New Report
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col md:ml-64">
          <button className="md:hidden p-4 bg-primary text-white" onClick={toggleSidebar}>
            {sidebarOpen ? "Close" : "Menu"}
          </button>
          <div className="flex-1 overflow-y-auto p-6 bg-bgLight">
            {chatHistory.length === 0 && !isUploading && !loading && (
              <div className="text-center text-text/60 mt-20">
                <p className="text-lg">Upload a blood report to start the conversation!</p>
              </div>
            )}
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"} mb-6`}>
                <div className={`flex items-start space-x-3 max-w-2xl w-full ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""} ${msg.role === "system" ? "max-w-xl mx-auto" : ""}`}>
                  {msg.role !== "system" && (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-accent" : "bg-primary"} shadow-soft flex-shrink-0`}>
                      <span className={`font-bold text-lg ${msg.role === "user" ? "text-text" : "text-white"}`}>{msg.role === "user" ? "U" : "AI"}</span>
                    </div>
                  )}
                  <motion.div className={`p-4 rounded-xl shadow-soft ${msg.role === "user" ? "bg-accent text-text" : msg.role === "system" ? "bg-primary/10 text-text/80" : "bg-secondary text-text"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-60 mt-2">{msg.timestamp}</p>
                  </motion.div>
                </div>
              </div>
            ))}
            <AnimatePresence>
              {loading && (
                <motion.div className="flex justify-start mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center space-x-3 max-w-md">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary shadow-soft">
                      <span className="font-bold text-lg text-white">AI</span>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary shadow-soft flex items-center space-x-2">
                      <motion.div className="w-2 h-2 bg-text rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0 }} />
                      <motion.div
                        className="w-2 h-2 bg-text rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-text rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5,
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 bg-bgLight">
            <div className="max-w-3xl mx-auto">
              <form ref={formRef} onSubmit={handleSubmit} className="flex items-center space-x-3 bg-bgLight p-3 rounded-full shadow-soft border border-primary/10">
                {!hasReport && (
                  <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-text/60 hover:text-primary transition-colors" disabled={isUploading}>
                    <motion.div
                      animate={isUploading ? { rotate: 360 } : { rotate: 0 }}
                      transition={{
                        duration: 1,
                        repeat: isUploading ? Infinity : 0,
                      }}
                    >
                      <PaperClipIcon className="h-6 w-6" />
                    </motion.div>
                  </button>
                )}
                <input type="file" accept=".pdf" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={isUploading} />
                <input
                  type="text"
                  name="query"
                  value={query}
                  onChange={(e) => {
                    console.log(`Input changed: ${e.target.value}`);
                    setQuery(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={hasReport ? "Ask a question about your report..." : "Upload a report to start"}
                  className="flex-1 p-3 bg-transparent text-text placeholder-text/40 focus:outline-none"
                  disabled={loading || (!hasReport && !file)}
                />
                <button type="submit" disabled={loading || (!hasReport && !file && !query.trim())} className="p-3 bg-primary text-white rounded-full hover:bg-accent hover:text-text disabled:bg-gray-300 disabled:text-gray-500 transition-colors">
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
              {error && <p className="text-error text-sm mt-3 text-center">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalQueryPage;

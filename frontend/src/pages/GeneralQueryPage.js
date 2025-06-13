import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiSend, FiX, FiMenu, FiTrash2, FiUser, FiClock, FiCalendar, FiPhone, FiMail, FiPlus, FiCheck } from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";

const GeneralQueryPage = () => {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sample quick questions
  const quickQuestions = ["What are common flu symptoms?", "How to manage stress?", "Best exercises for back pain", "Healthy diet recommendations"];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const renderDoctorCard = (doctor) => {
    return (
      <motion.div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <FiUser className="text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{doctor.username}</h3>
            <p className="text-sm text-gray-600">
              {doctor.specialty} • {doctor.title}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-gray-600">
                <FiMail className="mr-2" />
                <span>{doctor.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FiPhone className="mr-2" />
                <span>{doctor.phone || "N/A"}</span>
              </div>
            </div>

            {doctor.availability && doctor.availability.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Slots:</h4>
                <div className="space-y-2">
                  {doctor.availability
                    .filter((slot) => !slot.is_booked)
                    .map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-gray-500" />
                          <span className="text-sm">{slot.day_of_week}</span>
                          <FiClock className="text-gray-500" />
                          <span className="text-sm">
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                        <button onClick={() => handleBookAppointment(doctor, slot)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center">
                          <FiPlus className="mr-1" /> Book
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const handleBookAppointment = async (doctor, slot) => {
    setLoading(true);
    try {
      // Simulate booking API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const bookingConfirmation = {
        id: Date.now(),
        doctor_username: doctor.username,
        department_name: doctor.specialty,
        appointment_date: "2023-11-15", // Would be calculated from slot
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "Confirmed",
      };

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: bookingConfirmation,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setError("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderBookingConfirmation = (booking) => {
    return (
      <motion.div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-start space-x-3">
          <div className="bg-green-100 p-2 rounded-full text-green-600">
            <FiCheck className="text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Appointment Confirmed!</h3>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Doctor:</span> {booking.doctor_username}
              </p>
              <p>
                <span className="font-medium">Department:</span> {booking.department_name}
              </p>
              <p>
                <span className="font-medium">Date:</span> {booking.appointment_date}
              </p>
              <p>
                <span className="font-medium">Time:</span> {booking.start_time} - {booking.end_time}
              </p>
              <p>
                <span className="font-medium">Status:</span> <span className="text-green-600">{booking.status}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a question");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add user message
      const userMessage = {
        role: "user",
        content: query,
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory((prev) => [...prev, userMessage]);
      setQuery("");

      // Call /api/medical-query API
      const formData = new FormData();
      formData.append("query", query);
      const apiUrl = process.env.REACT_APP_API_URL || "";
      const token = localStorage.getItem("token");
      const response = await axios.post(`${apiUrl}/api/medical-query`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      // Add bot response
      const botMessage = {
        role: "assistant",
        content: response.data.response || JSON.stringify(response.data),
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (err) {
      let errorMsg = "Error processing your request. Please try again.";
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.status) {
          errorMsg = `Error ${err.response.status}: ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setQuery(question);
    inputRef.current.focus();
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    setError(null);
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
                <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
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
                  <RiRobot2Line className="text-blue-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">CureWise Assistant</h3>
                <p className="text-gray-600 max-w-md mb-6">Ask me anything about your health, symptoms, or medical concerns. I'm here to help!</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {quickQuestions.map((question, index) => (
                    <motion.button key={index} onClick={() => handleQuickQuestion(question)} className="text-sm bg-white text-gray-700 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-left" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-6">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                    {msg.role === "assistant" && Array.isArray(msg.content) ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <RiRobot2Line />
                          </div>
                          <p className="font-medium text-gray-800">Here are some doctors that might help:</p>
                        </div>
                        {msg.content.map((doctor, idx) => renderDoctorCard(doctor))}
                      </div>
                    ) : msg.role === "assistant" && msg.content.id ? (
                      renderBookingConfirmation(msg.content)
                    ) : (
                      <motion.div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="flex items-center mb-1">
                          {msg.role === "assistant" ? <RiRobot2Line className="mr-2 text-blue-500" /> : <FiUser className="mr-2 text-blue-200" />}
                          <span className="text-xs opacity-70">{msg.timestamp}</span>
                        </div>
                        <p>{msg.content}</p>
                      </motion.div>
                    )}
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
                      <span className="text-sm text-gray-500">CureWise AI is thinking...</span>
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
              <form onSubmit={handleSubmit} className="relative">
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask a health question..." className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={loading} />
                <button type="submit" disabled={!query.trim() || loading} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
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

export default GeneralQueryPage;

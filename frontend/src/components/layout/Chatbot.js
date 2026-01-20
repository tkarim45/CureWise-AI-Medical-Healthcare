import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSend } from "react-icons/fi";
import { BsRobot, BsPerson } from "react-icons/bs";
import { RiMentalHealthLine } from "react-icons/ri";

const ChatbotComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi there! I'm HealthSync AI. How can I assist you with your health today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Sample quick questions
  const quickQuestions = ["What are my symptoms?", "Find a doctor near me", "Schedule an appointment", "Mental health resources"];

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Simulate API call (replace with actual API endpoint)
      const response = await axios.post("http://localhost:8000/chatbot", {
        query: inputValue,
      });

      // Add bot response
      const botMessage = {
        id: messages.length + 2,
        text: response.data.response || "I can help with health-related questions. Try asking about symptoms, doctors, or appointments.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  // Animation variants
  const chatContainerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      <motion.button
        onClick={toggleChatbot}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl ${isOpen ? "bg-red-500" : "bg-gradient-to-br from-blue-500 to-teal-400"}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        {isOpen ? <FiX className="text-white text-xl" /> : <RiMentalHealthLine className="text-white text-xl" />}
      </motion.button>

      {/* Chatbot Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div className="absolute bottom-20 right-0 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" variants={chatContainerVariants} initial="hidden" animate="visible" exit="exit">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-teal-400 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-full">
                  <RiMentalHealthLine className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">HealthSync AI</h3>
                  <p className="text-white text-opacity-80 text-xs">{isLoading ? "Thinking..." : "Online"}</p>
                </div>
              </div>
              <motion.button onClick={toggleChatbot} className="text-white hover:text-opacity-70" whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                <FiX className="text-lg" />
              </motion.button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto max-h-[400px]">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div key={message.id} className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`} variants={messageVariants} initial="hidden" animate="visible">
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none shadow-sm"}`}>
                      <div className="flex items-center mb-1">
                        {message.sender === "bot" ? <BsRobot className="mr-2 text-blue-500" /> : <BsPerson className="mr-2 text-blue-200" />}
                        <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div className="flex justify-start mb-4" variants={messageVariants} initial="hidden" animate="visible">
                    <div className="max-w-[80%] bg-white text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex items-center mb-1">
                        <BsRobot className="mr-2 text-blue-500" />
                        <span className="text-xs opacity-70">Just now</span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>

            {/* Quick Questions */}
            <div className="px-4 pt-2 pb-1 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 mb-2">
                {quickQuestions.map((question, index) => (
                  <motion.button key={index} onClick={() => handleQuickQuestion(question)} className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-100" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                    {question}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200">
              <div className="flex items-center">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type your health question..." className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" disabled={isLoading} />
                <motion.button type="submit" className="bg-gradient-to-br from-blue-500 to-teal-400 text-white px-4 py-2.5 rounded-r-lg hover:opacity-90 disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!inputValue.trim() || isLoading}>
                  <FiSend className="text-lg" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotComponent;

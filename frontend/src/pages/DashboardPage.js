import React, { useState } from "react";
import { useAuth } from "../context/AuthContext"; // Adjust path if needed
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar"; // Adjust path if needed
import DashboardContent from "../components/layout/DashboardContent";
import { FaHistory, FaCalendar, FaCamera, FaQuestionCircle, FaAmbulance, FaComments, FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";

// Footer Component
const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <motion.footer className="bg-gray-50 py-6 border-t border-gray-200" initial="hidden" animate="visible" variants={footerVariants}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-600">
        <p className="text-sm">© {new Date().getFullYear()} HealthSync AI. All rights reserved.</p>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <span className="text-sm">Made with</span>
          <motion.span className="text-teal-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <FaHeart />
          </motion.span>
          <span className="text-sm">by the HealthSync Team</span>
        </div>
      </div>
    </motion.footer>
  );
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("welcome");

  const dashboardCards = [
    { name: "Medical History", icon: <FaHistory className="text-3xl" />, path: "/medical-history", description: "View your health records" },
    { name: "Book Appointment", icon: <FaCalendar className="text-3xl" />, path: "/book-appointment", description: "Schedule with AI" },
    { name: "Disease Detection", icon: <FaCamera className="text-3xl" />, path: "/disease-detection", description: "Analyze images" },
    { name: "Analyze Blood Reports", icon: <FaQuestionCircle className="text-3xl" />, path: "/medical-query", description: "Ask health questions" },
    { name: "Emergency Navigation", icon: <FaAmbulance className="text-3xl" />, path: "/emergency", description: "Find help fast" },
    { name: "General Query", icon: <FaComments className="text-3xl" />, path: "/general-query", description: "Ask anything" },
    { name: "Profile", icon: <FaUser className="text-3xl" />, path: "/profile", description: "Manage your account" }, // Changed to path
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <NavBar />

      {/* Main Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="flex justify-between items-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome, <span className="text-teal-500">{user?.username || "User"}</span>!
            </h1>
            <motion.button className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600" onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Logout
            </motion.button>
          </motion.div>

          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {dashboardCards.map((card, index) => (
              <motion.div key={card.section || card.path} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer border border-gray-200 hover:border-teal-500" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: index * 0.1 }} onClick={() => (card.path ? navigate(card.path) : setActiveSection(card.section))}>
                <div className="text-teal-500 mb-4">{card.icon}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{card.name}</h2>
                <p className="text-gray-600">{card.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Dynamic Content */}
          <DashboardContent activeSection={activeSection} />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DashboardPage;

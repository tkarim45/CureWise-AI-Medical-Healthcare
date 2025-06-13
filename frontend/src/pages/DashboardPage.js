import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaHistory, FaCalendarAlt, FaFileMedical, FaAmbulance, FaCommentMedical, FaUserCog, FaEye, FaLungs, FaBrain, FaHeartbeat } from "react-icons/fa";
import { RiDashboardLine, RiMentalHealthLine } from "react-icons/ri";
import { IoMdAnalytics } from "react-icons/io";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dashboard features organized by category
  const healthFeatures = [
    {
      title: "Medical History",
      icon: <FaHistory className="text-2xl" />,
      path: "/medical-history",
      color: "bg-blue-400 bg-opacity-50 text-blue-900",
      description: "Access your complete health records",
    },
    {
      title: "Appointments",
      icon: <FaCalendarAlt className="text-2xl" />,
      path: "/book-appointment",
      color: "bg-purple-400 bg-opacity-50 text-purple-900",
      description: "Schedule and manage doctor visits",
    },
    {
      title: "Health Analytics",
      icon: <IoMdAnalytics className="text-2xl" />,
      path: "/health-analytics",
      color: "bg-teal-400 bg-opacity-50 text-teal-900",
      description: "Track your health metrics over time",
    },
  ];

  const aiDetectionFeatures = [
    {
      title: "Eye Disease Detection",
      icon: <FaEye className="text-2xl" />,
      path: "/eye-detection",
      color: "bg-indigo-300 bg-opacity-50 text-indigo-900",
      description: "Analyze eye images for diseases",
    },
    {
      title: "Lung Cancer Detection",
      icon: <FaLungs className="text-2xl" />,
      path: "/lung-detection",
      color: "bg-red-300 bg-opacity-50 text-red-900",
      description: "Screen lung CT scans for abnormalities",
    },
    {
      title: "Brain Tumor Analysis",
      icon: <FaBrain className="text-2xl" />,
      path: "/brain-analysis",
      color: "bg-blue-300 bg-opacity-50 text-blue-800",
      description: "Detect tumors in brain MRI scans",
    },
    {
      title: "Heart Health Scan",
      icon: <FaHeartbeat className="text-2xl" />,
      path: "/heart-scan",
      color: "bg-pink-300 bg-opacity-50 text-pink-900",
      description: "Analyze ECG and heart-related data",
    },
  ];

  const supportFeatures = [
    {
      title: "Medical Reports",
      icon: <FaFileMedical className="text-2xl" />,
      path: "/medical-query",
      color: "bg-green-300 bg-opacity-50 text-green-900",
      description: "Upload and analyze medical reports",
    },
    {
      title: "Emergency Services",
      icon: <FaAmbulance className="text-2xl" />,
      path: "/emergency",
      color: "bg-red-300 bg-opacity-50 text-red-900",
      description: "Immediate medical assistance",
    },
    {
      title: "Health Assistant",
      icon: <FaCommentMedical className="text-2xl" />,
      path: "/general-query",
      color: "bg-cyan-300 bg-opacity-50 text-cyan-900",
      description: "AI-powered health consultation",
    },
    {
      title: "Picture Diagnosis",
      icon: <FaFileMedical className="text-2xl" />,
      path: "/disease-detection",
      color: "bg-purple-300 bg-opacity-50 text-purple-900",
      description: "Upload images for AI analysis",
    },
    {
      title: "Account Settings",
      icon: <FaUserCog className="text-2xl" />,
      path: "/profile",
      color: "bg-gray-300 bg-opacity-50 text-gray-900",
      description: "Manage your account details",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
    }),
    hover: {
      y: -8,
      scale: 1.03,
      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      <NavBar />

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="hidden md:block w-72 bg-white shadow-lg p-6 fixed h-[calc(100vh-80px)] overflow-y-auto">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">CureWise</h2>
                <div className="space-y-4">
                  <button onClick={() => setActiveSection("dashboard")} className={`w-full flex items-center p-4 rounded-xl text-lg font-medium transition-all ${activeSection === "dashboard" ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-700 hover:bg-gray-50"}`}>
                    <RiDashboardLine className="mr-4 text-xl" />
                    Dashboard
                  </button>

                  <div className="pt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Health Tools</h3>
                    {healthFeatures.map((feature) => (
                      <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all mb-2">
                        <span className={`p-3 rounded-full mr-4 ${feature.color}`}>{feature.icon}</span>
                        <span className="text-base font-medium">{feature.title}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Detection</h3>
                    {aiDetectionFeatures.map((feature) => (
                      <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all mb-2">
                        <span className={`p-3 rounded-full mr-4 ${feature.color}`}>{feature.icon}</span>
                        <span className="text-base font-medium">{feature.title}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Support</h3>
                    {supportFeatures.map((feature) => (
                      <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all mb-2">
                        <span className={`p-3 rounded-full mr-4 ${feature.color}`}>{feature.icon}</span>
                        <span className="text-base font-medium">{feature.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`flex-1 p-8 lg:p-12 transition-all duration-300 ${isSidebarOpen ? "md:ml-72" : "md:ml-0"}`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">{activeSection === "dashboard" ? "Health Dashboard" : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
              <p className="text-lg text-gray-600 mt-2">{activeSection === "dashboard" ? `Welcome back, ${user?.username || "User"}! Manage your health seamlessly.` : "Leverage AI-powered tools for your wellness"}</p>
            </motion.div>

            <div className="flex items-center space-x-4">
              <button onClick={toggleSidebar} className="hidden md:flex items-center justify-center p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all">
                {isSidebarOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <motion.button onClick={handleLogout} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full font-semibold hover:opacity-90 shadow-md" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Logout
              </motion.button>
            </div>
          </div>

          {/* Dashboard Content */}
          {activeSection === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="space-y-12">
              {/* Health Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {healthFeatures.map((feature, index) => (
                  <motion.div key={feature.path} custom={index} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" onClick={() => navigate(feature.path)} className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`p-4 rounded-full ${feature.color} mb-4`}>{feature.icon}</div>
                        <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                        <p className="text-sm text-gray-500 mt-2">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Detection Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">AI Health Detection</h2>
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Explore All AI Tools</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {aiDetectionFeatures.map((feature, index) => (
                    <motion.div key={feature.path} custom={index + healthFeatures.length} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" onClick={() => navigate(feature.path)} className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`p-4 rounded-full ${feature.color} mb-4`}>{feature.icon}</div>
                          <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                          <p className="text-sm text-gray-500 mt-2">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Support Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Support & Assistance</h2>
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Get Help</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {supportFeatures.map((feature, index) => (
                    <motion.div key={feature.path} custom={index + healthFeatures.length + aiDetectionFeatures.length} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" onClick={() => navigate(feature.path)} className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`p-4 rounded-full ${feature.color} mb-4`}>{feature.icon}</div>
                          <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                          <p className="text-sm text-gray-500 mt-2">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Health Activity</h3>
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">View All</button>
                </div>
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2, duration: 0.5 }} className="flex items-start pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <RiMentalHealthLine className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-base font-medium text-gray-900">Completed eye disease screening</p>
                        <p className="text-sm text-gray-500">2 hours ago - 98% accuracy</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

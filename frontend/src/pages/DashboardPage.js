import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaHistory, FaCalendarAlt, FaFileMedical, FaAmbulance, FaCommentMedical, FaUserCog, FaEye, FaLungs, FaBrain, FaHeartbeat, FaSearch } from "react-icons/fa";
import { RiDashboardLine, RiMentalHealthLine } from "react-icons/ri";
import { IoMdAnalytics } from "react-icons/io";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Priority features for main dashboard
  const priorityFeatures = [
    {
      title: "Medical History",
      icon: <FaHistory className="text-2xl" />,
      path: "/medical-history",
      color: "bg-blue-400 bg-opacity-50 text-blue-900",
      description: "Access your complete health records",
      category: "health"
    },
    {
      title: "Appointments",
      icon: <FaCalendarAlt className="text-2xl" />,
      path: "/book-appointment",
      color: "bg-purple-400 bg-opacity-50 text-purple-900",
      description: "Schedule and manage doctor visits",
      category: "health"
    },
    {
      title: "Health Assistant",
      icon: <FaCommentMedical className="text-2xl" />,
      path: "/general-query",
      color: "bg-cyan-300 bg-opacity-50 text-cyan-900",
      description: "AI-powered health consultation",
      category: "support"
    },
    {
      title: "Emergency Services",
      icon: <FaAmbulance className="text-2xl" />,
      path: "/emergency",
      color: "bg-red-300 bg-opacity-50 text-red-900",
      description: "Immediate medical assistance",
      category: "support"
    },
  ];

  // All features for expanded view
  const allFeatures = [
    ...priorityFeatures,
    {
      title: "Health Analytics",
      icon: <IoMdAnalytics className="text-2xl" />,
      path: "/health-analytics",
      color: "bg-teal-400 bg-opacity-50 text-teal-900",
      description: "Track your health metrics over time",
      category: "health"
    },
    {
      title: "Lymphoma Detection",
      icon: <FaEye className="text-2xl" />,
      path: "/lymphoma",
      color: "bg-indigo-300 bg-opacity-50 text-indigo-900",
      description: "Analyze lymph node images for diseases",
      category: "ai"
    },
    {
      title: "Pneumonia Detection",
      icon: <FaLungs className="text-2xl" />,
      path: "/pneumonia",
      color: "bg-red-300 bg-opacity-50 text-red-900",
      description: "Screen chest X-ray images for pneumonia",
      category: "ai"
    },
    {
      title: "Breast Cancer Detection",
      icon: <FaHeartbeat className="text-2xl" />,
      path: "/breast-cancer",
      color: "bg-blue-300 bg-opacity-50 text-blue-800",
      description: "Detect tumors in breast MRI scans",
      category: "ai"
    },
    {
      title: "Kidney Disease Detection",
      icon: <FaLungs className="text-2xl" />,
      path: "/kidney-disease",
      color: "bg-pink-300 bg-opacity-50 text-pink-900",
      description: "Analyze kidney images for diseases",
      category: "ai"
    },
    {
      title: "Eye Disease Detection",
      icon: <FaEye className="text-2xl" />,
      path: "/eye-disease",
      color: "bg-purple-300 bg-opacity-50 text-purple-900",
      description: "Analyze eye images for diseases",
      category: "ai"
    },
    {
      title: "Medical Reports",
      icon: <FaFileMedical className="text-2xl" />,
      path: "/medical-query",
      color: "bg-green-300 bg-opacity-50 text-green-900",
      description: "Upload and analyze medical reports",
      category: "support"
    },
    {
      title: "Picture Diagnosis",
      icon: <FaFileMedical className="text-2xl" />,
      path: "/disease-detection",
      color: "bg-purple-300 bg-opacity-50 text-purple-900",
      description: "Upload images for AI analysis",
      category: "ai"
    },
    {
      title: "Account Settings",
      icon: <FaUserCog className="text-2xl" />,
      path: "/profile",
      color: "bg-gray-300 bg-opacity-50 text-gray-900",
      description: "Manage your account details",
      category: "support"
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    
    const results = allFeatures.filter(feature => 
      feature.title.toLowerCase().includes(query.toLowerCase()) ||
      feature.description.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
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
            <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="hidden md:block w-64 bg-white shadow-lg p-4 fixed h-[calc(100vh-80px)] overflow-y-auto">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">CureWise</h2>
                
                {/* Quick Access */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Access</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {priorityFeatures.slice(0, 4).map((feature) => (
                      <button key={feature.path} onClick={() => navigate(feature.path)} className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className={`p-2 rounded-full mb-2 ${feature.color}`}>{React.cloneElement(feature.icon, { className: "text-sm" })}</span>
                        <span className="text-xs font-medium text-gray-700 text-center">{feature.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Navigation */}
                <div className="space-y-1">
                  <button onClick={() => setActiveSection("dashboard")} className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeSection === "dashboard" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    <RiDashboardLine className="mr-3 text-lg" />
                    Dashboard
                  </button>

                  {/* Category Navigation */}
                  <div className="pt-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categories</h3>
                    <div className="space-y-1">
                      <button onClick={() => setExpandedCategory('health')} className={`w-full flex items-center p-2 rounded-lg text-sm transition-all ${expandedCategory === 'health' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <FaHistory className="mr-3" />
                        Health Tools
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">{allFeatures.filter(f => f.category === 'health').length}</span>
                      </button>
                      <button onClick={() => setExpandedCategory('ai')} className={`w-full flex items-center p-2 rounded-lg text-sm transition-all ${expandedCategory === 'ai' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <FaBrain className="mr-3" />
                        AI Detection
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">{allFeatures.filter(f => f.category === 'ai').length}</span>
                      </button>
                      <button onClick={() => setExpandedCategory('support')} className={`w-full flex items-center p-2 rounded-lg text-sm transition-all ${expandedCategory === 'support' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <FaCommentMedical className="mr-3" />
                        Support
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">{allFeatures.filter(f => f.category === 'support').length}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Category Items */}
                  {expandedCategory && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2 pl-4 border-l-2 border-gray-200 ml-2">
                      {allFeatures.filter(f => f.category === expandedCategory).map((feature) => (
                        <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-2 rounded text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all mb-1">
                          <span className={`p-1 rounded mr-2 ${feature.color}`}>{React.cloneElement(feature.icon, { className: "text-xs" })}</span>
                          {feature.title}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}>
          {/* Header */}
          <div className="flex flex-col space-y-4 mb-8">
            <div className="flex justify-between items-center">
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

            {/* Quick Access Toolbar */}
            {activeSection === "dashboard" && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for health tools, AI detection, or support..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button key={result.path} onClick={() => navigate(result.path)} className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0">
                          <span className={`p-2 rounded-lg mr-3 ${result.color}`}>{React.cloneElement(result.icon, { className: "text-sm" })}</span>
                          <div>
                            <p className="font-medium text-gray-900">{result.title}</p>
                            <p className="text-sm text-gray-500">{result.description}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Quick Access</h3>
                  <button onClick={() => setShowAllFeatures(!showAllFeatures)} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                    {showAllFeatures ? 'Show Less' : 'Show All Tools'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {priorityFeatures.map((feature) => (
                    <button key={feature.path} onClick={() => navigate(feature.path)} className="flex items-center px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <span className={`p-1.5 rounded-lg mr-2 ${feature.color} group-hover:scale-110 transition-transform`}>{React.cloneElement(feature.icon, { className: "text-sm" })}</span>
                      <span className="text-sm font-medium text-gray-700">{feature.title}</span>
                    </button>
                  ))}
                  {!showAllFeatures && (
                    <button onClick={() => setShowAllFeatures(true)} className="flex items-center px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-500">+{allFeatures.length - priorityFeatures.length} more</span>
                    </button>
                  )}
                </div>
                {showAllFeatures && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {allFeatures.filter(f => !priorityFeatures.find(p => p.path === f.path)).map((feature) => (
                        <button key={feature.path} onClick={() => navigate(feature.path)} className="flex items-center px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                          <span className={`p-1.5 rounded-lg mr-2 ${feature.color} opacity-70 group-hover:opacity-100 transition-opacity`}>{React.cloneElement(feature.icon, { className: "text-sm" })}</span>
                          <span className="text-sm font-medium text-gray-600">{feature.title}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Dashboard Content */}
          {activeSection === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="space-y-8">
              {/* Welcome Section with Health Summary */}
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {user?.username || "User"}!</h2>
                    <p className="text-blue-100 text-sm sm:text-base">Your personalized health dashboard. Quick access to your most important health tools.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold">Good Health</div>
                    <div className="text-xs sm:text-sm text-blue-100">Overall Status</div>
                  </div>
                </div>
                
                {/* Health Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold">3</div>
                    <div className="text-xs sm:text-sm text-blue-100">Upcoming</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold">12</div>
                    <div className="text-xs sm:text-sm text-blue-100">Records</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold">5</div>
                    <div className="text-xs sm:text-sm text-blue-100">AI Scans</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold">98%</div>
                    <div className="text-xs sm:text-sm text-blue-100">Complete</div>
                  </div>
                </div>
              </div>

              {/* Priority Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {priorityFeatures.map((feature, index) => (
                  <motion.div key={feature.path} custom={index} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" onClick={() => navigate(feature.path)} className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all">
                    <div className={`p-2 sm:p-3 rounded-full ${feature.color} mb-3 sm:mb-4 inline-block`}>{React.cloneElement(feature.icon, { className: "text-lg sm:text-2xl" })}</div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 line-clamp-2">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Expandable Categories */}
              <div className="space-y-6">
                {/* Health Tools Category */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'health' ? null : 'health')}
                    className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <FaHistory className="text-blue-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">Health Tools</h3>
                        <p className="text-sm text-gray-500">Medical records, appointments, analytics</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedCategory === 'health' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedCategory === 'health' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-gray-100 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {allFeatures.filter(f => f.category === 'health').map((feature) => (
                          <button key={feature.path} onClick={() => navigate(feature.path)} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <span className={`p-2 rounded-lg mr-3 ${feature.color}`}>{React.cloneElement(feature.icon, { className: "text-lg" })}</span>
                            <div>
                              <p className="font-medium text-gray-900">{feature.title}</p>
                              <p className="text-sm text-gray-500">{feature.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* AI Detection Category */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'ai' ? null : 'ai')}
                    className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <FaBrain className="text-purple-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">AI Detection Tools</h3>
                        <p className="text-sm text-gray-500">Advanced disease detection and analysis</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedCategory === 'ai' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedCategory === 'ai' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-gray-100 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allFeatures.filter(f => f.category === 'ai').map((feature) => (
                          <button key={feature.path} onClick={() => navigate(feature.path)} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <span className={`p-2 rounded-lg mr-3 ${feature.color}`}>{React.cloneElement(feature.icon, { className: "text-lg" })}</span>
                            <div>
                              <p className="font-medium text-gray-900">{feature.title}</p>
                              <p className="text-sm text-gray-500">{feature.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Support Category */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'support' ? null : 'support')}
                    className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <FaCommentMedical className="text-green-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">Support & Settings</h3>
                        <p className="text-sm text-gray-500">Help, reports, and account management</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedCategory === 'support' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedCategory === 'support' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-gray-100 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allFeatures.filter(f => f.category === 'support').map((feature) => (
                          <button key={feature.path} onClick={() => navigate(feature.path)} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <span className={`p-2 rounded-lg mr-3 ${feature.color}`}>{React.cloneElement(feature.icon, { className: "text-lg" })}</span>
                            <div>
                              <p className="font-medium text-gray-900">{feature.title}</p>
                              <p className="text-sm text-gray-500">{feature.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Recent Activity - Simplified */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">View All</button>
                </div>
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <RiMentalHealthLine className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Health screening completed</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
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

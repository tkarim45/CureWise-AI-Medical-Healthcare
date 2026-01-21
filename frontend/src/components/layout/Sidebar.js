import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiDashboardLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { healthFeatures, aiDetectionFeatures, supportFeatures } from "../../data/dashboardData";

const Sidebar = ({ isOpen, activeSection, setActiveSection }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="hidden md:block w-72 bg-white shadow-lg p-6 fixed h-[calc(100vh-80px)] overflow-y-auto z-20">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">CureWise</h2>
            <div className="space-y-4">
              <button onClick={() => setActiveSection("dashboard")} className={`w-full flex items-center p-4 rounded-xl text-lg font-medium transition-all duration-200 ${activeSection === "dashboard" ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <RiDashboardLine className="mr-4 text-xl" />
                Dashboard
              </button>

              <div className="pt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Health Tools</h3>
                {healthFeatures.map((feature) => (
                  <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all mb-1 group">
                    <span className={`p-2 rounded-lg mr-3 shadow-sm ${feature.color} opacity-80 group-hover:opacity-100 transition-opacity`}>{React.cloneElement(feature.icon, { className: "text-lg" })}</span>
                    <span className="text-sm font-medium">{feature.title}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">AI Detection</h3>
                {aiDetectionFeatures.map((feature) => (
                  <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all mb-1 group">
                    <span className={`p-2 rounded-lg mr-3 shadow-sm ${feature.color} opacity-80 group-hover:opacity-100 transition-opacity`}>{React.cloneElement(feature.icon, { className: "text-lg" })}</span>
                    <span className="text-sm font-medium">{feature.title}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Support</h3>
                {supportFeatures.map((feature) => (
                  <button key={feature.path} onClick={() => navigate(feature.path)} className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all mb-1 group">
                    <span className={`p-2 rounded-lg mr-3 shadow-sm ${feature.color} opacity-80 group-hover:opacity-100 transition-opacity`}>{React.cloneElement(feature.icon, { className: "text-lg" })}</span>
                    <span className="text-sm font-medium">{feature.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;

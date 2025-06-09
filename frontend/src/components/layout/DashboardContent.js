import React from "react";
import { motion } from "framer-motion";

const DashboardContent = ({ activeSection }) => {
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderContent = () => {
    switch (activeSection) {
      case "welcome":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <p className="text-gray-600">This is your personalized dashboard. Use the cards above to explore HealthSync AI’s features tailored to your health needs.</p>
          </motion.div>
        );
      case "medical-history":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Medical History Records</h2>
            <p className="text-gray-600">View and analyze your medical history (coming soon).</p>
          </motion.div>
        );
      case "appointment-scheduler":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Book Appointment</h2>
            <p className="text-gray-600">Schedule a doctor’s visit with our LLM-powered assistant (coming soon).</p>
          </motion.div>
        );
      case "disease-detection":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Image-Based Disease Detection</h2>
            <p className="text-gray-600">Upload images for AI disease analysis (coming soon).</p>
          </motion.div>
        );
      case "medical-query":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Medical Query Assistant</h2>
            <p className="text-gray-600">Ask medical questions and get answers from research data (coming soon).</p>
          </motion.div>
        );
      case "emergency-navigation":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Emergency Navigation</h2>
            <p className="text-gray-600">Find the nearest hospital with Google Maps (coming soon).</p>
          </motion.div>
        );
      case "general-query":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">General Query Handler</h2>
            <p className="text-gray-600">Ask anything, from weather to trivia (coming soon).</p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
};

export default DashboardContent;

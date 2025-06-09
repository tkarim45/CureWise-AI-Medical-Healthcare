import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaNotesMedical } from "react-icons/fa";
import Footer from "../components/layout/Footer"; // Assuming Footer is extracted as a reusable component

const MedicalHistoryPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicalHistory = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/medical-history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch medical history");
        }
        const data = await response.json();
        setMedicalHistory(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (user && token) {
      fetchMedicalHistory();
    }
  }, [user, token]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="flex justify-between items-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-gray-800">
              Medical History for <span className="text-teal-500">{user?.username || "User"}</span>
            </h1>
            <motion.button className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600" onClick={handleBack} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Back to Dashboard
            </motion.button>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : medicalHistory.length === 0 ? (
            <div className="text-center text-gray-600">No medical history records found.</div>
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants} initial="hidden" animate="visible">
              {medicalHistory.map((record) => (
                <motion.div key={record.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200" variants={cardVariants}>
                  <div className="flex items-center mb-4">
                    <FaNotesMedical className="text-teal-500 text-2xl mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Medical Record</h2>
                  </div>
                  <div className="space-y-2">
                    {record.conditions && (
                      <p>
                        <strong>Conditions:</strong> {record.conditions}
                      </p>
                    )}
                    {record.allergies && (
                      <p>
                        <strong>Allergies:</strong> {record.allergies}
                      </p>
                    )}
                    {record.notes && (
                      <p>
                        <strong>Notes:</strong> {record.notes}
                      </p>
                    )}
                    {record.updated_at && (
                      <p>
                        <strong>Last Updated:</strong> {new Date(record.updated_at).toLocaleString()}
                      </p>
                    )}
                    {record.updated_by && (
                      <p>
                        <strong>Updated By:</strong> {record.updated_by}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MedicalHistoryPage;

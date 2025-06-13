import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaNotesMedical, FaPlus, FaChevronLeft } from "react-icons/fa";
import { MdSick, MdAllInclusive, MdDescription } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { RiUserSharedFill } from "react-icons/ri";

const API_URL = process.env.REACT_APP_API_URL;

const MedicalHistoryPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ conditions: "", allergies: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMedicalHistory();
    // eslint-disable-next-line
  }, [user, token]);

  const fetchMedicalHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/medical-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch medical history");
      const data = await response.json();
      setMedicalHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/medical-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to add medical history");
      setForm({ conditions: "", allergies: "", notes: "" });
      setShowForm(false);
      await fetchMedicalHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => navigate("/dashboard");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <button onClick={handleBack} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                <FaChevronLeft className="mr-1" />
                Back to Dashboard
              </button>

              <button onClick={() => setShowForm(!showForm)} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <FaPlus className="mr-2" />
                {showForm ? "Cancel" : "Add Record"}
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Medical History</h1>
            <p className="text-gray-600">View and manage your medical records and health information</p>
          </motion.div>

          {/* Add Medical History Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaNotesMedical className="text-blue-500 mr-2" />
                    Add New Medical Record
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <MdSick className="text-blue-500 mr-2" />
                        Medical Conditions
                      </label>
                      <input type="text" name="conditions" value={form.conditions} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300" placeholder="e.g. Diabetes, Hypertension" />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple conditions with commas</p>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <MdAllInclusive className="text-blue-500 mr-2" />
                        Allergies
                      </label>
                      <input type="text" name="allergies" value={form.allergies} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300" placeholder="e.g. Penicillin, Nuts" />
                      <p className="text-xs text-gray-500 mt-1">List all known allergies</p>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2 flex items-center">
                        <MdDescription className="text-blue-500 mr-2" />
                        Additional Notes
                      </label>
                      <textarea name="notes" value={form.notes} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300" placeholder="Any other important health information" rows={4} />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center">
                        {submitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          "Save Record"
                        )}
                      </button>
                    </div>

                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mt-4">{error}</div>}
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Medical History List */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Medical Records</h2>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>
            ) : medicalHistory.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <FaNotesMedical className="text-gray-300 text-5xl mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No medical records found</h3>
                <p className="text-gray-500 mb-4">Add your first medical record to get started</p>
                <button onClick={() => setShowForm(true)} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Add First Record
                </button>
              </div>
            ) : (
              <motion.div className="grid grid-cols-1 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                <AnimatePresence>
                  {medicalHistory.map((record) => (
                    <motion.div key={record.id} variants={cardVariants} whileHover="hover" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                              <FaNotesMedical className="text-blue-500 text-xl" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">Medical Record</h3>
                              <p className="text-sm text-gray-500">ID: {record.id}</p>
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{new Date(record.updated_at).toLocaleDateString()}</span>
                        </div>

                        <div className="space-y-4 pl-16">
                          {record.conditions && (
                            <div className="flex">
                              <div className="flex-shrink-0 mr-3 text-blue-500">
                                <MdSick className="text-lg" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Conditions</h4>
                                <p className="text-gray-800">{record.conditions}</p>
                              </div>
                            </div>
                          )}

                          {record.allergies && (
                            <div className="flex">
                              <div className="flex-shrink-0 mr-3 text-blue-500">
                                <MdAllInclusive className="text-lg" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Allergies</h4>
                                <p className="text-gray-800">{record.allergies}</p>
                              </div>
                            </div>
                          )}

                          {record.notes && (
                            <div className="flex">
                              <div className="flex-shrink-0 mr-3 text-blue-500">
                                <MdDescription className="text-lg" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                                <p className="text-gray-800">{record.notes}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
                            {record.updated_at && (
                              <div className="flex items-center text-sm text-gray-500">
                                <IoMdTime className="mr-1" />
                                <span>Updated: {new Date(record.updated_at).toLocaleString()}</span>
                              </div>
                            )}

                            {record.updated_by && (
                              <div className="flex items-center text-sm text-gray-500">
                                <RiUserSharedFill className="mr-1" />
                                <span>By: {record.updated_by}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicalHistoryPage;

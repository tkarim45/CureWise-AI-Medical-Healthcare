import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";
import { FaBuilding, FaCalendar, FaHeart } from "react-icons/fa";

// Footer Component (unchanged)
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

// Dynamic Content Component
const DoctorContent = ({ activeSection, department, todayAppointments, weekAppointments, medicalHistory, expandedAppointment, toggleMedicalHistory, error, viewMode, setViewMode }) => {
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderAppointments = (appointments, title) => (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {appointments.length === 0 ? (
        <p className="text-gray-600">No appointments scheduled.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-gray-700 font-semibold">Patient</th>
              <th className="py-2 px-4 text-gray-700 font-semibold">Email</th>
              <th className="py-2 px-4 text-gray-700 font-semibold">Date</th>
              <th className="py-2 px-4 text-gray-700 font-semibold">Time</th>
              <th className="py-2 px-4 text-gray-700 font-semibold">Status</th>
              <th className="py-2 px-4 text-gray-700 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <>
                <tr key={appt.id} className="border-b">
                  <td className="py-2 px-4">{appt.username}</td>
                  <td className="py-2 px-4">{appt.email}</td>
                  <td className="py-2 px-4">{appt.appointment_date}</td>
                  <td className="py-2 px-4">{`${appt.start_time} - ${appt.end_time}`}</td>
                  <td className="py-2 px-4">{appt.status}</td>
                  <td className="py-2 px-4">
                    <button onClick={() => toggleMedicalHistory(appt.id, appt.user_id)} className="text-teal-500 hover:text-teal-600 font-semibold">
                      {expandedAppointment === appt.id ? "Hide History" : "View History"}
                    </button>
                  </td>
                </tr>
                {expandedAppointment === appt.id && (
                  <tr>
                    <td colSpan="6" className="py-2 px-4 bg-gray-50">
                      <div className="mt-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Medical History for {appt.username}</h3>
                        {medicalHistory[appt.user_id]?.length > 0 ? (
                          <ul className="space-y-2">
                            {medicalHistory[appt.user_id].map((record) => (
                              <li key={record.id} className="border-t pt-2">
                                <p>
                                  <strong>Conditions:</strong> {record.conditions || "None"}
                                </p>
                                <p>
                                  <strong>Allergies:</strong> {record.allergies || "None"}
                                </p>
                                <p>
                                  <strong>Notes:</strong> {record.notes || "None"}
                                </p>
                                <p>
                                  <strong>Updated:</strong> {record.updated_at || "N/A"}
                                </p>
                                <p>
                                  <strong>By:</strong> {record.updated_by || "N/A"}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600">No medical history available.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "welcome":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <p className="text-gray-600">Welcome to the Doctor Dashboard. Use the cards above to manage your department and appointments.</p>
          </motion.div>
        );
      case "view-department":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assigned Department</h2>
            {department ? (
              <div>
                <p>
                  <strong>Department:</strong> {department.name}
                </p>
                <p>
                  <strong>Hospital:</strong> {department.hospital_name || "Not specified"}
                </p>
              </div>
            ) : (
              <p className="text-red-500 text-sm">No department assigned.</p>
            )}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </motion.div>
        );
      case "view-appointments":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <div className="flex space-x-4 mb-4">
              <button onClick={() => setViewMode("today")} className={`px-4 py-2 rounded-lg font-semibold ${viewMode === "today" ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-700"}`}>
                Today's Appointments
              </button>
              <button onClick={() => setViewMode("week")} className={`px-4 py-2 rounded-lg font-semibold ${viewMode === "week" ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-700"}`}>
                This Week's Appointments
              </button>
            </div>
            {viewMode === "today" ? renderAppointments(todayAppointments, "Today's Appointments") : renderAppointments(weekAppointments, "This Week's Appointments")}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
};

// Main Dashboard Component
const DoctorDashboard = () => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState("welcome");
  const [department, setDepartment] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState({});
  const [expandedAppointment, setExpandedAppointment] = useState(null);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("today");

  // Fetch department and appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch department
        const departmentResponse = await fetch("http://localhost:8000/api/doctor/department", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const departmentData = await departmentResponse.json();
        if (departmentResponse.ok) {
          setDepartment(departmentData);
        } else {
          console.error("Failed to fetch department:", departmentData.detail);
          setError(departmentData.detail || "Failed to fetch department");
        }

        // Fetch today's appointments
        const todayResponse = await fetch("http://localhost:8000/api/doctor/appointments/today", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const todayData = await todayResponse.json();
        if (todayResponse.ok) {
          setTodayAppointments(todayData);
        } else {
          console.error("Failed to fetch today's appointments:", todayData.detail);
          setError(todayData.detail || "Failed to fetch today's appointments");
        }

        // Fetch week's appointments
        const weekResponse = await fetch("http://localhost:8000/api/doctor/appointments/week", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const weekData = await weekResponse.json();
        if (weekResponse.ok) {
          setWeekAppointments(weekData);
        } else {
          console.error("Failed to fetch week's appointments:", weekData.detail);
          setError(weekData.detail || "Failed to fetch week's appointments");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error fetching data: " + err.message);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Fetch medical history for a patient when appointment is expanded
  const toggleMedicalHistory = async (appointmentId, userId) => {
    if (expandedAppointment === appointmentId) {
      setExpandedAppointment(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/doctor/patient/${userId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMedicalHistory((prev) => ({ ...prev, [userId]: data }));
        setExpandedAppointment(appointmentId);
      } else {
        console.error("Failed to fetch medical history:", data.detail);
        setError(data.detail || "Failed to fetch medical history");
      }
    } catch (err) {
      console.error("Error fetching medical history:", err);
      setError("Error fetching medical history: " + err.message);
    }
  };

  const dashboardCards = [
    { name: "View Department", icon: <FaBuilding className="text-3xl" />, section: "view-department", description: "View your assigned department" },
    { name: "Appointments", icon: <FaCalendar className="text-3xl" />, section: "view-appointments", description: "Manage your appointments" },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="flex justify-between items-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-gray-800">
              Doctor Dashboard, <span className="text-teal-500">{user?.username || "Doctor"}</span>!
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
            {dashboardCards.map((card, index) => (
              <motion.div key={card.section} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer border border-gray-200 hover:border-teal-500" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: index * 0.1 }} onClick={() => setActiveSection(card.section)}>
                <div className="text-teal-500 mb-4">{card.icon}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{card.name}</h2>
                <p className="text-gray-600">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <DoctorContent activeSection={activeSection} department={department} todayAppointments={todayAppointments} weekAppointments={weekAppointments} medicalHistory={medicalHistory} expandedAppointment={expandedAppointment} toggleMedicalHistory={toggleMedicalHistory} error={error} viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorDashboard;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";
import { FaBuilding, FaCalendar, FaUserMd, FaClock, FaChevronRight } from "react-icons/fa";
import { FaFileMedical } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL;

// Main Dashboard Component
const DoctorDashboard = () => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [department, setDepartment] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [nextWeekAppointments, setNextWeekAppointments] = useState([]);
  const [viewMode, setViewMode] = useState("today");
  const [availability, setAvailability] = useState([]);
  const [recentActivity] = useState(["Completed appointment with John Doe", "Updated availability for Friday", "Reviewed medical history for Jane Smith", "Added notes for patient Ali Khan", "Completed appointment with Sara Lee", "Changed status of appointment with Mike Ross", "Updated profile information"]);
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const [summaryLoadingId, setSummaryLoadingId] = useState(null);
  const [summaryData, setSummaryData] = useState({});

  // Fetch department, appointments, and availability
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch department
        const departmentResponse = await fetch(`${API_URL}/api/doctor/department`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const departmentData = await departmentResponse.json();
        if (departmentResponse.ok) {
          setDepartment(departmentData);
        } else {
          console.error("Failed to fetch department:", departmentData.detail);
        }

        // Fetch today's appointments
        const todayResponse = await fetch(`${API_URL}/api/doctor/appointments/today`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const todayData = await todayResponse.json();
        if (todayResponse.ok) {
          setTodayAppointments(todayData);
        } else {
          console.error("Failed to fetch today's appointments:", todayData.detail);
        }

        // Fetch week's appointments
        const weekResponse = await fetch(`${API_URL}/api/doctor/appointments/week`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const weekData = await weekResponse.json();
        if (weekResponse.ok) {
          setWeekAppointments(weekData);
        } else {
          console.error("Failed to fetch week's appointments:", weekData.detail);
        }

        // Fetch next week's appointments
        const nextWeekResponse = await fetch(`${API_URL}/api/doctor/appointments/next-week`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nextWeekData = await nextWeekResponse.json();
        if (nextWeekResponse.ok) {
          setNextWeekAppointments(nextWeekData);
        } else {
          console.error("Failed to fetch next week's appointments:", nextWeekData.detail);
        }

        // Fetch availability (for today as example)
        if (user?.user_id) {
          const today = new Date().toISOString().slice(0, 10);
          const res = await fetch(`${API_URL}/api/doctor/${user.user_id}/slots?date=${today}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setAvailability(await res.json());
          }
        }
      } catch (err) {
        console.error("Error fetching data: " + err.message);
      }
    };
    if (token) fetchData();
  }, [token, user]);

  // Dashboard cards
  const dashboardCards = [
    {
      id: "department",
      title: "Department",
      icon: <FaBuilding className="text-2xl text-blue-500" />,
      count: department ? 1 : 0,
      bgColor: "bg-blue-50",
      action: () => setActiveSection("department"),
    },
    {
      id: "appointments",
      title: "Appointments",
      icon: <FaCalendar className="text-2xl text-green-500" />,
      count: weekAppointments.length,
      bgColor: "bg-green-50",
      action: () => setActiveSection("appointments"),
    },
    {
      id: "availability",
      title: "Availability",
      icon: <FaClock className="text-2xl text-orange-500" />,
      count: availability.length,
      bgColor: "bg-orange-50",
      action: () => setActiveSection("availability"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Doctor Panel</h2>
            <div className="space-y-2">
              <button onClick={() => setActiveSection("dashboard")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaUserMd className="mr-3" />
                  <span>Dashboard</span>
                </div>
                <FaChevronRight className="text-xs" />
              </button>
              <button onClick={() => setActiveSection("department")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "department" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaBuilding className="mr-3" />
                  <span>Department</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{department ? 1 : 0}</span>
              </button>
              <button onClick={() => setActiveSection("appointments")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "appointments" ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaCalendar className="mr-3" />
                  <span>Appointments</span>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{weekAppointments.length}</span>
              </button>
              <button onClick={() => setActiveSection("availability")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "availability" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaClock className="mr-3" />
                  <span>Availability</span>
                </div>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{availability.length}</span>
              </button>
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl font-bold text-gray-800">{activeSection === "dashboard" ? `Dashboard Overview` : activeSection === "department" ? "Department Details" : activeSection === "appointments" ? "Appointments" : "Availability"}</h1>
            <p className="text-gray-600">{activeSection === "dashboard" ? `Welcome back, Dr. ${user?.username || "Doctor"}! Here’s your latest activity and stats.` : "Manage and monitor your department, appointments, and schedule."}</p>
          </motion.div>
          {/* Dashboard Overview */}
          {activeSection === "dashboard" && (
            <motion.div variants={{}} initial="hidden" animate="visible" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCards.map((card) => (
                  <motion.div key={card.id} whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} className={`${card.bgColor} p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-200`} onClick={card.action}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{card.count}</h3>
                      </div>
                      <div className="p-3 rounded-lg bg-white bg-opacity-50">{card.icon}</div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <span>View all</span>
                      <FaChevronRight className="ml-1 text-xs" />
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Professional Recent Activity Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow border border-gray-100 p-6 mt-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Recent Activity
                </h2>
                <ul className="divide-y divide-gray-100">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 7).map((activity, idx) => (
                      <li key={idx} className="py-3 flex items-start group hover:bg-blue-50 rounded-lg transition">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mr-3 shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-800 font-medium">{activity}</span>
                          <div className="text-xs text-gray-400 mt-1">Just now</div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-3 text-gray-400 text-center">No recent activity.</li>
                  )}
                </ul>
              </div>
            </motion.div>
          )}
          {/* Department Details */}
          {activeSection === "department" && department && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Assigned Department</h2>
              <div className="space-y-2">
                <p>
                  <strong>Department:</strong> {department.name}
                </p>
                <p>
                  <strong>Hospital:</strong> {department.hospital_name || "Not specified"}
                </p>
                {department.floor && (
                  <p>
                    <strong>Floor:</strong> {department.floor}
                  </p>
                )}
                {department.phone && (
                  <p>
                    <strong>Phone:</strong> {department.phone}
                  </p>
                )}
                {department.head_id && (
                  <p>
                    <strong>Head ID:</strong> {department.head_id}
                  </p>
                )}
              </div>
            </motion.div>
          )}
          {/* Appointments Section */}
          {activeSection === "appointments" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex space-x-4 mb-4">
                <button onClick={() => setViewMode("today")} className={`px-4 py-2 rounded-md font-semibold border transition-colors duration-150 ${viewMode === "today" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"}`}>
                  Today's Appointments
                </button>
                <button onClick={() => setViewMode("week")} className={`px-4 py-2 rounded-md font-semibold border transition-colors duration-150 ${viewMode === "week" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"}`}>
                  This Week's Appointments
                </button>
                <button onClick={() => setViewMode("nextWeek")} className={`px-4 py-2 rounded-md font-semibold border transition-colors duration-150 ${viewMode === "nextWeek" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"}`}>
                  Next Week's Appointments
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4">{viewMode === "today" ? "Today's Appointments" : viewMode === "week" ? "This Week's Appointments" : "Next Week's Appointments"}</h2>
                {(() => {
                  const appts = viewMode === "today" ? todayAppointments : viewMode === "week" ? weekAppointments : nextWeekAppointments;
                  return appts.length === 0 ? (
                    <p className="text-gray-600">No appointments scheduled.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical History</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {appts.map((appt) => [
                          <tr key={appt.id} className="hover:bg-blue-50 cursor-pointer transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">{appt.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appt.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appt.appointment_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{`${appt.start_time} - ${appt.end_time}`}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${appt.status === "completed" ? "bg-green-100 text-green-800" : appt.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>{appt.status}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                              <button
                                className="text-primary-600 hover:underline font-medium"
                                onClick={async () => {
                                  if (!appt._history) {
                                    const res = await fetch(`${API_URL}/api/doctor/patient/${appt.user_id}/history`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    const data = await res.json();
                                    appt._history = data;
                                    setTodayAppointments((prev) => prev.map((a) => (a.id === appt.id ? { ...a, _history: data } : a)));
                                    setWeekAppointments((prev) => prev.map((a) => (a.id === appt.id ? { ...a, _history: data } : a)));
                                    setNextWeekAppointments((prev) => prev.map((a) => (a.id === appt.id ? { ...a, _history: data } : a)));
                                  }
                                  setExpandedAppointmentId(appt.id === expandedAppointmentId ? null : appt.id);
                                }}
                              >
                                {expandedAppointmentId === appt.id ? "Hide" : "View"}
                              </button>
                              <button
                                className={`ml-2 transition-all duration-200 rounded-full p-2 shadow-md border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-blue-300 hover:from-blue-200 hover:to-blue-400 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 ${summaryLoadingId === appt.id ? "animate-pulse opacity-60" : ""}`}
                                title="Summarize Medical History"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setSummaryLoadingId(appt.id);
                                  setSummaryData((prev) => ({ ...prev, [appt.id]: null }));
                                  try {
                                    const res = await fetch(`${API_URL}/api/doctor/patient/${appt.user_id}/history/summary`, {
                                      method: "POST",
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    const data = await res.json();
                                    setSummaryData((prev) => ({ ...prev, [appt.id]: data.summary }));
                                  } catch (err) {
                                    setSummaryData((prev) => ({ ...prev, [appt.id]: "Failed to summarize." }));
                                  } finally {
                                    setSummaryLoadingId(null);
                                  }
                                }}
                              >
                                <FaFileMedical size={20} className="text-blue-700 drop-shadow-md" />
                              </button>
                            </td>
                          </tr>,
                          expandedAppointmentId === appt.id && (
                            <tr key={appt.id + "-history"}>
                              <td colSpan="6" className="bg-primary-50 px-6 py-4">
                                <div>
                                  <h3 className="font-semibold text-primary-700 mb-2">Medical History for {appt.username}</h3>
                                  {summaryLoadingId === appt.id ? (
                                    <div className="text-blue-600 font-medium">Summarizing...</div>
                                  ) : summaryData[appt.id] ? (
                                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                                      <strong>Summary:</strong> {summaryData[appt.id]}
                                    </div>
                                  ) : null}
                                  {appt._history && appt._history.length > 0 ? (
                                    <ul className="space-y-2">
                                      {appt._history.map((record) => (
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
                                    <p className="text-gray-500">No medical history available.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ),
                        ])}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </motion.div>
          )}
          {/* Availability Section */}
          {activeSection === "availability" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Availability</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availability.length > 0 ? (
                  availability.map((slot, idx) => (
                    <div key={idx} className="bg-orange-50 rounded p-3 text-center text-sm text-orange-700 border border-orange-200">
                      <span className="font-semibold">{slot.start_time}</span> - <span className="font-semibold">{slot.end_time}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-gray-400">No availability slots for today.</div>
                )}
              </div>
              {/* Optionally add edit functionality here */}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";
import { FaCalendarCheck, FaHeart } from "react-icons/fa";

// Footer Component (reused from other dashboards)
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
const BookAppointmentContent = ({ activeSection, hospitals, departments, doctors, slots, formData, setFormData, message, error, handleSubmit }) => {
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderContent = () => {
    switch (activeSection) {
      case "welcome":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <p className="text-gray-600">Welcome to the Appointment Booking page. Use the card above to book an appointment with a doctor.</p>
          </motion.div>
        );
      case "book-appointment":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Book an Appointment</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Hospital Dropdown */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Hospital</label>
                  <select value={formData.hospital_id} onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value, department_id: "", doctor_id: "", date: "", slot: null })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" required>
                    <option value="">Select Hospital</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Dropdown */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Department</label>
                  <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value, doctor_id: "", date: "", slot: null })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" required disabled={!formData.hospital_id}>
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Dropdown */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Doctor</label>
                  <select value={formData.doctor_id} onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value, date: "", slot: null })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" required disabled={!formData.department_id}>
                    <option value="">Select Doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc.user_id} value={doc.user_id}>
                        {doc.username} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value, slot: null })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" min={new Date().toISOString().split("T")[0]} required disabled={!formData.doctor_id} />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Available Time Slots</label>
                  {formData.date && slots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((slot, index) => (
                        <button key={index} type="button" onClick={() => setFormData({ ...formData, slot })} className={`p-2 rounded-lg border ${formData.slot && formData.slot.start_time === slot.start_time ? "bg-teal-500 text-white border-teal-500" : "bg-white border-gray-300 hover:border-teal-500"} text-sm font-semibold`}>
                          {`${slot.start_time} - ${slot.end_time}`}
                        </button>
                      ))}
                    </div>
                  ) : formData.date ? (
                    <p className="text-gray-600">No slots available for this date.</p>
                  ) : (
                    <p className="text-gray-600">Select a date to view available slots.</p>
                  )}
                </div>
              </div>

              {message && <p className="text-green-500 text-sm mt-4">{message}</p>}
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              <button type="submit" className="mt-6 w-full p-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 disabled:bg-gray-400" disabled={!formData.slot}>
                Book Appointment
              </button>
            </form>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
};

// Main Page Component
const BookAppointmentPage = () => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState("welcome");
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [formData, setFormData] = useState({
    hospital_id: "",
    department_id: "",
    doctor_id: "",
    date: "",
    slot: null,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch hospitals on mount
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/hospitals", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setHospitals(data);
        } else {
          setError(data.detail || "Failed to fetch hospitals");
        }
      } catch (err) {
        setError("Error fetching hospitals: " + err.message);
      }
    };
    if (token) fetchHospitals();
  }, [token]);

  // Fetch departments when hospital changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.hospital_id) {
        setDepartments([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/api/departments?hospital_id=${formData.hospital_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setDepartments(data);
        } else {
          setError(data.detail || "Failed to fetch departments");
        }
      } catch (err) {
        setError("Error fetching departments: " + err.message);
      }
    };
    fetchDepartments();
  }, [formData.hospital_id, token]);

  // Fetch doctors when department changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!formData.department_id) {
        setDoctors([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/api/doctors?department_id=${formData.department_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setDoctors(data);
        } else {
          setError(data.detail || "Failed to fetch doctors");
        }
      } catch (err) {
        setError("Error fetching doctors: " + err.message);
      }
    };
    fetchDoctors();
  }, [formData.department_id, token]);

  // Fetch time slots when doctor and date change
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.doctor_id || !formData.date) {
        setSlots([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/api/doctor/${formData.doctor_id}/slots?date=${formData.date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setSlots(data);
        } else {
          setError(data.detail || "Failed to fetch time slots");
        }
      } catch (err) {
        setError("Error fetching time slots: " + err.message);
      }
    };
    fetchSlots();
  }, [formData.doctor_id, formData.date, token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!formData.slot) {
      setError("Please select a time slot");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.user_id,
          doctor_id: formData.doctor_id,
          hospital_id: formData.hospital_id,
          department_id: formData.department_id,
          start_time: formData.slot.start_time,
          end_time: formData.slot.end_time,
          appointment_date: formData.date,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Appointment booked successfully!");
        setFormData({ hospital_id: "", department_id: "", doctor_id: "", date: "", slot: null });
        setSlots([]);
      } else {
        setError(data.detail || "Failed to book appointment");
      }
    } catch (err) {
      setError("Error booking appointment: " + err.message);
    }
  };

  const dashboardCards = [
    {
      name: "Book Appointment",
      icon: <FaCalendarCheck className="text-3xl" />,
      section: "book-appointment",
      description: "Schedule an appointment with a doctor",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  if (!user || !token) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <NavBar />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-500">Please log in to book an appointment.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="flex justify-between items-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-gray-800">
              Book an Appointment, <span className="text-teal-500">{user?.username || "User"}</span>!
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {dashboardCards.map((card, index) => (
              <motion.div key={card.section} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center cursor-pointer border border-gray-200 hover:border-teal-500" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover" transition={{ delay: index * 0.1 }} onClick={() => setActiveSection(card.section)}>
                <div className="text-teal-500 mb-4">{card.icon}</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{card.name}</h2>
                <p className="text-gray-600">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <BookAppointmentContent activeSection={activeSection} hospitals={hospitals} departments={departments} doctors={doctors} slots={slots} formData={formData} setFormData={setFormData} message={message} error={error} handleSubmit={handleSubmit} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookAppointmentPage;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";
import { FaCalendarAlt, FaClock, FaHospital, FaUserMd, FaChevronRight, FaCheckCircle } from "react-icons/fa";
import { MdDepartureBoard } from "react-icons/md";

const API_URL = process.env.REACT_APP_API_URL;

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-white py-6 border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-500">
        <p className="text-sm">© {new Date().getFullYear()} HealthSync AI. All rights reserved.</p>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <span className="text-sm">Made with care by the HealthSync Team</span>
        </div>
      </div>
    </footer>
  );
};

// Stepper Component
const Stepper = ({ currentStep }) => {
  const steps = [
    { id: "hospital", label: "Hospital" },
    { id: "department", label: "Department" },
    { id: "doctor", label: "Doctor" },
    { id: "datetime", label: "Date & Time" },
    { id: "confirm", label: "Confirm" },
  ];

  return (
    <div className="flex justify-between items-center mb-8 relative">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -z-10"></div>
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= index + 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}`}>{currentStep > index + 1 ? <FaCheckCircle className="text-sm" /> : index + 1}</div>
          <span className={`text-xs mt-2 ${currentStep >= index + 1 ? "text-blue-500 font-medium" : "text-gray-400"}`}>{step.label}</span>
          {index < steps.length - 1 && <div className={`absolute top-4 left-12 w-16 h-1 ${currentStep > index + 1 ? "bg-blue-500" : "bg-gray-100"}`}></div>}
        </div>
      ))}
    </div>
  );
};

// Appointment Booking Form
const AppointmentForm = ({ hospitals, departments, doctors, slots, formData, setFormData, currentStep, setCurrentStep, message, error, handleSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleSubmit(e);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Stepper currentStep={currentStep} />

      <form onSubmit={handleFormSubmit} className="p-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaHospital className="text-blue-500 mr-2" />
                Select Hospital
              </h3>
              <div className="space-y-4">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.hospital_id === hospital.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        hospital_id: hospital.id,
                        department_id: "",
                        doctor_id: "",
                        date: "",
                        slot: null,
                      });
                      handleNext();
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">{hospital.name}</h4>
                        <p className="text-sm text-gray-500">{hospital.address}</p>
                      </div>
                      <FaChevronRight className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <MdDepartureBoard className="text-blue-500 mr-2" />
                Select Department
              </h3>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.department_id === dept.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        department_id: dept.id,
                        doctor_id: "",
                        date: "",
                        slot: null,
                      });
                      handleNext();
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">{dept.name}</h4>
                        <p className="text-sm text-gray-500">{dept.description || "General medical services"}</p>
                      </div>
                      <FaChevronRight className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleBack} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Back
              </button>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaUserMd className="text-blue-500 mr-2" />
                Select Doctor
              </h3>
              <div className="space-y-4">
                {doctors.map((doc) => (
                  <div
                    key={doc.user_id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.doctor_id === doc.user_id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        doctor_id: doc.user_id,
                        date: "",
                        slot: null,
                      });
                      handleNext();
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">Dr. {doc.username}</h4>
                        <p className="text-sm text-gray-500">{doc.specialty}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Available Today</span>
                        </div>
                      </div>
                      <FaChevronRight className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleBack} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Back
              </button>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaCalendarAlt className="text-blue-500 mr-2" />
                Select Date & Time
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value, slot: null })} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" min={new Date().toISOString().split("T")[0]} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slots</label>
                {formData.date && slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map((slot, index) => (
                      <button key={index} type="button" onClick={() => setFormData({ ...formData, slot })} className={`p-3 rounded-lg border flex flex-col items-center ${formData.slot && formData.slot.start_time === slot.start_time ? "bg-blue-500 text-white border-blue-500" : "bg-white border-gray-200 hover:border-blue-300"}`}>
                        <FaClock className="mb-1" />
                        <span className="text-sm font-medium">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : formData.date ? (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">No available slots for this date. Please select another date.</div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">Please select a date to view available time slots.</div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={handleBack} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Back
                </button>
                <button type="button" onClick={handleNext} disabled={!formData.slot} className={`px-6 py-2 rounded-lg ${formData.slot ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Appointment</h3>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hospital:</span>
                    <span className="font-medium">{hospitals.find((h) => h.id === formData.hospital_id)?.name || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{departments.find((d) => d.id === formData.department_id)?.name || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium">{doctors.find((d) => d.user_id === formData.doctor_id)?.username || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formData.date || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formData.slot ? `${formData.slot.start_time} - ${formData.slot.end_time}` : "Not selected"}</span>
                  </div>
                </div>
              </div>

              {message && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{message}</div>}
              {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

              <div className="flex justify-between pt-4">
                <button type="button" onClick={handleBack} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Back
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Confirm Appointment"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

// Main Page Component
const BookAppointmentPage = () => {
  const { user, token } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
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
        const response = await fetch(`${API_URL}/api/hospitals`, {
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
        const response = await fetch(`${API_URL}/api/departments?hospital_id=${formData.hospital_id}`, {
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
        const response = await fetch(`${API_URL}/api/doctors?department_id=${formData.department_id}`, {
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
        const response = await fetch(`${API_URL}/api/doctor/${formData.doctor_id}/slots?date=${formData.date}`, {
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
      const response = await fetch(`${API_URL}/api/appointments`, {
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
        setCurrentStep(1);
      } else {
        setError(data.detail || "Failed to book appointment");
      }
    } catch (err) {
      setError("Error booking appointment: " + err.message);
    }
  };

  if (!user || !token) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Book a New Appointment</h1>
            <p className="text-gray-600">Follow the steps to schedule your appointment with our specialists</p>
          </motion.div>

          <AppointmentForm hospitals={hospitals} departments={departments} doctors={doctors} slots={slots} formData={formData} setFormData={setFormData} currentStep={currentStep} setCurrentStep={setCurrentStep} message={message} error={error} handleSubmit={handleSubmit} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookAppointmentPage;

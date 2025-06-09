import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";

const GeneralQueryPage = () => {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const renderDoctorList = (doctors) => {
    if (!Array.isArray(doctors) || doctors.length === 0) {
      return <p>No doctors found.</p>;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Doctors</h3>
        {doctors.map((doctor, index) => {
          // Filter out booked slots
          const availableSlots = doctor.availability.filter((slot) => !slot.is_booked);
          return (
            <div key={index} className="p-4 bg-bgLight rounded-lg shadow-soft border border-primary/10">
              <p>
                <strong>Name:</strong> {doctor.username}
              </p>
              <p>
                <strong>Specialty:</strong> {doctor.specialty}
              </p>
              <p>
                <strong>Title:</strong> {doctor.title}
              </p>
              <p>
                <strong>Email:</strong> {doctor.email}
              </p>
              <p>
                <strong>Phone:</strong> {doctor.phone || "N/A"}
              </p>
              <p>
                <strong>Bio:</strong> {doctor.bio || "No bio available"}
              </p>
              {availableSlots.length > 0 ? (
                <div>
                  <p>
                    <strong>Availability:</strong>
                  </p>
                  <ul className="list-disc pl-5">
                    {availableSlots.map((slot, slotIndex) => {
                      // Calculate appointment date
                      const today = new Date();
                      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                      const targetDayIndex = daysOfWeek.indexOf(slot.day_of_week);
                      const currentDayIndex = today.getDay();
                      let daysUntilTarget = targetDayIndex - currentDayIndex;
                      if (daysUntilTarget <= 0) daysUntilTarget += 7;
                      const appointmentDate = new Date(today);
                      appointmentDate.setDate(today.getDate() + daysUntilTarget);
                      const formattedDate = appointmentDate.toISOString().split("T")[0];

                      return (
                        <li key={slotIndex} className="flex items-center justify-between">
                          <span>
                            {slot.day_of_week}, {formattedDate}: {slot.start_time} - {slot.end_time}
                          </span>
                          <button
                            onClick={() =>
                              setBookingDetails({
                                doctorId: doctor.user_id,
                                doctorUsername: doctor.username,
                                departmentId: doctor.department_id,
                                dayOfWeek: slot.day_of_week,
                                startTime: slot.start_time,
                                endTime: slot.end_time,
                                appointmentDate: formattedDate,
                              }) || setIsBookingModalOpen(true)
                            }
                            className="ml-2 bg-primary text-white px-2 py-1 rounded hover:bg-accent text-sm"
                          >
                            Book
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p>No available slots.</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBookingConfirmation = (booking) => {
    return (
      <div className="p-4 bg-green-100 rounded-lg">
        <p className="font-semibold">Appointment Booked Successfully!</p>
        <p>
          <strong>Doctor:</strong> {booking.doctor_username}
        </p>
        <p>
          <strong>Department:</strong> {booking.department_name}
        </p>
        <p>
          <strong>Date:</strong> {booking.appointment_date}
        </p>
        <p>
          <strong>Time:</strong> {booking.start_time} - {booking.end_time}
        </p>
        <p>
          <strong>Status:</strong> {booking.status}
        </p>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const currentQuery = formData.get("query")?.toString().trim() || "";

    if (!currentQuery) {
      setError("Please enter a query.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        "http://localhost:8000/api/general-query",
        { query: currentQuery },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setChatHistory([
        ...chatHistory,
        {
          role: "user",
          content: currentQuery,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setQuery("");
    } catch (err) {
      let errorMessage = "Error processing query";
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setError(errorMessage);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!bookingDetails) return;

    setLoading(true);
    setError(null);

    try {
      const bookingQuery = `Book appointment with ${bookingDetails.doctorUsername} on ${bookingDetails.dayOfWeek}, ${bookingDetails.appointmentDate} from ${bookingDetails.startTime} to ${bookingDetails.endTime}`;

      const { data } = await axios.post(
        "http://localhost:8000/api/general-query",
        { query: bookingQuery },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setChatHistory([
        ...chatHistory,
        {
          role: "user",
          content: bookingQuery,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsBookingModalOpen(false);
      setBookingDetails(null);
    } catch (err) {
      let errorMessage = "Error booking appointment";
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setError(errorMessage);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    setQuery("");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-secondary font-inter">
      <NavBar />
      <div className="flex flex-1">
        <div className={`fixed inset-y-0 left-0 w-64 bg-primary text-white transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 mt-16 md:mt-0`}>
          <div className="p-6">
            <h1 className="text-2xl font-bold">HealthSync AI</h1>
          </div>
          <div className="p-6">
            <button onClick={handleClearHistory} className="w-full bg-accent text-text p-3 rounded-lg hover:bg-white hover:text-primary transition-colors shadow-soft">
              Clear Chat
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col md:ml-64">
          <button className="md:hidden p-4 bg-primary text-white" onClick={toggleSidebar}>
            {sidebarOpen ? "Close" : "Menu"}
          </button>
          <div className="flex-1 overflow-y-auto p-6 bg-bgLight">
            {chatHistory.length === 0 && !loading && (
              <div className="text-center text-text/60 mt-20">
                <p className="text-lg">Ask a general medical question to start the conversation!</p>
              </div>
            )}
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-6`}>
                <div className={`flex items-start space-x-3 max-w-2xl w-full ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-accent" : "bg-primary"} shadow-soft flex-shrink-0`}>
                    <span className={`font-bold text-lg ${msg.role === "user" ? "text-text" : "text-white"}`}>{msg.role === "user" ? "U" : "AI"}</span>
                  </div>
                  <motion.div className={`p-4 rounded-xl shadow-soft ${msg.role === "user" ? "bg-accent text-text" : "bg-secondary text-text"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {typeof msg.content === "string" ? <p>{msg.content}</p> : Array.isArray(msg.content) ? renderDoctorList(msg.content) : msg.content.id && msg.content.doctor_username ? renderBookingConfirmation(msg.content) : <p>Error: Invalid response format</p>}
                    <p className="text-xs opacity-60 mt-2">{msg.timestamp}</p>
                  </motion.div>
                </div>
              </div>
            ))}
            <AnimatePresence>
              {loading && (
                <motion.div className="flex justify-start mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center space-x-3 max-w-md">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary shadow-soft">
                      <span className="font-bold text-lg text-white">AI</span>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary shadow-soft flex items-center space-x-2">
                      <motion.div className="w-2 h-2 bg-text rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0 }} />
                      <motion.div className="w-2 h-2 bg-text rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} />
                      <motion.div className="w-2 h-2 bg-text rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.4 }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 bg-bgLight">
            <div className="ützen max-w-3xl mx-auto">
              <form ref={formRef} onSubmit={handleSubmit} className="flex items-center space-x-3 bg-bgLight p-3 rounded-full shadow-soft border border-primary/10">
                <input type="text" name="query" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a medical question..." className="flex-1 p-3 bg-transparent text-text placeholder-text/40 focus:outline-none" disabled={loading} />
                <button type="submit" disabled={loading || !query.trim()} className="p-3 bg-primary text-white rounded-full hover:bg-accent hover:text-text disabled:bg-gray-300 disabled:text-gray-500 transition-colors">
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
              {error && <p className="text-error text-sm mt-3 text-center">{error}</p>}
            </div>
          </div>
        </div>
      </div>

      {isBookingModalOpen && bookingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bgLight p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Appointment</h2>
            <p>
              <strong>Doctor:</strong> {bookingDetails.doctorUsername}
            </p>
            <p>
              <strong>Date:</strong> {bookingDetails.appointmentDate}
            </p>
            <p>
              <strong>Time:</strong> {bookingDetails.startTime} - {bookingDetails.endTime}
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setIsBookingModalOpen(false) || setBookingDetails(null)} className="px-4 py-2 bg-gray-300 text-text rounded hover:bg-gray-400">
                Cancel
              </button>
              <button onClick={handleBookingSubmit} className="px-4 py-2 bg-primary text-white rounded hover:bg-accent" disabled={loading}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralQueryPage;

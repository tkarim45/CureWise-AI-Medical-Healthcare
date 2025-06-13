import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { FaHospital, FaPhone, FaMapMarkerAlt, FaUserMd, FaClock, FaDirections, FaHeartbeat } from "react-icons/fa";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Custom emergency marker icons
const emergencyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const EmergencyPage = () => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Get user location and nearby hospitals
  const fetchEmergencyData = async () => {
    setLoading(true);
    setError("");

    try {
      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        const response = await axios.get("http://localhost:8000/api/emergency/hospitals", {
          params: { lat: latitude, lng: longitude },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setHospitals(response.data.hospitals);
        initializeMap(latitude, longitude, response.data.hospitals);
      } else {
        throw new Error("Geolocation is not supported by your browser.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Unable to fetch emergency data");
      console.error("Emergency data error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Leaflet map
  const initializeMap = (lat, lng, hospitals) => {
    if (mapContainerRef.current && !mapInitialized) {
      const map = L.map(mapContainerRef.current).setView([lat, lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add user marker
      L.marker([lat, lng], { icon: emergencyIcon }).addTo(map).bindPopup("<b>Your Location</b>").openPopup();

      // Add hospital markers
      hospitals.forEach((hospital) => {
        L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup(
            `
            <b>${hospital.name}</b><br>
            ${hospital.address}<br>
            <a href="https://www.openstreetmap.org/directions?from=&to=${hospital.lat},${hospital.lng}" 
               target="_blank" style="color: #3b82f6; text-decoration: underline;">
              Get Directions
            </a>
          `
          )
          .on("click", () => setSelectedHospital(hospital));
      });

      mapRef.current = map;
      setMapInitialized(true);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchEmergencyData();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Handle hospital selection
  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital);
    if (mapRef.current) {
      mapRef.current.setView([hospital.lat, hospital.lng], 15);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      <NavBar />

      <main className="flex-1 py-12 px-6 lg:px-12">
        {/* Emergency Alert Header */}
        <motion.section className="bg-white shadow-md rounded-2xl p-8 mb-12" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <FiAlertTriangle className="text-4xl text-red-600 mr-4" />
              <h1 className="text-3xl font-extrabold text-gray-900">Emergency Assistance</h1>
            </div>
            <button onClick={fetchEmergencyData} className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full font-semibold hover:opacity-90 shadow-md disabled:opacity-50" disabled={loading}>
              <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Location
            </button>
          </div>
        </motion.section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Status Messages */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-8 p-6 bg-blue-50 text-blue-700 rounded-2xl flex items-center shadow-sm">
                <div className="animate-pulse flex items-center">
                  <div className="h-5 w-5 bg-blue-200 rounded-full mr-3"></div>
                  <span className="text-base font-medium">Locating nearby hospitals...</span>
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-8 p-6 bg-red-50 text-red-700 rounded-2xl flex items-center shadow-sm">
                <FiAlertTriangle className="h-5 w-5 mr-3" />
                <span className="text-base font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map and Hospital List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Map Section */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div ref={mapContainerRef} className="w-full h-[400px] md:h-[600px]" />
            </motion.div>

            {/* Hospital List */}
            <div className="space-y-6">
              <motion.h2 className="text-2xl font-bold text-gray-900 flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <FaHospital className="text-3xl text-blue-600 mr-3" />
                Nearby Hospitals
              </motion.h2>

              {hospitals.length > 0 ? (
                <motion.ul className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  {hospitals.map((hospital, index) => (
                    <motion.li key={index} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className={`bg-white rounded-xl shadow-md p-6 border-2 cursor-pointer transition-all ${selectedHospital?.id === hospital.id ? "border-blue-500" : "border-gray-100 hover:border-blue-300"}`} onClick={() => handleHospitalSelect(hospital)}>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center mb-3">
                        <FaHospital className="text-2xl text-blue-600 mr-2" />
                        {hospital.name}
                      </h3>
                      <div className="space-y-3 text-sm text-gray-600">
                        <p className="flex items-start">
                          <FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0 text-blue-600" />
                          {hospital.address}
                        </p>
                        <p className="flex items-center">
                          <FaUserMd className="mr-2 text-blue-600" />
                          <span className="font-medium">{hospital.doctorAvailability ? "Doctors Available" : "No Doctors Available"}</span>
                        </p>
                        <p className="flex items-center">
                          <FaClock className="mr-2 text-blue-600" />
                          ETA: {hospital.distance?.toFixed(1)} km (~{Math.round(hospital.distance * 12)} min)
                        </p>
                      </div>
                      <div className="mt-4 flex justify-between gap-3">
                        <a href={`tel:${hospital.phone || "911"}`} className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all">
                          <FaPhone className="mr-2" /> Call
                        </a>
                        <a href={`https://www.openstreetmap.org/directions?from=&to=${hospital.lat},${hospital.lng}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center px-4 py-2 bg-teal-500 text-white rounded-full font-semibold hover:bg-teal-600 transition-all">
                          <FaDirections className="mr-2" /> Directions
                        </a>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-md p-8 text-center">
                  <FaHeartbeat className="text-5xl text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-base font-medium">No hospitals found in your area</p>
                  <button onClick={fetchEmergencyData} className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full font-semibold hover:opacity-90">
                    Try Again
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Emergency Actions */}
          <motion.div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiAlertTriangle className="text-3xl text-blue-600 mr-3" />
                Emergency Contacts
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="tel:911" className="flex items-center text-blue-600 hover:underline">
                    <FaPhone className="mr-2" /> Emergency: 911
                  </a>
                </li>
                <li>
                  <a href="tel:112" className="flex items-center text-blue-600 hover:underline">
                    <FaPhone className="mr-2" /> International: 112
                  </a>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FaUserMd className="text-3xl text-blue-600 mr-3" />
                Virtual Assistance
              </h3>
              <p className="text-gray-600 mb-4">Connect with a doctor immediately</p>
              <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full font-semibold hover:opacity-90">Start Video Consultation</button>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FaHeartbeat className="text-3xl text-blue-600 mr-3" />
                Health Records
              </h3>
              <p className="text-gray-600 mb-4">Make your medical records available to responders</p>
              <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full font-semibold hover:opacity-90">Share Medical Info</button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmergencyPage;

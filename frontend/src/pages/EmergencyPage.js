import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { FaHospital, FaPhone, FaMapMarkerAlt, FaUserMd, FaClock, FaDirections, FaHeartbeat, FaAmbulance } from "react-icons/fa";
import { FiAlertTriangle, FiRefreshCw, FiAlertCircle, FiPlusCircle } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Custom marker icons
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
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (lat, lng, hospitals) => {
    if (mapContainerRef.current && !mapInitialized) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
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
            <div class="font-sans">
              <h3 class="font-bold text-blue-600">${hospital.name}</h3>
              <p class="text-sm text-gray-700 my-1">${hospital.address}</p>
              <a href="https://www.openstreetmap.org/directions?from=&to=${hospital.lat},${hospital.lng}" 
                 target="_blank" class="text-blue-500 text-sm font-medium hover:underline">
                Get Directions
              </a>
            </div>
          `
          )
          .on("click", () => handleHospitalSelect(hospital));
      });

      mapRef.current = map;
      setMapInitialized(true);
    }
  };

  useEffect(() => {
    fetchEmergencyData();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital);
    if (mapRef.current) {
      mapRef.current.setView([hospital.lat, hospital.lng], 15);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Emergency Header */}
        <motion.section className="bg-gradient-to-r bg-primary text-white rounded-2xl shadow-lg p-6 mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <FaAmbulance className="text-3xl mr-4" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Emergency Assistance</h1>
                <p className="text-red-100">Find nearby hospitals and emergency contacts</p>
              </div>
            </div>
            <button onClick={fetchEmergencyData} className="flex items-center px-5 py-3 bg-primary text-white rounded-full font-semibold hover:bg-gray-100 transition-all shadow-md" disabled={loading}>
              <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Location
            </button>
          </div>
        </motion.section>

        {/* Status Messages */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-8 flex items-center">
              <div className="animate-pulse flex items-center">
                <div className="h-4 w-4 bg-blue-400 rounded-full mr-3"></div>
                <span>Locating nearby hospitals...</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 flex items-start">
              <FiAlertCircle className="mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Emergency service unavailable</p>
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map and Hospital List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Map Section */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
            <div ref={mapContainerRef} className="w-full h-80 sm:h-96 md:h-[500px]" />
          </motion.div>

          {/* Hospital List */}
          <div className="space-y-4">
            <motion.h2 className="text-xl font-bold text-gray-800 flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <FaHospital className="text-blue-600 mr-3" />
              Nearby Hospitals
            </motion.h2>

            {hospitals.length > 0 ? (
              <motion.ul className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                {hospitals.map((hospital, index) => (
                  <motion.li key={index} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <div className={`bg-white p-5 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${selectedHospital?.id === hospital.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-blue-300"}`} onClick={() => handleHospitalSelect(hospital)}>
                      <h3 className="font-bold text-gray-900 flex items-center">
                        <FaHospital className={`mr-3 ${selectedHospital?.id === hospital.id ? "text-blue-600" : "text-gray-500"}`} />
                        {hospital.name}
                      </h3>

                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <p className="flex items-start">
                          <FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0 text-gray-500" />
                          {hospital.address}
                        </p>

                        <p className="flex items-center">
                          <FaUserMd className="mr-2 text-gray-500" />
                          <span className={`font-medium ${hospital.doctorAvailability ? "text-green-600" : "text-red-600"}`}>{hospital.doctorAvailability ? "Doctors available" : "No doctors available"}</span>
                        </p>

                        <p className="flex items-center">
                          <FaClock className="mr-2 text-gray-500" />
                          <span>
                            ETA: {hospital.distance?.toFixed(1)} km (~{Math.round(hospital.distance * 12)} min)
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 flex space-x-3">
                        <a href={`tel:${hospital.phone || "911"}`} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          <FaPhone className="mr-2" /> Call
                        </a>
                        <a href={`https://www.openstreetmap.org/directions?from=&to=${hospital.lat},${hospital.lng}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                          <FaDirections className="mr-2" /> Directions
                        </a>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                <FaHeartbeat className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No hospitals found in your area</p>
                <button onClick={fetchEmergencyData} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  Try Again
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Emergency Actions */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FiPlusCircle className="text-blue-600 mr-3" />
            Emergency Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Emergency Contacts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <FiAlertTriangle className="text-red-500 mr-3" />
                Emergency Contacts
              </h3>
              <ul className="space-y-3">
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
                <li>
                  <a href="tel:107" className="flex items-center text-blue-600 hover:underline">
                    <FaPhone className="mr-2" /> Ambulance: 107
                  </a>
                </li>
              </ul>
            </div>

            {/* Virtual Assistance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <FaUserMd className="text-blue-500 mr-3" />
                Virtual Doctor
              </h3>
              <p className="text-gray-600 mb-4">Connect with a healthcare professional immediately via video call</p>
              <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:opacity-90">Start Consultation</button>
            </div>

            {/* Medical Records */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <FaHeartbeat className="text-blue-500 mr-3" />
                Share Medical Info
              </h3>
              <p className="text-gray-600 mb-4">Make your medical records available to emergency responders</p>
              <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:opacity-90">Share Records</button>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default EmergencyPage;

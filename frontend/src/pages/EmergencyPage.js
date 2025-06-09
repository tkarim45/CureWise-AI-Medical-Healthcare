import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaHeart, FaAmbulance } from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const containerStyle = {
  width: "100%",
  height: "400px",
};

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

const EmergencyPage = () => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          try {
            const response = await axios.get("http://localhost:8000/api/emergency/hospitals", {
              params: { lat: latitude, lng: longitude },
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setHospitals(response.data.hospitals);

            // Initialize Leaflet map
            if (!mapRef.current) {
              const map = L.map("map").setView([latitude, longitude], 12);
              L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              }).addTo(map);
              L.marker([latitude, longitude]).addTo(map).bindPopup("You").openPopup();
              response.data.hospitals.forEach((hospital) => L.marker([hospital.lat, hospital.lng]).addTo(map).bindPopup(hospital.name));
              mapRef.current = map;
            }
          } catch (err) {
            setError("Failed to fetch hospitals: " + (err.response?.data?.detail || err.message));
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError("Unable to get your location. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <FaAmbulance className="text-teal-500" />
            <span>Emergency Navigation</span>
          </motion.h1>

          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading && <p className="text-gray-600 mb-4">Locating nearby hospitals...</p>}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mb-8">
            <div id="map" style={containerStyle}></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nearby Hospitals</h2>
            {hospitals.length > 0 ? (
              <ul className="space-y-4">
                {hospitals.map((hospital, index) => (
                  <li key={index} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:border-teal-500">
                    <h3 className="text-lg font-semibold text-gray-800">{hospital.name}</h3>
                    <p className="text-gray-600">{hospital.address}</p>
                    <p className="text-gray-600">
                      <strong>Doctor Availability:</strong> {hospital.doctorAvailability ? "Yes" : "No"}
                    </p>
                    <a href={`https://www.openstreetmap.org/directions?from=&to=${hospital.lat},${hospital.lng}`} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline mt-2 inline-block">
                      Get Directions
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No hospitals found nearby.</p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmergencyPage;

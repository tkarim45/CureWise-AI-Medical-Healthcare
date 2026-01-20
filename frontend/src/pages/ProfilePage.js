import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";

const API_URL = process.env.REACT_APP_API_URL || "";

const ProfilePage = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    profile_picture: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        setError("Failed to load profile");
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await axios.put(`${API_URL}/api/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.h1 className="text-3xl font-bold text-gray-800 mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Edit Profile
          </motion.h1>
          <motion.div className="bg-white rounded-xl shadow-lg p-6" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
            {message && <div className="text-green-600 mb-2">{message}</div>}
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">First Name</label>
                <input name="first_name" value={profile.first_name || ""} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Last Name</label>
                <input name="last_name" value={profile.last_name || ""} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Phone</label>
                <input name="phone" value={profile.phone || ""} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Profile Picture URL</label>
                <input name="profile_picture" value={profile.profile_picture || ""} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Date of Birth</label>
                <input type="date" name="date_of_birth" value={profile.date_of_birth || ""} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Gender</label>
                <select name="gender" value={profile.gender || ""} onChange={handleChange} className="w-full border rounded p-2">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Address</label>
                <textarea name="address" value={profile.address || ""} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Save
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

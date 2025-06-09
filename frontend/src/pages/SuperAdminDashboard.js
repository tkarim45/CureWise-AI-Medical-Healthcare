import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaHospital, FaUserMd, FaCalendar, FaChevronRight, FaSearch, FaFilter, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { RiDashboardLine, RiShieldUserFill } from "react-icons/ri";
import { HiOutlineDocumentReport } from "react-icons/hi";
import React from "react";

// Helper for API URL
const API_URL = process.env.REACT_APP_API_URL || "";

const SuperAdminDashboard = () => {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [hospitals, setHospitals] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    phone: "",
    email: "",
    website: "",
    established_year: "",
    type: "",
    bed_count: "",
  });
  const [newAdmin, setNewAdmin] = useState({ username: "", email: "", password: "", hospital_id: "" });
  const [formError, setFormError] = useState("");
  const [editHospital, setEditHospital] = useState(null);
  const [showEditHospitalModal, setShowEditHospitalModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editAdminPasswordVisible, setEditAdminPasswordVisible] = useState(false);

  // Dashboard cards data
  const dashboardCards = [
    {
      id: "hospitals",
      title: "Hospitals",
      icon: <FaHospital className="text-2xl text-blue-500" />,
      count: hospitals.length,
      bgColor: "bg-blue-50",
      action: () => setActiveSection("hospitals"),
    },
    {
      id: "admins",
      title: "Admins",
      icon: <RiShieldUserFill className="text-2xl text-purple-500" />,
      count: admins.length,
      bgColor: "bg-purple-50",
      action: () => setActiveSection("admins"),
    },
    {
      id: "doctors",
      title: "Doctors",
      icon: <FaUserMd className="text-2xl text-green-500" />,
      count: doctors.length,
      bgColor: "bg-green-50",
      action: () => setActiveSection("doctors"),
    },
    {
      id: "appointments",
      title: "Appointments",
      icon: <FaCalendar className="text-2xl text-orange-500" />,
      count: appointments.length,
      bgColor: "bg-orange-50",
      action: () => setActiveSection("appointments"),
    },
  ];

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospitalsRes, adminsRes, appointmentsRes, doctorsRes] = await Promise.all([axios.get(`${API_URL}/api/hospitals`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API_URL}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API_URL}/api/doctors`, { headers: { Authorization: `Bearer ${token}` } })]);
        setHospitals(hospitalsRes.data);
        setAdmins(adminsRes.data);
        setAppointments(appointmentsRes.data);
        setDoctors(doctorsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Filter data based on search term
  const filteredHospitals = hospitals.filter((hospital) => hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) || hospital.address.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredAdmins = admins.filter((admin) => admin.username.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email.toLowerCase().includes(searchTerm.toLowerCase()) || (admin.hospital_name && admin.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())));

  const filteredDoctors = doctors.filter((doctor) => doctor.username.toLowerCase().includes(searchTerm.toLowerCase()) || doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) || doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredAppointments = appointments.filter((appt) => appt.username.toLowerCase().includes(searchTerm.toLowerCase()) || appt.doctor_username.toLowerCase().includes(searchTerm.toLowerCase()) || appt.department_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pagination logic
  const paginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = (data) => Math.ceil(data.length / itemsPerPage);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
  };

  // Add Hospital Handler
  const handleAddHospital = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = {
        name: newHospital.name,
        address: newHospital.address,
        city: newHospital.city,
        state: newHospital.state,
        country: newHospital.country,
        postal_code: newHospital.postal_code || null,
        phone: newHospital.phone || null,
        email: newHospital.email || null,
        website: newHospital.website || null,
        established_year: newHospital.established_year ? parseInt(newHospital.established_year) : null,
        type: newHospital.type || null,
        bed_count: newHospital.bed_count ? parseInt(newHospital.bed_count) : null,
      };
      await axios.post(`${API_URL}/api/hospitals`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddHospitalModal(false);
      setNewHospital({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        phone: "",
        email: "",
        website: "",
        established_year: "",
        type: "",
        bed_count: "",
      });
      // Refetch hospitals
      const hospitalsRes = await axios.get(`${API_URL}/api/hospitals`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals(hospitalsRes.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add hospital");
    }
  };

  // Add Admin Handler
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      console.log("Sending admin data:", newAdmin);
      await axios.post(`${API_URL}/api/admins`, newAdmin, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddAdminModal(false);
      setNewAdmin({ username: "", email: "", password: "", hospital_id: "" });
      // Refresh admins
      const adminsRes = await axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(adminsRes.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setFormError(detail || err.response?.data || "Failed to add admin");
    }
  };

  // Edit Hospital Handler
  const handleEditHospitalClick = (hospital) => {
    setEditHospital({ ...hospital });
    setShowEditHospitalModal(true);
    setFormError("");
  };

  const handleEditHospitalChange = (e) => {
    const { name, value } = e.target;
    setEditHospital((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditHospitalSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = {
        name: editHospital.name,
        address: editHospital.address,
        city: editHospital.city,
        state: editHospital.state,
        country: editHospital.country,
        postal_code: editHospital.postal_code || null,
        phone: editHospital.phone || null,
        email: editHospital.email || null,
        website: editHospital.website || null,
        established_year: editHospital.established_year ? parseInt(editHospital.established_year) : null,
        type: editHospital.type || null,
        bed_count: editHospital.bed_count ? parseInt(editHospital.bed_count) : null,
      };
      await axios.put(`${API_URL}/api/hospitals/${editHospital.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEditHospitalModal(false);
      setEditHospital(null);
      // Refetch hospitals
      const hospitalsRes = await axios.get(`${API_URL}/api/hospitals`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals(hospitalsRes.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update hospital");
    }
  };

  // Edit Admin Handler
  const handleEditAdmin = async (adminId, updatedAdmin) => {
    setFormError("");
    try {
      // Only include password in the payload if it's non-empty
      const payload = {
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        hospital_id: updatedAdmin.hospital_id || null,
      };
      if (updatedAdmin.password) {
        payload.password = updatedAdmin.password;
      }
      await axios.put(`${API_URL}/api/admins/${adminId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh admins
      const adminsRes = await axios.get(`${API_URL}/api/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(adminsRes.data);
      setShowEditAdminModal(false);
      setEditAdmin(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setFormError(detail || err.response?.data || "Failed to update admin");
    }
  };

  // Delete handlers
  const handleDeleteHospital = async (hospitalId) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return;
    try {
      await axios.delete(`${API_URL}/api/hospitals/${hospitalId}`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete hospital");
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await axios.delete(`${API_URL}/api/admins/${adminId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins((prev) => prev.filter((a) => a.id !== adminId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete admin");
    }
  };

  // Reassign or Unassign Admin
  const handleReassignAdmin = async (adminId, hospitalId) => {
    if (!window.confirm(hospitalId ? `Assign admin to hospital ${hospitals.find((h) => h.id === hospitalId)?.name}?` : "Unassign admin from hospital?")) return;
    try {
      if (hospitalId) {
        await axios.post(`${API_URL}/api/hospitals/${hospitalId}/assign-admin`, { user_id: adminId }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.delete(`${API_URL}/api/admins/${adminId}/unassign`, { headers: { Authorization: `Bearer ${token}` } });
      }
      const adminsRes = await axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(adminsRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update admin assignment");
    }
  };

  // Delete Doctor Handler
  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await axios.delete(`${API_URL}/api/doctors/${doctorId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDoctors((prev) => prev.filter((d) => d.user_id !== doctorId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete doctor");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Super Admin Panel</h2>
            <div className="space-y-2">
              <button onClick={() => setActiveSection("dashboard")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <RiDashboardLine className="mr-3" />
                  <span>Dashboard</span>
                </div>
                <FaChevronRight className="text-xs" />
              </button>

              <button onClick={() => setActiveSection("hospitals")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "hospitals" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaHospital className="mr-3" />
                  <span>Hospitals</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{hospitals.length}</span>
              </button>

              <button onClick={() => setActiveSection("admins")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "admins" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <RiShieldUserFill className="mr-3" />
                  <span>Admins</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{admins.length}</span>
              </button>

              <button onClick={() => setActiveSection("doctors")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "doctors" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaUserMd className="mr-3" />
                  <span>Doctors</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{doctors.length}</span>
              </button>

              <button onClick={() => setActiveSection("appointments")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "appointments" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaCalendar className="mr-3" />
                  <span>Appointments</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{appointments.length}</span>
              </button>

              <button onClick={() => setActiveSection("reports")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "reports" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <HiOutlineDocumentReport className="mr-3" />
                  <span>Reports</span>
                </div>
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl font-bold text-gray-800">{activeSection === "dashboard" ? "Dashboard Overview" : activeSection === "hospitals" ? "Hospital Management" : activeSection === "admins" ? "Admin Management" : activeSection === "doctors" ? "Doctor Management" : activeSection === "appointments" ? "Appointments" : "Reports"}</h1>
            <p className="text-gray-600">{activeSection === "dashboard" ? "Welcome back! Here's what's happening with your system." : "Manage and monitor all aspects of your healthcare system"}</p>
          </motion.div>

          {/* Dashboard Overview */}
          {activeSection === "dashboard" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardCards.map((card, index) => (
                  <motion.div key={card.id} variants={itemVariants} whileHover="hover" onClick={card.action} className={`${card.bgColor} p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-200`} {...cardVariants}>
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

              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FaUserMd className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">New doctor registered</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Hospitals Management */}
          {activeSection === "hospitals" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search hospitals..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => setShowAddHospitalModal(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FaPlus className="mr-2" />
                    Add Hospital
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          City
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Postal Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredHospitals).map((hospital) => (
                        <tr key={hospital.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <FaHospital />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{hospital.address}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{hospital.city}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{hospital.state}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{hospital.country}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{hospital.postal_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{hospital.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3" onClick={() => handleEditHospitalClick(hospital)}>
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteHospital(hospital.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredHospitals.length)}</span> of <span className="font-medium">{filteredHospitals.length}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Previous
                    </button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredHospitals)))} disabled={currentPage === totalPages(filteredHospitals)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Admins Management */}
          {activeSection === "admins" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search admins..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      <FaFilter className="mr-2" />
                      Filter
                    </button>
                    <button onClick={() => setShowAddAdminModal(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <FaPlus className="mr-2" />
                      Add Admin
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hospital
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredAdmins).map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                <RiShieldUserFill />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{admin.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{admin.hospital_name || "Not Assigned"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={() => {
                                setEditAdmin({ ...admin, password: "" }); // Initialize password as empty
                                setShowEditAdminModal(true);
                                setFormError("");
                              }}
                            >
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteAdmin(admin.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAdmins.length)}</span> of <span className="font-medium">{filteredAdmins.length}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Previous
                    </button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredAdmins)))} disabled={currentPage === totalPages(filteredAdmins)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Doctors Management */}
          {activeSection === "doctors" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search doctors..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      <FaFilter className="mr-2" />
                      Filter
                    </button>
                    <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <FaPlus className="mr-2" />
                      Add Doctor
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specialty
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hospital
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredDoctors).map((doctor) => (
                        <tr key={doctor.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <FaUserMd />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{doctor.username}</div>
                                <div className="text-sm text-gray-500">{doctor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doctor.specialty}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{doctor.department_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{doctor.hospital_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteDoctor(doctor.user_id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredDoctors.length)}</span> of <span className="font-medium">{filteredDoctors.length}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Previous
                    </button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredDoctors)))} disabled={currentPage === totalPages(filteredDoctors)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Appointments Management */}
          {activeSection === "appointments" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch />
                    </div>
                    <input type="text" placeholder="Search appointments..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                      <FaFilter className="mr-2" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600">
                          Doctor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600">
                          Doctor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredAppointments).map((appt) => (
                        <tr key={appt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{appt.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appt.doctor_username}</div>
                            <div className="text-sm text-gray-500">{appt.department_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appt.appointment_date}</div>
                            <div className="text-sm text-gray-500">
                              {appt.start_time} - {appt.end_time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${appt.status === "completed" ? "bg-green-100 text-green-800" : appt.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>{appt.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAppointments.length)}</span> of <span className="font-medium">{filteredAppointments.length}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Previous
                    </button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredAppointments)))} disabled={currentPage === totalPages(filteredAppointments)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Add Hospital Modal */}
          {showAddHospitalModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Hospital</h2>
                {formError &&
                  (Array.isArray(formError) ? (
                    <ul className="text-red-500 mb-2">
                      {formError.map((err, idx) => (
                        <li key={idx}>{err.msg || JSON.stringify(err)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-red-500 mb-2">{formError}</div>
                  ))}
                <form onSubmit={handleAddHospital} className="space-y-4">
                  <input type="text" className="w-full border rounded p-2" placeholder="Name" value={newHospital.name} onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })} required />
                  <input type="text" className="w-full border rounded p-2" placeholder="Address" value={newHospital.address} onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })} required />
                  <input type="text" className="w-full border rounded p-2" placeholder="City" value={newHospital.city} onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })} required />
                  <input type="text" className="w-full border rounded p-2" placeholder="State" value={newHospital.state} onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })} required />
                  <input type="text" className="w-full border rounded p-2" placeholder="Country" value={newHospital.country} onChange={(e) => setNewHospital({ ...newHospital, country: e.target.value })} required />
                  <input type="text" className="w-full border rounded p-2" placeholder="Postal Code" value={newHospital.postal_code} onChange={(e) => setNewHospital({ ...newHospital, postal_code: e.target.value })} />
                  <input type="text" className="w-full border rounded p-2" placeholder="Phone" value={newHospital.phone} onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })} />
                  <input type="email" className="w-full border rounded p-2" placeholder="Email" value={newHospital.email} onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })} />
                  <input type="text" className="w-full border rounded p-2" placeholder="Website" value={newHospital.website} onChange={(e) => setNewHospital({ ...newHospital, website: e.target.value })} />
                  <input type="text" className="w-full border rounded p-2" placeholder="Established Year" value={newHospital.established_year} onChange={(e) => setNewHospital({ ...newHospital, established_year: e.target.value })} />
                  <input type="text" className="w-full border rounded p-2" placeholder="Type" value={newHospital.type} onChange={(e) => setNewHospital({ ...newHospital, type: e.target.value })} />
                  <input type="text" className="w-full border rounded p-2" placeholder="Bed Count" value={newHospital.bed_count} onChange={(e) => setNewHospital({ ...newHospital, bed_count: e.target.value })} />
                  <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowAddHospitalModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Admin Modal */}
          {showAddAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Admin</h2>
                {formError && <div className="text-red-500 mb-2">{typeof formError === "object" ? formError.msg || JSON.stringify(formError) : formError}</div>}
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <input type="text" className="w-full border rounded p-2" placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} required />
                  <input type="email" className="w-full border rounded p-2" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                  <input type="password" className="w-full border rounded p-2" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
                  <select className="w-full border rounded p-2" value={newAdmin.hospital_id} onChange={(e) => setNewAdmin({ ...newAdmin, hospital_id: e.target.value })}>
                    <option value="">Select Hospital (Optional)</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowAddAdminModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Hospital Modal */}
          {showEditHospitalModal && editHospital && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Hospital</h2>
                {formError &&
                  (Array.isArray(formError) ? (
                    <ul className="text-red-500 mb-2">
                      {formError.map((err, idx) => (
                        <li key={idx}>{err.msg || JSON.stringify(err)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-red-500 mb-2">{formError}</div>
                  ))}
                <form onSubmit={handleEditHospitalSubmit} className="space-y-4">
                  <input type="text" name="name" className="w-full border rounded p-2" placeholder="Name" value={editHospital.name} onChange={handleEditHospitalChange} required />
                  <input type="text" name="address" className="w-full border rounded p-2" placeholder="Address" value={editHospital.address} onChange={handleEditHospitalChange} required />
                  <input type="text" name="city" className="w-full border rounded p-2" placeholder="City" value={editHospital.city} onChange={handleEditHospitalChange} required />
                  <input type="text" name="state" className="w-full border rounded p-2" placeholder="State" value={editHospital.state} onChange={handleEditHospitalChange} required />
                  <input type="text" name="country" className="w-full border rounded p-2" placeholder="Country" value={editHospital.country} onChange={handleEditHospitalChange} required />
                  <input type="text" name="postal_code" className="w-full border rounded p-2" placeholder="Postal Code" value={editHospital.postal_code || ""} onChange={handleEditHospitalChange} />
                  <input type="text" name="phone" className="w-full border rounded p-2" placeholder="Phone" value={editHospital.phone || ""} onChange={handleEditHospitalChange} />
                  <input type="email" name="email" className="w-full border rounded p-2" placeholder="Email" value={editHospital.email || ""} onChange={handleEditHospitalChange} />
                  <input type="text" name="website" className="w-full border rounded p-2" placeholder="Website" value={editHospital.website || ""} onChange={handleEditHospitalChange} />
                  <input type="text" name="established_year" className="w-full border rounded p-2" placeholder="Established Year" value={editHospital.established_year || ""} onChange={handleEditHospitalChange} />
                  <input type="text" name="type" className="w-full border rounded p-2" placeholder="Type" value={editHospital.type || ""} onChange={handleEditHospitalChange} />
                  <input type="text" name="bed_count" className="w-full border rounded p-2" placeholder="Bed Count" value={editHospital.bed_count || ""} onChange={handleEditHospitalChange} />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 rounded"
                      onClick={() => {
                        setShowEditHospitalModal(false);
                        setEditHospital(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Admin Modal */}
          {showEditAdminModal && editAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Admin</h2>
                {formError &&
                  (Array.isArray(formError) ? (
                    <ul className="text-red-500 mb-2">
                      {formError.map((err, idx) => (
                        <li key={idx}>{err.msg || JSON.stringify(err)}</li>
                      ))}
                    </ul>
                  ) : typeof formError === "object" ? (
                    <div className="text-red-500 mb-2">{formError.msg || JSON.stringify(formError)}</div>
                  ) : (
                    <div className="text-red-500 mb-2">{formError}</div>
                  ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditAdmin(editAdmin.id, editAdmin);
                  }}
                  className="space-y-4"
                >
                  <input type="text" className="w-full border rounded p-2" placeholder="Username" value={editAdmin.username} onChange={(e) => setEditAdmin({ ...editAdmin, username: e.target.value })} required />
                  <input type="email" className="w-full border rounded p-2" placeholder="Email address" value={editAdmin.email} onChange={(e) => setEditAdmin({ ...editAdmin, email: e.target.value })} required />
                  <div className="relative">
                    <input type={editAdminPasswordVisible ? "text" : "password"} className="w-full px-4 py-2 border rounded" placeholder="New password (optional)" value={editAdmin.password || ""} onChange={(e) => setEditAdmin({ ...editAdmin, password: e.target.value })} />
                    <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" onClick={() => setEditAdminPasswordVisible(!editAdminPasswordVisible)} aria-label={editAdminPasswordVisible ? "Hide password" : "Show password"}>
                      {editAdminPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <select className="w-full px-4 py-2 border rounded" value={editAdmin.hospital_id || ""} onChange={(e) => setEditAdmin({ ...editAdmin, hospital_id: e.target.value })} required>
                    <option value="">Unassigned</option>
                    {hospitals.map((h) => {
                      const isAssigned = admins.some((a) => a.hospital_id === h.id && a.id !== editAdmin.id);
                      return (
                        <option key={h.id} value={h.id} disabled={isAssigned}>
                          {h.name} {isAssigned ? "(Assigned)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 rounded"
                      onClick={() => {
                        setShowEditAdminModal(false);
                        setEditAdmin(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

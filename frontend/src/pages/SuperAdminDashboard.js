import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaChevronRight, FaHospital, FaPlus, FaSearch, FaUserMd, FaArrowLeft, FaEye, FaEyeSlash, FaBuilding, FaCalendar } from "react-icons/fa";
import { RiDashboardLine, RiShieldUserFill } from "react-icons/ri";

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

  // New state for hierarchical navigation
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Modal states
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

  // New state for modals and forms
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: "" });
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ username: "", email: "", password: "", specialty: "" });
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);

  // Dashboard cards data
  const dashboardCards = [
    {
      id: "hospitals",
      title: "Hospitals",
      icon: <FaHospital className="text-2xl text-blue-500" />,
      count: hospitals.length,
      bgColor: "bg-blue-50",
      action: () => {
        setActiveSection("hospitals");
        setSelectedHospital(null);
        setSelectedDepartment(null);
        setSelectedDoctor(null);
      },
    },
    { id: "admins", title: "Admins", icon: <RiShieldUserFill className="text-2xl text-purple-500" />, count: admins.length, bgColor: "bg-purple-50", action: () => setActiveSection("admins") },
    {
      id: "doctors",
      title: "Doctors",
      icon: <FaUserMd className="text-2xl text-green-500" />,
      count: doctors.length,
      bgColor: "bg-green-50",
      action: () => {
        setActiveSection("hospitals");
        setSelectedHospital(null);
        setSelectedDepartment(null);
        setSelectedDoctor(null);
      },
    },
    {
      id: "appointments",
      title: "Appointments",
      icon: <FaCalendar className="text-2xl text-orange-500" />,
      count: appointments.length,
      bgColor: "bg-orange-50",
      action: () => {
        setActiveSection("hospitals");
        setSelectedHospital(null);
        setSelectedDepartment(null);
        setSelectedDoctor(null);
      },
    },
  ];

  // Fetch all data (hospitals, admins, doctors, appointments, departments)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospitalsRes, adminsRes, appointmentsRes, doctorsRes, departmentsRes] = await Promise.all([
          axios.get(`${API_URL}/api/hospitals`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/doctors`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setHospitals(hospitalsRes.data);
        setAdmins(adminsRes.data);
        setAppointments(appointmentsRes.data);
        setDoctors(doctorsRes.data);
        setDepartments(departmentsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Fetch departments when a hospital is selected
  useEffect(() => {
    if (selectedHospital) {
      const fetchDepartments = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/hospitals/${selectedHospital.id}/departments`, { headers: { Authorization: `Bearer ${token}` } });
          setDepartments(res.data);
        } catch (error) {
          console.error("Error fetching departments:", error);
        }
      };
      fetchDepartments();
    } else {
      setDepartments([]);
    }
  }, [selectedHospital, token]);

  // Hierarchical filtering
  const hospitalDepartments = selectedHospital ? departments.filter((dep) => dep.hospital_id === selectedHospital.id) : [];
  const departmentDoctors = selectedDepartment ? doctors.filter((doc) => doc.department_id === selectedDepartment.id) : [];
  const doctorAppointments = selectedDoctor ? appointments.filter((appt) => appt.doctor_id === selectedDoctor.id) : [];

  // Filter data based on search term and current level
  const filteredHospitals = hospitals.filter((hospital) => hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) || hospital.address.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDepartments = departments.filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDoctors = doctors.filter((doctor) => (!selectedHospital || doctor.hospital_id === selectedHospital.id) && (!selectedDepartment || doctor.department_id === selectedDepartment.id) && (doctor.username.toLowerCase().includes(searchTerm.toLowerCase()) || doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())));
  const filteredAppointments = appointments.filter((appt) => (!selectedHospital || appt.hospital_id === selectedHospital.id) && (!selectedDepartment || appt.department_id === selectedDepartment.id) && (!selectedDoctor || appt.doctor_id === selectedDoctor.user_id) && (appt.username.toLowerCase().includes(searchTerm.toLowerCase()) || appt.doctor_username.toLowerCase().includes(searchTerm.toLowerCase())));
  const filteredAdmins = admins.filter((admin) => admin.username.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email.toLowerCase().includes(searchTerm.toLowerCase()) || (admin.hospital_name && admin.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())));

  // Pagination logic
  const paginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };
  const totalPages = (data) => Math.ceil(data.length / itemsPerPage);

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
  const cardVariants = { hover: { y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", transition: { duration: 0.3 } } };

  // Handlers (unchanged from original, except for context adjustments)
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
      await axios.post(`${API_URL}/api/hospitals`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddHospitalModal(false);
      setNewHospital({ name: "", address: "", city: "", state: "", country: "", postal_code: "", phone: "", email: "", website: "", established_year: "", type: "", bed_count: "" });
      const hospitalsRes = await axios.get(`${API_URL}/api/hospitals`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals(hospitalsRes.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add hospital");
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.post(`${API_URL}/api/admins`, newAdmin, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddAdminModal(false);
      setNewAdmin({ username: "", email: "", password: "", hospital_id: "" });
      const adminsRes = await axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(adminsRes.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || err.response?.data || "Failed to add admin");
    }
  };

  // New handlers for adding department and doctor
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.post(`${API_URL}/api/hospitals/${selectedHospital.id}/departments`, newDepartment, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddDepartmentModal(false);
      setNewDepartment({ name: "" });
      // Refetch departments for this hospital and replace state directly
      const res = await axios.get(`${API_URL}/api/hospitals/${selectedHospital.id}/departments`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(res.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add department");
    }
  };

  // Handler to add doctor (modal)
  const handleAddDoctorModal = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = {
        ...newDoctor,
        department_id: selectedDepartment.id,
        hospital_id: selectedHospital.id,
      };
      await axios.post(`${API_URL}/api/doctors`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddDoctorModal(false);
      setNewDoctor({ username: "", email: "", password: "", specialty: "" });
      // Refetch doctors for this department
      const res = await axios.get(`${API_URL}/api/doctors`, { headers: { Authorization: `Bearer ${token}` } });
      setDoctors(res.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add doctor");
    }
  };

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
      await axios.put(`${API_URL}/api/hospitals/${editHospital.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditHospitalModal(false);
      setEditHospital(null);
      const hospitalsRes = await axios.get(`${API_URL}/api/hospitals`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals(hospitalsRes.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update hospital");
    }
  };

  const handleEditAdmin = async (adminId, updatedAdmin) => {
    setFormError("");
    try {
      const payload = {
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        hospital_id: updatedAdmin.hospital_id || null,
        ...(updatedAdmin.password && { password: updatedAdmin.password }),
      };
      await axios.put(`${API_URL}/api/admins/${adminId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const adminsRes = await axios.get(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(adminsRes.data);
      setShowEditAdminModal(false);
      setEditAdmin(null);
    } catch (err) {
      setFormError(err.response?.data?.detail || err.response?.data || "Failed to update admin");
    }
  };

  // New handler to open edit modal
  const handleEditDepartmentClick = (dept) => {
    setEditDepartment({ ...dept });
    setShowEditDepartmentModal(true);
    setFormError("");
  };

  // Handler to delete department
  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await axios.delete(`${API_URL}/api/departments/${departmentId}`, { headers: { Authorization: `Bearer ${token}` } });
      // Refetch departments for this hospital
      const res = await axios.get(`${API_URL}/api/hospitals/${selectedHospital.id}/departments`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(res.data);
      if (selectedDepartment?.id === departmentId) {
        setSelectedDepartment(null);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete department");
    }
  };

  // Handler to submit department edit
  const handleEditDepartmentSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.put(`${API_URL}/api/departments/${editDepartment.id}`, { name: editDepartment.name, description: editDepartment.description }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditDepartmentModal(false);
      setEditDepartment(null);
      // Refetch departments for this hospital
      const res = await axios.get(`${API_URL}/api/hospitals/${selectedHospital.id}/departments`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(res.data);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update department");
    }
  };

  const handleDeleteHospital = async (hospitalId) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return;
    try {
      await axios.delete(`${API_URL}/api/hospitals/${hospitalId}`, { headers: { Authorization: `Bearer ${token}` } });
      setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
      if (selectedHospital?.id === hospitalId) {
        setSelectedHospital(null);
      }
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

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await axios.delete(`${API_URL}/api/doctors/${doctorId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDoctors((prev) => prev.filter((d) => d.user_id !== doctorId));
      if (selectedDoctor?.user_id === doctorId) {
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete doctor");
    }
  };

  // Navigation handlers
  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSelectDepartment = (department) => {
    setSelectedDepartment(department);
    setSelectedDoctor(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleBack = () => {
    if (selectedDoctor) {
      setSelectedDoctor(null);
    } else if (selectedDepartment) {
      setSelectedDepartment(null);
    } else if (selectedHospital) {
      setSelectedHospital(null);
    }
    setSearchTerm("");
    setCurrentPage(1);
  };

  const [recentActivity, setRecentActivity] = useState(["Added new hospital: City Medical Center", "Admin John Doe updated hospital info", "Deleted department: Cardiology", "Added doctor: Dr. Smith to Pediatrics", "Admin Jane assigned to General Hospital", "Doctor Dr. Lee profile updated", "Hospital 'Sunrise Clinic' removed"]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Super Admin Panel</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveSection("dashboard");
                  setSelectedHospital(null);
                  setSelectedDepartment(null);
                  setSelectedDoctor(null);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <div className="flex items-center">
                  <RiDashboardLine className="mr-3" />
                  <span>Dashboard</span>
                </div>
                <FaChevronRight className="text-xs" />
              </button>
              <button
                onClick={() => {
                  setActiveSection("hospitals");
                  setSelectedHospital(null);
                  setSelectedDepartment(null);
                  setSelectedDoctor(null);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "hospitals" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
              >
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
              {/* Reports section removed */}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl font-bold text-gray-800">{activeSection === "dashboard" ? "Dashboard Overview" : activeSection === "hospitals" ? "Healthcare Management" : activeSection === "admins" ? "Admin Management" : null}</h1>
            <p className="text-gray-600">{activeSection === "dashboard" ? "Welcome back! Here's what's happening with your system." : "Manage and monitor all aspects of your healthcare system"}</p>
          </motion.div>

          {/* Breadcrumb Navigation */}
          {activeSection === "hospitals" && (
            <div className="mb-4 flex items-center text-sm text-gray-600">
              {selectedDoctor && (
                <button onClick={handleBack} className="mr-2 text-blue-600 hover:text-blue-800">
                  <FaArrowLeft className="inline mr-1" /> Back
                </button>
              )}
              <span
                className="cursor-pointer hover:text-blue-600"
                onClick={() => {
                  setSelectedHospital(null);
                  setSelectedDepartment(null);
                  setSelectedDoctor(null);
                }}
              >
                Hospitals
              </span>
              {selectedHospital && (
                <>
                  <FaChevronRight className="mx-2 text-xs" />
                  <span
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      setSelectedDepartment(null);
                      setSelectedDoctor(null);
                    }}
                  >
                    {selectedHospital.name}
                  </span>
                </>
              )}
              {selectedDepartment && (
                <>
                  <FaChevronRight className="mx-2 text-xs" />
                  <span
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      setSelectedDoctor(null);
                    }}
                  >
                    {selectedDepartment.name}
                  </span>
                </>
              )}
              {selectedDoctor && (
                <>
                  <FaChevronRight className="mx-2 text-xs" />
                  <span>{selectedDoctor.username}</span>
                </>
              )}
            </div>
          )}

          {/* Dashboard Overview */}
          {activeSection === "dashboard" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardCards.map((card) => (
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

          {/* Hospitals View */}
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredHospitals).map((hospital) => (
                        <tr key={hospital.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectHospital(hospital)}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hospital.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.city}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditHospitalClick(hospital);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHospital(hospital.id);
                              }}
                            >
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

          {/* Departments View */}
          {activeSection === "hospitals" && selectedHospital && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search departments..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => setShowAddDepartmentModal(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FaPlus className="mr-2" />
                    Add Department
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
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredDepartments).map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectDepartment(dept)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <FaBuilding />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.description || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDepartmentClick(dept);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDepartment(dept.id);
                              }}
                            >
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
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredDepartments.length)}</span> of <span className="font-medium">{filteredDepartments.length}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Previous
                    </button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredDepartments)))} disabled={currentPage === totalPages(filteredDepartments)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Doctors View */}
          {activeSection === "hospitals" && selectedHospital && selectedDepartment && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search doctors..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => setShowAddDoctorModal(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FaPlus className="mr-2" />
                    Add Doctor
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
                          Specialty
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredDoctors).map((doctor) => (
                        <tr key={doctor.user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectDoctor(doctor)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <FaUserMd />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{doctor.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.specialty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3" onClick={(e) => e.stopPropagation()}>
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoctor(doctor.user_id);
                              }}
                            >
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

          {/* Appointments View */}
          {activeSection === "hospitals" && selectedHospital && selectedDepartment && selectedDoctor && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search appointments..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                          Date & Time
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appt.username}</td>
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
                            <button className="text-blue-600 hover:text-blue-900">View</button>
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
                  <button onClick={() => setShowAddAdminModal(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FaPlus className="mr-2" />
                    Add Admin
                  </button>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.hospital_name || "Not Assigned"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={() => {
                                setEditAdmin({ ...admin, password: "" });
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

          {/* Modals */}
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

          {showAddDepartmentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleAddDepartment}>
                <h3 className="text-lg font-bold mb-4">Add Department</h3>
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Department Name" value={newDepartment.name} onChange={(e) => setNewDepartment({ name: e.target.value })} required />
                {formError && <div className="text-red-500 mb-2">{formError}</div>}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1" onClick={() => setShowAddDepartmentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {showAddDoctorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <form className="bg-white p-6 rounded shadow-md w-96" onSubmit={handleAddDoctorModal}>
                <h3 className="text-lg font-bold mb-4">Add Doctor</h3>
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Username" value={newDoctor.username} onChange={(e) => setNewDoctor({ ...newDoctor, username: e.target.value })} required />
                <input type="email" className="w-full border p-2 mb-3 rounded" placeholder="Email" value={newDoctor.email} onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })} required />
                <input type="password" className="w-full border p-2 mb-3 rounded" placeholder="Password" value={newDoctor.password} onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })} required />
                {/* department_id is set automatically from selectedDepartment */}
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Specialty" value={newDoctor.specialty} onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} required />
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Title (e.g. Consultant, Attending)" value={newDoctor.title || ""} onChange={(e) => setNewDoctor({ ...newDoctor, title: e.target.value })} required />
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Phone (optional)" value={newDoctor.phone || ""} onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })} />
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Bio (optional)" value={newDoctor.bio || ""} onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })} />
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="License Number (optional)" value={newDoctor.license_number || ""} onChange={(e) => setNewDoctor({ ...newDoctor, license_number: e.target.value })} />
                <input type="number" className="w-full border p-2 mb-3 rounded" placeholder="Years Experience (optional)" value={newDoctor.years_experience || ""} onChange={(e) => setNewDoctor({ ...newDoctor, years_experience: e.target.value })} min="0" />
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Education (optional)" value={newDoctor.education || ""} onChange={(e) => setNewDoctor({ ...newDoctor, education: e.target.value })} />
                {formError && <div className="text-red-500 mb-2">{formError}</div>}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1" onClick={() => setShowAddDoctorModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

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

          {showEditDepartmentModal && editDepartment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleEditDepartmentSubmit}>
                <h3 className="text-lg font-bold mb-4">Edit Department</h3>
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Department Name" value={editDepartment.name} onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })} required />
                <input type="text" className="w-full border p-2 mb-3 rounded" placeholder="Description (optional)" value={editDepartment.description || ""} onChange={(e) => setEditDepartment({ ...editDepartment, description: e.target.value })} />
                {formError && <div className="text-red-500 mb-2">{formError}</div>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-3 py-1"
                    onClick={() => {
                      setShowEditDepartmentModal(false);
                      setEditDepartment(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";
import { FaHospital, FaBuilding, FaUserMd, FaHeart, FaSearch, FaPlus } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "";

// Footer Component (reused from SuperAdminDashboard)
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
const AdminContent = ({ activeSection, hospital, departments, doctors, departmentForm, setDepartmentForm, doctorForm, setDoctorForm, handleDepartmentSubmit, handleDoctorSubmit, departmentMessage, departmentError, doctorMessage, doctorError }) => {
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderContent = () => {
    switch (activeSection) {
      case "welcome":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible">
            <p className="text-gray-600">Welcome to the Admin Dashboard. Use the cards above to manage your hospital, departments, and doctors.</p>
          </motion.div>
        );
      case "view-hospital":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assigned Hospital</h2>
            {hospital ? (
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {hospital.name}
                </p>
                <p>
                  <strong>Address:</strong> {hospital.address}
                </p>
                <p>
                  <strong>Latitude:</strong> {hospital.lat}
                </p>
                <p>
                  <strong>Longitude:</strong> {hospital.lng}
                </p>
              </div>
            ) : (
              <p className="text-red-500 text-sm">No hospital assigned.</p>
            )}
          </motion.div>
        );
      case "add-department":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Department</h2>
            {hospital ? (
              <form onSubmit={handleDepartmentSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Department Name</label>
                    <input type="text" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" placeholder="e.g., Cardiology" required />
                  </div>
                </div>
                {departmentMessage && <p className="text-green-500 text-sm mt-4">{departmentMessage}</p>}
                {departmentError && <p className="text-red-500 text-sm mt-4">{departmentError}</p>}
                <button type="submit" className="mt-6 w-full p-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600">
                  Add Department
                </button>
              </form>
            ) : (
              <p className="text-red-500 text-sm">Assign a hospital to add departments.</p>
            )}
          </motion.div>
        );
      case "create-doctor":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Doctor</h2>
            {departments.length === 0 || !hospital ? (
              <p className="text-red-500 text-sm">{hospital ? "No departments available. Add a department first." : "Assign a hospital to add doctors."}</p>
            ) : (
              <form onSubmit={handleDoctorSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Department</label>
                    <select value={doctorForm.department_id} onChange={(e) => setDoctorForm({ ...doctorForm, department_id: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" required>
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Username</label>
                    <input type="text" value={doctorForm.username} onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" placeholder="e.g., DrDerma" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                    <input type="email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" placeholder="e.g., drderma@example.com" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                    <input
                      type="password"
                      value={doctorForm.password}
                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500"
                      placeholder="Enter password"
                      // Password is required only for new doctor, not for editing
                      required={doctorForm.isNew}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Specialty</label>
                    <input type="text" value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" placeholder="e.g., Dermatology" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Title</label>
                    <input type="text" value={doctorForm.title} onChange={(e) => setDoctorForm({ ...doctorForm, title: e.target.value })} className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500" placeholder="e.g., MD" required />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Phone</label>
                    <input type="text" value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" placeholder="e.g., 555-123-4567" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Bio</label>
                    <textarea value={doctorForm.bio} onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-teal-500" placeholder="e.g., Experienced dermatologist" rows="4" />
                  </div>
                </div>
                {doctorMessage && <p className="text-green-500 text-sm mt-4">{doctorMessage}</p>}
                {doctorError && <p className="text-red-500 text-sm mt-4">{doctorError}</p>}
                <button type="submit" className="mt-6 w-full p-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 disabled:bg-gray-400" disabled={departments.length === 0 || !hospital}>
                  Create Doctor
                </button>
              </form>
            )}
          </motion.div>
        );
      case "view-departments":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Departments</h2>
            {departments.length === 0 ? (
              <p className="text-gray-600">No departments available.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-gray-700 font-semibold">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border-b">
                      <td className="py-2 px-4">{dept.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        );
      case "view-doctors":
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Doctors</h2>
            {doctors.length === 0 ? (
              <p className="text-gray-600">No doctors available.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-gray-700 font-semibold">Username</th>
                    <th className="py-2 px-4 text-gray-700 font-semibold">Email</th>
                    <th className="py-2 px-4 text-gray-700 font-semibold">Department</th>
                    <th className="py-2 px-4 text-gray-700 font-semibold">Specialty</th>
                    <th className="py-2 px-4 text-gray-700 font-semibold">Title</th>
                    <th className="py-2 px-4 text-gray-700 font-semibold">Phone</th>
                    <th className="py-2 px-4 text-gray-700 font-semibold">Bio</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.user_id} className="border-b">
                      <td className="py-2 px-4">{doc.username}</td>
                      <td className="py-2 px-4">{doc.email}</td>
                      <td className="py-2 px-4">{doc.department_name}</td>
                      <td className="py-2 px-4">{doc.specialty}</td>
                      <td className="py-2 px-4">{doc.title}</td>
                      <td className="py-2 px-4">{doc.phone || "N/A"}</td>
                      <td className="py-2 px-4">{doc.bio || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return <div>{renderContent()}</div>;
};

// Main Dashboard Component
const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [departmentForm, setDepartmentForm] = useState({ name: "" });
  const [doctorForm, setDoctorForm] = useState({
    department_id: "",
    username: "",
    email: "",
    password: "",
    specialty: "",
    title: "",
    phone: "",
    bio: "",
  });
  const [departmentMessage] = useState("");
  const [doctorMessage] = useState("");
  const [departmentError] = useState("");
  const [doctorError] = useState("");

  // Fetch hospital, departments, and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const hospitalResponse = await fetch(`${API_URL}/api/admin/hospital`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const hospitalData = await hospitalResponse.json();
        if (hospitalResponse.ok) setHospital(hospitalData);
        const departmentResponse = await fetch(`${API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const departmentData = await departmentResponse.json();
        if (departmentResponse.ok) setDepartments(departmentData);
        const doctorResponse = await fetch(`${API_URL}/api/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const doctorData = await doctorResponse.json();
        if (doctorResponse.ok) setDoctors(doctorData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    if (token) fetchData();
  }, [token]);

  // Filtered data
  const filteredDepartments = departments.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDoctors = doctors.filter((doctor) => doctor.username.toLowerCase().includes(searchTerm.toLowerCase()) || doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) || doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pagination logic
  const paginatedData = (data) => data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = (data) => Math.ceil(data.length / itemsPerPage);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Dashboard cards
  const dashboardCards = [
    { id: "hospital", title: "Hospital", icon: <FaHospital className="text-2xl text-blue-500" />, count: hospital ? 1 : 0, bgColor: "bg-blue-50", action: () => setActiveSection("hospital") },
    { id: "departments", title: "Departments", icon: <FaBuilding className="text-2xl text-purple-500" />, count: departments.length, bgColor: "bg-purple-50", action: () => setActiveSection("departments") },
    { id: "doctors", title: "Doctors", icon: <FaUserMd className="text-2xl text-green-500" />, count: doctors.length, bgColor: "bg-green-50", action: () => setActiveSection("doctors") },
  ];

  const handleDepartmentSubmit = (e) => {
    e.preventDefault();
    // Add your department submit logic here
  };

  const handleDoctorSubmit = (e) => {
    e.preventDefault();
    // Add your doctor submit logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Panel</h2>
            <div className="space-y-2">
              <button onClick={() => setActiveSection("dashboard")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaHospital className="mr-3" />
                  <span>Dashboard</span>
                </div>
              </button>
              <button onClick={() => setActiveSection("hospital")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "hospital" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaHospital className="mr-3" />
                  <span>Hospital</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{hospital ? 1 : 0}</span>
              </button>
              <button onClick={() => setActiveSection("departments")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "departments" ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaBuilding className="mr-3" />
                  <span>Departments</span>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">{departments.length}</span>
              </button>
              <button onClick={() => setActiveSection("doctors")} className={`w-full flex items-center justify-between p-3 rounded-lg ${activeSection === "doctors" ? "bg-green-50 text-green-600" : "text-gray-600 hover:bg-gray-100"}`}>
                <div className="flex items-center">
                  <FaUserMd className="mr-3" />
                  <span>Doctors</span>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{doctors.length}</span>
              </button>
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl font-bold text-gray-800">{activeSection === "dashboard" ? "Dashboard Overview" : activeSection === "hospital" ? "Hospital Details" : activeSection === "departments" ? "Department Management" : "Doctor Management"}</h1>
            <p className="text-gray-600">{activeSection === "dashboard" ? "Welcome back! Here's what's happening at your hospital." : "Manage and monitor your hospital's resources"}</p>
          </motion.div>

          {/* Dashboard Overview */}
          {activeSection === "dashboard" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCards.map((card, index) => (
                  <motion.div key={card.id} variants={itemVariants} whileHover="hover" onClick={card.action} className={`${card.bgColor} p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-200`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{card.count}</h3>
                      </div>
                      <div className="p-3 rounded-lg bg-white bg-opacity-50">{card.icon}</div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <span>View all</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Hospital Details */}
          {activeSection === "hospital" && hospital && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Assigned Hospital</h2>
              <div className="space-y-2">
                <p><strong>Name:</strong> {hospital.name}</p>
                <p><strong>Address:</strong> {hospital.address}</p>
                {hospital.lat && <p><strong>Latitude:</strong> {hospital.lat}</p>}
                {hospital.lng && <p><strong>Longitude:</strong> {hospital.lng}</p>}
              </div>
            </motion.div>
          )}

          {/* Departments Management */}
          {activeSection === "departments" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div className="relative mb-4 md:mb-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input type="text" placeholder="Search departments..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setActiveSection("add-department")}> <FaPlus className="mr-2" /> Add Department </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredDepartments).map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{dept.name}</td>
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
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredDepartments)))} disabled={currentPage === totalPages(filteredDepartments)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Add Department Modal */}
          {activeSection === "add-department" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">Add Department</h2>
              <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                <input type="text" className="w-full border rounded p-2" placeholder="Department Name" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
                {departmentMessage && <p className="text-green-500 text-sm">{departmentMessage}</p>}
                {departmentError && <p className="text-red-500 text-sm">{departmentError}</p>}
                <div className="flex justify-end space-x-2">
                  <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setActiveSection("departments")}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
                </div>
              </form>
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
                  <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setActiveSection("create-doctor")}> <FaPlus className="mr-2" /> Add Doctor </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData(filteredDoctors).map((doc) => (
                        <tr key={doc.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{doc.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{doc.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{doc.department_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{doc.specialty}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{doc.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{doc.phone || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{doc.bio || "N/A"}</td>
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
                    <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages(filteredDoctors)))} disabled={currentPage === totalPages(filteredDoctors)} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Create Doctor Modal */}
          {activeSection === "create-doctor" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">Create Doctor</h2>
              <form onSubmit={handleDoctorSubmit} className="space-y-4">
                <select value={doctorForm.department_id} onChange={(e) => setDoctorForm({ ...doctorForm, department_id: e.target.value })} className="w-full border rounded p-2" required>
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <input type="text" className="w-full border rounded p-2" placeholder="Username" value={doctorForm.username} onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })} required />
                <input type="email" className="w-full border rounded p-2" placeholder="Email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} required />
                <input type="password" className="w-full border rounded p-2" placeholder="Password" value={doctorForm.password} onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })} required />
                <input type="text" className="w-full border rounded p-2" placeholder="Specialty" value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })} required />
                <input type="text" className="w-full border rounded p-2" placeholder="Title" value={doctorForm.title} onChange={(e) => setDoctorForm({ ...doctorForm, title: e.target.value })} required />
                <input type="text" className="w-full border rounded p-2" placeholder="Phone" value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
                <textarea className="w-full border rounded p-2" placeholder="Bio" value={doctorForm.bio} onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} rows={3} />
                {doctorMessage && <p className="text-green-500 text-sm">{doctorMessage}</p>}
                {doctorError && <p className="text-red-500 text-sm">{doctorError}</p>}
                <div className="flex justify-end space-x-2">
                  <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setActiveSection("doctors")}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                </div>
              </form>
            </motion.div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

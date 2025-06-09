import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import BlogPage from "./pages/BlogPage";
import AboutPage from "./pages/AboutPage";
import SignupPage from "./pages/SignupPage";
import Chatbot from "./components/layout/Chatbot";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import EmergencyPage from "./pages/EmergencyPage";
import MedicalQueryPage from "./pages/MedicalQueryPage";
import DiseaseDetectionPage from "./pages/DiseaseDetectionPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import BookAppointmentPage from "./pages/BookAppointmentPage";
import GeneralQueryPage from "./pages/GeneralQueryPage";
import MedicalHistoryPage from "./pages/MedicalHistoryPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/dashboard/user" element={<DashboardPage />} />
              <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/medical-query" element={<MedicalQueryPage />} />
              <Route path="/disease-detection" element={<DiseaseDetectionPage />} />
              <Route path="/book-appointment" element={<BookAppointmentPage />} />
              <Route path="/general-query" element={<GeneralQueryPage />} />
              <Route path="/medical-history" element={<MedicalHistoryPage />} />

              {/* Redirect to home page for any unknown routes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Chatbot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

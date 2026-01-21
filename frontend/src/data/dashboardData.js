import { FaHistory, FaCalendarAlt, FaFileMedical, FaAmbulance, FaCommentMedical, FaUserCog, FaEye, FaLungs, FaBrain, FaHeartbeat } from "react-icons/fa";
import { IoMdAnalytics } from "react-icons/io";

export const healthFeatures = [
  {
    title: "Medical History",
    icon: <FaHistory className="text-2xl" />,
    path: "/medical-history",
    color: "bg-blue-400 bg-opacity-50 text-blue-900",
    description: "Access your complete health records",
  },
  {
    title: "Appointments",
    icon: <FaCalendarAlt className="text-2xl" />,
    path: "/book-appointment",
    color: "bg-purple-400 bg-opacity-50 text-purple-900",
    description: "Schedule and manage doctor visits",
  },
  {
    title: "Health Analytics",
    icon: <IoMdAnalytics className="text-2xl" />,
    path: "/health-analytics",
    color: "bg-teal-400 bg-opacity-50 text-teal-900",
    description: "Track your health metrics over time",
  },
];

export const aiDetectionFeatures = [
  {
    title: "Lymphoma Detection",
    icon: <FaEye className="text-2xl" />,
    path: "/lymphoma",
    color: "bg-indigo-300 bg-opacity-50 text-indigo-900",
    description: "Analyze lymph node images for diseases",
  },
  {
    title: "Pneumonia Detection",
    icon: <FaLungs className="text-2xl" />,
    path: "/pneumonia",
    color: "bg-red-300 bg-opacity-50 text-red-900",
    description: "Screen chest X-ray images for pneumonia",
  },
  {
    title: "Breast Cancer Detection",
    icon: <FaHeartbeat className="text-2xl" />,
    path: "/breast-cancer",
    color: "bg-blue-300 bg-opacity-50 text-blue-800",
    description: "Detect tumors in breast MRI scans",
  },
  {
    title: "Kidney Disease Detection",
    icon: <FaLungs className="text-2xl" />,
    path: "/kidney-disease",
    color: "bg-pink-300 bg-opacity-50 text-pink-900",
    description: "Analyze kidney images for diseases",
  },
  {
    title: "Eye Disease Detection",
    icon: <FaEye className="text-2xl" />,
    path: "/eye-disease",
    color: "bg-purple-300 bg-opacity-50 text-purple-900",
    description: "Analyze eye images for diseases",
  },
];

export const supportFeatures = [
  {
    title: "Medical Reports",
    icon: <FaFileMedical className="text-2xl" />,
    path: "/medical-query",
    color: "bg-green-300 bg-opacity-50 text-green-900",
    description: "Upload and analyze medical reports",
  },
  {
    title: "Emergency Services",
    icon: <FaAmbulance className="text-2xl" />,
    path: "/emergency",
    color: "bg-red-300 bg-opacity-50 text-red-900",
    description: "Immediate medical assistance",
  },
  {
    title: "Health Assistant",
    icon: <FaCommentMedical className="text-2xl" />,
    path: "/general-query",
    color: "bg-cyan-300 bg-opacity-50 text-cyan-900",
    description: "AI-powered health consultation",
  },
  {
    title: "Picture Diagnosis",
    icon: <FaFileMedical className="text-2xl" />,
    path: "/disease-detection",
    color: "bg-purple-300 bg-opacity-50 text-purple-900",
    description: "Upload images for AI analysis",
  },
  {
    title: "Account Settings",
    icon: <FaUserCog className="text-2xl" />,
    path: "/profile",
    color: "bg-gray-300 bg-opacity-50 text-gray-900",
    description: "Manage your account details",
  },
];

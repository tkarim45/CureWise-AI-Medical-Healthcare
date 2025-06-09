import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import { FaHeart, FaLock, FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { RiShieldUserLine } from "react-icons/ri";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { signup, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup({ username, email, password });
      // Removed navigate('/dashboard') to prevent double navigation
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <NavBar />

      {/* Main Content */}
      <motion.main className="flex-1 flex items-center justify-center px-4 py-12" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="w-full max-w-md">
          {/* Signup Card */}
          <motion.div className="bg-white rounded-xl shadow-lg overflow-hidden" variants={itemVariants}>
            {/* Card Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-center">
              <div className="flex justify-center mb-4">
                <RiShieldUserLine className="text-white text-4xl" />
              </div>
              <h1 className="text-2xl font-bold text-white">Create Account</h1>
              <p className="text-white/90 mt-1">Sign up for HealthSync AI</p>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-8">
              {error && (
                <motion.div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <FaLock className="flex-shrink-0 mt-1 mr-2" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Username Field */}
                <motion.div className="mb-5" variants={itemVariants}>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-400" placeholder="e.g., johndoe" required disabled={loading} />
                  </div>
                </motion.div>

                {/* Email Field */}
                <motion.div className="mb-5" variants={itemVariants}>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiOutlineMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-400" placeholder="your@email.com" required disabled={loading} />
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div className="mb-6" variants={itemVariants}>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-gray-400" placeholder="••••••••" required disabled={loading} />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-500" /> : <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />}
                    </button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <motion.button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:from-primary/90 hover:to-accent/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center" whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}} disabled={loading}>
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing Up...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </div>

            {/* Card Footer */}
            <motion.div className="bg-gray-50 px-6 py-4 text-center" variants={itemVariants}>
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:text-accent">
                  Login
                </Link>
              </p>
            </motion.div>
          </motion.div>

          {/* Social Signup Options */}
          <motion.div className="mt-6 text-center" variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10 5.523 0 10-4.477 10-10 0-5.523-4.477-10-10-10zm3 8a3 3 0 11-6 0 3 3 0 016 0zm-9.309 3h6.618a.309.309 0 00.309-.309v-.382a.309.309 0 00-.309-.309H3.691a.309.309 0 00-.309.309v.382c0 .17.139.309.309.309zM10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-600">
          <p className="text-sm">© {new Date().getFullYear()} HealthSync AI. All rights reserved.</p>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <span className="text-sm">Made with</span>
            <motion.span className="text-primary" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              <FaHeart />
            </motion.span>
            <span className="text-sm">by the HealthSync Team</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignupPage;

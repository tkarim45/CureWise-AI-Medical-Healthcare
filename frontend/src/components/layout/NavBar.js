import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { FaHome, FaInfoCircle, FaBlog, FaDollarSign, FaSignInAlt, FaSignOutAlt, FaHeartbeat, FaUser, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RiDashboardLine } from "react-icons/ri";

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user && location.pathname.includes("/dashboard")) {
      navigate("/login");
    }
  }, [user, location.pathname, navigate]);

  const menuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.15,
      },
    },
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "super_admin") return "/dashboard/super-admin";
    return `/dashboard/${user.role}`;
  };

  const handleDashboardClick = (e) => {
    e.preventDefault();
    const path = getDashboardPath();

    if (!user) {
      navigate("/login", { replace: true });
    } else {
      navigate(path, { replace: true });
    }

    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <NavLink to="/" className="flex-shrink-0 flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
              <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FaHeartbeat className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">CureWise</span>
              </motion.div>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              <NavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`}>
                <FaHome className="mr-2" />
                Home
              </NavLink>

              <NavLink to="/about" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`}>
                <FaInfoCircle className="mr-2" />
                About
              </NavLink>

              <NavLink to="/blog" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`}>
                <FaBlog className="mr-2" />
                Blog
              </NavLink>

              <NavLink to="/pricing" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`}>
                <FaDollarSign className="mr-2" />
                Pricing
              </NavLink>
            </div>
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <button className="p-2 rounded-full text-gray-600 hover:text-primary hover:bg-gray-100">
                  <IoMdNotificationsOutline className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </button>

                <div className="relative ml-4">
                  <motion.button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none" onClick={() => setIsDropdownOpen(!isDropdownOpen)} whileHover={{ scale: 1.02 }}>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaUser className="h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">{user.name || "Account"}</span>
                    {isDropdownOpen ? <FaChevronUp className="h-3 w-3 text-gray-500" /> : <FaChevronDown className="h-3 w-3 text-gray-500" />}
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                        <div className="py-1">
                          <button onClick={() => navigate("/profile")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <FaUser className="mr-2" />
                            Profile
                          </button>
                          <button onClick={handleDashboardClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <RiDashboardLine className="mr-2" />
                            Dashboard
                          </button>
                          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <FaSignOutAlt className="mr-2" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                  Sign in
                </NavLink>
                <NavLink to="/signup" className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 shadow-sm">
                  Get started
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              <svg className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div className="md:hidden bg-white border-t border-gray-200" variants={menuVariants} initial="hidden" animate="visible" exit="exit">
            <motion.div className="pt-2 pb-3 space-y-1 px-4">
              <motion.div variants={itemVariants}>
                <NavLink to="/" className={({ isActive }) => `block pl-3 pr-4 py-2 rounded-md text-base font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <FaHome className="mr-3" />
                  Home
                </NavLink>
              </motion.div>

              <motion.div variants={itemVariants}>
                <NavLink to="/about" className={({ isActive }) => `block pl-3 pr-4 py-2 rounded-md text-base font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <FaInfoCircle className="mr-3" />
                  About
                </NavLink>
              </motion.div>

              <motion.div variants={itemVariants}>
                <NavLink to="/blog" className={({ isActive }) => `block pl-3 pr-4 py-2 rounded-md text-base font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <FaBlog className="mr-3" />
                  Blog
                </NavLink>
              </motion.div>

              <motion.div variants={itemVariants}>
                <NavLink to="/pricing" className={({ isActive }) => `block pl-3 pr-4 py-2 rounded-md text-base font-medium flex items-center ${isActive ? "text-primary bg-primary/10" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <FaDollarSign className="mr-3" />
                  Pricing
                </NavLink>
              </motion.div>
            </motion.div>

            <div className="pt-4 pb-3 border-t border-gray-200 px-4">
              {user ? (
                <div className="space-y-3">
                  <motion.div className="flex items-center" variants={itemVariants}>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FaUser className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">{user.name || "User"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button onClick={handleDashboardClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <RiDashboardLine className="mr-3" />
                      Dashboard
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FaSignOutAlt className="mr-3" />
                      Sign out
                    </button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-3">
                  <motion.div variants={itemVariants}>
                    <NavLink to="/signup" className="block w-full px-4 py-2 rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 text-center" onClick={() => setIsMobileMenuOpen(false)}>
                      Get started
                    </NavLink>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <NavLink to="/login" className="block w-full px-4 py-2 rounded-md text-base font-medium text-primary hover:bg-gray-50 text-center" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign in
                    </NavLink>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;

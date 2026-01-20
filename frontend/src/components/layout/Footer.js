import { motion } from "framer-motion";
import { FaTwitter, FaLinkedinIn, FaGithub, FaEnvelope, FaPhone, FaMapMarkerAlt, FaHeartbeat, FaShieldAlt, FaFileAlt, FaUserMd } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12" initial="hidden" whileInView="visible" variants={containerVariants} viewport={{ once: true, margin: "-100px" }}>
          {/* Brand Column */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FaHeartbeat className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold">CureWise</span>
            </div>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">Revolutionizing healthcare through intelligent AI solutions that connect patients and providers.</p>
            <div className="flex space-x-4">
              {[
                { icon: FaTwitter, url: "https://twitter.com" },
                { icon: FaLinkedinIn, url: "https://linkedin.com" },
                { icon: FaGithub, url: "https://github.com" },
              ].map((social, i) => (
                <motion.a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}>
                  <social.icon className="text-lg" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiArrowRight className="mr-2 text-primary" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { text: "Home", url: "/" },
                { text: "Features", url: "/features" },
                { text: "Pricing", url: "/pricing" },
                { text: "About Us", url: "/about" },
                { text: "Contact", url: "/contact" },
              ].map((link, i) => (
                <li key={i}>
                  <motion.a href={link.url} className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center" whileHover={{ x: 5 }}>
                    <FiArrowRight className="mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.text}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiArrowRight className="mr-2 text-primary" />
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { icon: FaFileAlt, text: "Documentation", url: "/docs" },
                { icon: FaUserMd, text: "For Providers", url: "/providers" },
                { icon: FaShieldAlt, text: "Security", url: "/security" },
                { icon: FaHeartbeat, text: "Case Studies", url: "/cases" },
                { icon: FaFileAlt, text: "White Papers", url: "/whitepapers" },
              ].map((resource, i) => (
                <li key={i}>
                  <motion.a href={resource.url} className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center" whileHover={{ x: 5 }}>
                    <resource.icon className="mr-2 text-sm" />
                    {resource.text}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiArrowRight className="mr-2 text-primary" />
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start">
                <FaEnvelope className="mt-1 mr-3 text-primary flex-shrink-0" />
                <span>support@CureWise.ai</span>
              </li>
              <li className="flex items-start">
                <FaPhone className="mt-1 mr-3 text-primary flex-shrink-0" />
                <span>+1 (800) 555-HEALTH</span>
              </li>
              <li className="flex items-start">
                <FaMapMarkerAlt className="mt-1 mr-3 text-primary flex-shrink-0" />
                <span>
                  123 AI Healthcare Blvd
                  <br />
                  San Francisco, CA 94107
                </span>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div className="border-t border-gray-800 my-8" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} />

        {/* Bottom Footer */}
        <motion.div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
          <div className="mb-4 md:mb-0">© {new Date().getFullYear()} CureWise. All rights reserved.</div>
          <div className="flex space-x-6">
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="/cookies" className="hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

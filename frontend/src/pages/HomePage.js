import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { FaUserMd, FaUsers, FaDatabase, FaArrowRight, FaRegLightbulb, FaRegClock, FaRegHospital } from "react-icons/fa";
import { IoMdTrendingUp, IoMdPulse } from "react-icons/io";
import { useEffect, useState } from "react";
import { RiMentalHealthLine } from "react-icons/ri";

const HomePage = () => {
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

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Parallax effects
  const { scrollY } = useScroll();
  const yBackground1 = useTransform(scrollY, [0, 500], [0, 100]);
  const yBackground2 = useTransform(scrollY, [0, 500], [0, 50]);

  // Floating animation for background elements
  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        repeat: Infinity,
        duration: 6,
        ease: "easeInOut",
      },
    },
  };

  // Animated counter for stats
  const AnimatedCounter = ({ from, to, duration = 2000 }) => {
    const [count, setCount] = useState(from);
    useEffect(() => {
      const increment = (to - from) / (duration / 16);
      const interval = setInterval(() => {
        setCount((prev) => {
          const next = prev + increment;
          return next >= to ? to : Math.round(next);
        });
      }, 16);
      return () => clearInterval(interval);
    }, [to]);
    return <span>{count.toLocaleString()}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      {/* Hero Section */}
      <motion.main className="flex-grow" initial="hidden" animate="visible" variants={containerVariants}>
        <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-gradient-to-br from-primary to-accent text-white">
          <motion.div className="absolute inset-0 bg-noise opacity-10" style={{ y: yBackground1 }} />

          <motion.div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-xl" variants={floatingVariants} animate="animate" />

          <motion.div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-white/5 blur-xl" variants={floatingVariants} animate="animate" style={{ y: yBackground2 }} />

          <motion.div className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full bg-white/15 blur-md" variants={floatingVariants} animate="animate" />

          <div className="relative z-10 max-w-7xl mx-auto text-center px-4">
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <IoMdTrendingUp className="mr-2" />
                <span className="text-sm font-medium">The future of healthcare is here</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">AI-Powered Healthcare</span> <br />
                For Everyone
              </h1>

              <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mb-10">CureWise delivers intelligent, personalized healthcare solutions that connect patients, providers, and data seamlessly.</p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" className="inline-flex items-center justify-center bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
                    Get Started
                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/demo" className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
                    Watch Demo
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Logo Cloud Section */}
        <motion.section className="py-12 px-6 bg-white overflow-hidden" variants={fadeIn}>
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-gray-500 mb-8">Trusted by leading healthcare organizations</p>
            <div className="relative w-full">
              <motion.div
                className="flex gap-16 items-center"
                style={{ width: "max-content" }}
                animate={{
                  x: ["0%", "-50%"],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 18,
                  ease: "linear",
                }}
              >
                {/* Duplicate logos for seamless loop */}
                {[
                  {
                    src: "https://static.cdnlogo.com/logos/n/64/nhs-8211-national-health-service.png",
                    alt: "NHS",
                  },
                  {
                    src: "https://crystalpng.com/wp-content/uploads/2025/01/johns-hopkins-university-logo-in-circle.png",
                    alt: "Johns Hopkins",
                  },
                  {
                    src: "https://logowik.com/content/uploads/images/mayo-clinic.jpg",
                    alt: "Mayo Clinic",
                  },
                  {
                    src: "https://jeffgothelf.com/wp-content/uploads/2023/06/Cleveland-Clinic-Logo-3261511006.jpg",
                    alt: "Cleveland Clinic",
                  },
                  {
                    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc8D7NPl8raPdz0RSkutcZRhCiJKNEptQXkg&s",
                    alt: "Stanford Health",
                  },
                ]
                  .concat([
                    {
                      src: "https://static.cdnlogo.com/logos/n/64/nhs-8211-national-health-service.png",
                      alt: "NHS",
                    },
                    {
                      src: "https://crystalpng.com/wp-content/uploads/2025/01/johns-hopkins-university-logo-in-circle.png",
                      alt: "Johns Hopkins",
                    },
                    {
                      src: "https://logowik.com/content/uploads/images/mayo-clinic.jpg",
                      alt: "Mayo Clinic",
                    },
                    {
                      src: "https://jeffgothelf.com/wp-content/uploads/2023/06/Cleveland-Clinic-Logo-3261511006.jpg",
                      alt: "Cleveland Clinic",
                    },
                    {
                      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc8D7NPl8raPdz0RSkutcZRhCiJKNEptQXkg&s",
                      alt: "Stanford Health",
                    },
                  ])
                  .map((logo, idx) => (
                    <img key={idx} src={logo.src} alt={logo.alt} className="h-14 w-auto object-contain" style={{ minWidth: 120, maxWidth: 180 }} draggable={false} />
                  ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Transformative Healthcare Technology</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">Our platform integrates cutting-edge AI with user-friendly tools to revolutionize patient care.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: IoMdPulse,
                  title: "Real-time Health Monitoring",
                  description: "Continuous tracking of vital signs with AI-powered alerts for anomalies.",
                  color: "text-blue-500",
                },
                {
                  icon: FaRegLightbulb,
                  title: "Predictive Analytics",
                  description: "Anticipate health issues before they occur with our advanced algorithms.",
                  color: "text-yellow-500",
                },
                {
                  icon: RiMentalHealthLine,
                  title: "Mental Health Support",
                  description: "AI-assisted mental health tracking and personalized recommendations.",
                  color: "text-purple-500",
                },
                {
                  icon: FaRegClock,
                  title: "Time-saving Automation",
                  description: "Automate routine tasks so providers can focus on patient care.",
                  color: "text-green-500",
                },
                {
                  icon: FaUserMd,
                  title: "Clinician Decision Support",
                  description: "Evidence-based recommendations at the point of care.",
                  color: "text-red-500",
                },
                {
                  icon: FaRegHospital,
                  title: "Hospital System Integration",
                  description: "Seamless connection with existing healthcare infrastructure.",
                  color: "text-indigo-500",
                },
              ].map((feature, index) => (
                <motion.div key={index} variants={fadeInUp} custom={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className={`text-4xl mb-6 ${feature.color}`}>
                    <feature.icon />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary to-accent text-white">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact in Numbers</h2>
              <p className="text-lg max-w-3xl mx-auto opacity-90">Measurable results that demonstrate our commitment to transforming healthcare.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: FaUsers, value: 50000, label: "Patients Empowered", duration: 2000 },
                { icon: FaUserMd, value: 1200, label: "Healthcare Providers", duration: 1500 },
                { icon: FaDatabase, value: 2500000, label: "Data Points Analyzed", duration: 2500 },
              ].map((stat, index) => (
                <motion.div key={index} variants={scaleIn} className="bg-white/10 backdrop-blur-sm p-8 rounded-xl text-center">
                  <stat.icon className="text-3xl mb-4 mx-auto opacity-90" />
                  <p className="text-4xl md:text-5xl font-bold mb-2">
                    <AnimatedCounter from={0} to={stat.value} duration={stat.duration} />+
                  </p>
                  <p className="text-lg opacity-90">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Healthcare Professionals</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">Hear what our partners and users say about CureWise.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  quote: "CureWise has transformed how we deliver care. The predictive analytics have helped us identify at-risk patients weeks before symptoms appear.",
                  author: "Dr. Sarah Chen",
                  role: "Chief Medical Officer, Boston General",
                  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                },
                {
                  quote: "As a primary care physician, the time savings from automated documentation has given me back hours each week to spend with patients.",
                  author: "Dr. Michael Rodriguez",
                  role: "Family Physician, Austin Health",
                  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                },
              ].map((testimonial, index) => (
                <motion.div key={index} variants={fadeInUp} custom={index} className="bg-gray-50 p-8 rounded-xl">
                  <div className="flex items-start mb-6">
                    <div className="flex-shrink-0 mr-4">
                      <img src={testimonial.avatar} alt={testimonial.author} className="h-12 w-12 rounded-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to revolutionize your healthcare experience?</h2>
              <p className="text-xl text-gray-300 mb-8">Join thousands of healthcare providers and patients transforming care with AI.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                    Get Started for Free
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/contact" className="inline-flex items-center justify-center bg-transparent border-2 border-gray-700 hover:border-gray-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                    Contact Sales
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </motion.main>

      <Footer />
    </div>
  );
};

export default HomePage;

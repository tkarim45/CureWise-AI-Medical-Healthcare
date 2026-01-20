import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { FaHeartbeat, FaBrain, FaLink, FaGlobe, FaUsers, FaShieldAlt, FaChartLine } from "react-icons/fa";
import { FiTarget, FiUserCheck, FiZap } from "react-icons/fi";
import { useEffect, useState } from "react";

const AboutPage = () => {
  // Animation variants
  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.2,
      },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.15,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  const statVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "backOut" },
    },
  };

  // Parallax effects
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 30]);
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);

  // Animated counter
  const AnimatedCounter = ({ from, to, suffix = "" }) => {
    const [count, setCount] = useState(from);
    useEffect(() => {
      const duration = 2000;
      const increment = (to - from) / (duration / 16);
      const interval = setInterval(() => {
        setCount((prev) => {
          const next = prev + increment;
          return next >= to ? to : Math.round(next);
        });
      }, 16);
      return () => clearInterval(interval);
    }, [to]);
    return (
      <span>
        {count}
        {suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <NavBar />

      <main className="flex-grow">
        {/* Hero Section */}
        <motion.section className="relative py-24 px-6 text-center bg-gradient-to-br from-bgLight to-secondary/50 overflow-hidden" initial="hidden" animate="visible" variants={heroVariants}>
          <motion.div
            className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwZWE1ZTkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0xMiAwYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMHptLTI0IDBhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0xMiAwYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMHptMTItMTJhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0tMjQgMGEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6bTEyIDBhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0xMi0xMmEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6bS0yNCAwYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMHptMTIgMGEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6Ii8+PC9nPjwvZz48L3N2Zz4=')]"
            style={{ y: y1 }}
          />

          <motion.div className="relative z-10 max-w-4xl mx-auto">
            <motion.div variants={fadeIn}>
              <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-4">Transforming Healthcare</span>
            </motion.div>

            <motion.h1 className="text-4xl md:text-6xl font-bold text-text mb-6 leading-tight" variants={fadeIn}>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CureWise</span> <br />
              Where Technology Meets Compassion
            </motion.h1>

            <motion.p className="text-xl text-text/80 max-w-2xl mx-auto mb-8" variants={fadeIn}>
              We're revolutionizing healthcare through intelligent systems that connect patients, providers, and data for better outcomes.
            </motion.p>

            <motion.div variants={fadeIn}>
              <Link to="/signup" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/30">
                Join Our Mission
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Story Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} viewport={{ once: true, margin: "-100px" }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-xl rotate-1"></div>
                <div className="relative bg-gradient-to-br from-secondary to-white p-1 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center relative">
                    <FaHeartbeat className="text-6xl text-primary opacity-30 absolute left-4 top-4 z-0" />
                    {/* Medical image illustration */}
                    <img src="https://www.mpo-mag.com/wp-content/uploads/sites/7/2024/08/872_main-4.jpg" alt="Medical team" className="rounded-lg shadow-lg w-full h-full object-cover z-10 relative" style={{ maxHeight: 260 }} />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} viewport={{ once: true, margin: "-100px" }}>
              <span className="text-sm font-semibold text-primary">OUR STORY</span>
              <h2 className="text-3xl font-bold text-text mt-2 mb-6">Born from a Vision of Connected Care</h2>
              <p className="text-text/80 mb-4">Founded in 2020 by a team of healthcare professionals and AI researchers, CureWise emerged from a shared frustration with fragmented healthcare systems.</p>
              <p className="text-text/80 mb-6">We saw how disconnected data, delayed diagnoses, and inefficient communication were compromising patient care. Our mission is to bridge these gaps through intelligent technology.</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: FiTarget, text: "Mission-Driven" },
                  { icon: FiUserCheck, text: "Patient-First" },
                  { icon: FiZap, text: "Innovation Focused" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text">
                    <item.icon className="text-primary" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-20 bg-gradient-to-br from-secondary to-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-semibold text-primary">WHY CHOOSE US</span>
              <h2 className="text-3xl font-bold text-text mt-2 mb-4">The CureWise Difference</h2>
              <p className="text-text/80 max-w-2xl mx-auto">We combine cutting-edge technology with deep healthcare expertise to deliver solutions that truly make a difference.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: FaBrain,
                  title: "AI-Powered Precision",
                  desc: "Our proprietary algorithms deliver diagnostic accuracy that outperforms traditional methods.",
                },
                {
                  icon: FaLink,
                  title: "Seamless Integration",
                  desc: "Works with your existing systems and devices for minimal disruption.",
                },
                {
                  icon: FaShieldAlt,
                  title: "Uncompromising Security",
                  desc: "Enterprise-grade encryption and compliance with global healthcare standards.",
                },
                {
                  icon: FaChartLine,
                  title: "Actionable Insights",
                  desc: "Transform raw data into clear, clinically relevant recommendations.",
                },
                {
                  icon: FaUsers,
                  title: "Collaborative Care",
                  desc: "Connects entire care teams around each patient's unique needs.",
                },
                {
                  icon: FaHeartbeat,
                  title: "Continuous Monitoring",
                  desc: "24/7 health tracking with intelligent alerting for early intervention.",
                },
              ].map((item, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" variants={cardVariants} viewport={{ once: true, margin: "-50px" }} whileHover={{ y: -5 }} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <item.icon className="text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-3">{item.title}</h3>
                  <p className="text-text/70">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-primary text-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-semibold text-white/80">BY THE NUMBERS</span>
              <h2 className="text-3xl font-bold mt-2 mb-4">Proven Impact at Scale</h2>
              <p className="text-white/80 max-w-2xl mx-auto">Our solutions are transforming healthcare delivery across the globe.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: 50, suffix: "+", label: "Countries Served", icon: FaGlobe },
                { value: 2000, suffix: "+", label: "Partner Institutions", icon: FaUsers },
                { value: 98.7, suffix: "%", label: "Diagnostic Accuracy", icon: FaBrain },
                { value: 100000, suffix: "+", label: "Lives Impacted", icon: FaHeartbeat },
              ].map((stat, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" variants={statVariants} viewport={{ once: true }} className="text-center bg-white/10 p-8 rounded-xl backdrop-blur-sm">
                  <stat.icon className="text-3xl mb-4 mx-auto text-white/80" />
                  <p className="text-4xl font-bold mb-2">
                    <AnimatedCounter from={0} to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-white/80">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Principles */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-semibold text-primary">OUR CULTURE</span>
              <h2 className="text-3xl font-bold text-text mt-2 mb-4">Guided by Purpose</h2>
              <p className="text-text/80 max-w-2xl mx-auto">These principles shape every decision we make and every solution we build.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Patient First",
                  desc: "Every line of code we write ultimately serves real people with real healthcare needs.",
                },
                {
                  title: "Evidence-Based",
                  desc: "Our AI models are trained on rigorously validated medical data and research.",
                },
                {
                  title: "Ethical AI",
                  desc: "We proactively address bias and ensure our systems are fair and transparent.",
                },
                {
                  title: "Continuous Learning",
                  desc: "We evolve with the healthcare landscape to deliver ever-better solutions.",
                },
              ].map((principle, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" variants={cardVariants} viewport={{ once: true, margin: "-50px" }} className="border border-secondary rounded-xl p-6 hover:border-primary/30 transition-colors">
                  <h3 className="text-xl font-semibold text-text mb-3 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">{i + 1}</span>
                    {principle.title}
                  </h3>
                  <p className="text-text/70">{principle.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section className="py-20 px-6 bg-gradient-to-r from-primary to-accent text-white" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Healthcare Together?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">Whether you're a provider, researcher, or healthcare organization, we'd love to explore how we can collaborate.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact" className="px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg">
                Contact Our Team
              </Link>
              <Link to="/demo" className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Request a Demo
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;

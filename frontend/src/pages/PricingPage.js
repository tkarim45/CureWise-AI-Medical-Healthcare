import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { FaCheck, FaHeartbeat, FaUserMd, FaHospital, FaShieldAlt } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

const PricingPage = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.15,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
    hover: {
      y: -10,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  // Parallax effect
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      description: "Essential health monitoring for individuals",
      cta: "Get started",
      featured: false,
      features: ["Basic health insights", "Limited chatbot access", "Community support", "Basic symptom checker"],
      buttonVariant: "outline",
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "For health-conscious individuals & freelancers",
      cta: "Start free trial",
      featured: true,
      features: ["Advanced health analytics", "Unlimited chatbot access", "Priority email support", "Wearable integration", "Personalized recommendations", "Health trend reports"],
      buttonVariant: "primary",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For clinics, hospitals & organizations",
      cta: "Contact sales",
      featured: false,
      features: ["All Professional features", "Dedicated account manager", "API access", "Custom integrations", "Team management", "HIPAA compliance", "Advanced security"],
      buttonVariant: "outline",
    },
  ];

  const features = [
    {
      icon: FaHeartbeat,
      title: "AI-Powered Diagnostics",
      description: "Our algorithms provide accurate preliminary assessments",
    },
    {
      icon: FaUserMd,
      title: "Clinician Collaboration",
      description: "Seamless sharing with your healthcare providers",
    },
    {
      icon: FaHospital,
      title: "Institutional Integration",
      description: "Works with major EHR systems and hospital networks",
    },
    {
      icon: FaShieldAlt,
      title: "Enterprise Security",
      description: "Military-grade encryption and compliance certifications",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50">
      <NavBar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 px-6 overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwZWE1ZTkiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0xMiAwYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMHptLTI0IDBhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0xMiAwYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMHptMTItMTJhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0tMjQgMGEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6bTEyIDBhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwem0xMi0xMmEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6bS0yNCAwYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMHptMTIgMGEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDB6Ii8+PC9nPjwvZz48L3N2Zz4=')]"
            style={{ y: y1 }}
          />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center mb-12">
              <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full mb-4">SIMPLE, TRANSPARENT PRICING</span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Choose the Right Plan for <span className="text-primary">Your Needs</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Whether you're an individual or healthcare organization, we have a solution tailored for you.</p>
            </motion.div>

            {/* Toggle for annual/monthly */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex justify-center mb-16">
              <div className="inline-flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                <button className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50">Monthly</button>
                <button className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white">Annual (Save 20%)</button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-10 px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" variants={cardVariants} whileHover="hover" viewport={{ once: true, margin: "-100px" }} className={`relative rounded-xl overflow-hidden ${plan.featured ? "border-2 border-primary shadow-xl" : "border border-gray-200 shadow-lg"}`}>
                {plan.featured && <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">MOST POPULAR</div>}

                <div className="p-8 bg-white">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start">
                        <FaCheck className="text-primary mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.cta === "Contact sales" ? "/contact" : "/signup"} className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${plan.buttonVariant === "primary" ? "bg-primary text-white hover:bg-primary/90" : "border-2 border-primary text-primary hover:bg-primary/10"}`}>
                    {plan.cta}
                    {plan.cta !== "Contact sales" && <FiArrowRight className="inline ml-2" />}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Feature Comparison</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">See how our plans stack up against each other</p>
            </motion.div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">Features</th>
                    <th className="py-4 px-6 text-center font-semibold text-gray-700">Starter</th>
                    <th className="py-4 px-6 text-center font-semibold text-gray-700 bg-primary/10">Professional</th>
                    <th className="py-4 px-6 text-center font-semibold text-gray-700">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["AI Health Insights", "Basic", "Advanced", "Advanced+"],
                    ["Chatbot Access", "Limited", "Unlimited", "Unlimited"],
                    ["Support", "Community", "Email", "24/7 Priority"],
                    ["Integrations", "None", "Basic", "Custom"],
                    ["Users", "1", "1", "Unlimited"],
                    ["Security", "Standard", "Enhanced", "Enterprise"],
                  ].map(([feature, ...plans], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-4 px-6 text-gray-700 font-medium">{feature}</td>
                      {plans.map((plan, j) => (
                        <td key={j} className={`py-4 px-6 text-center ${j === 1 ? "bg-primary/5" : ""}`}>
                          {plan === "None" ? <span className="text-gray-400">—</span> : <span className="text-gray-700">{plan}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features Across All Plans</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Every HealthSync AI plan includes these core capabilities</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" variants={cardVariants} viewport={{ once: true }} className="bg-gray-50 p-6 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <feature.icon className="text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to know about our plans</p>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  question: "Can I switch plans later?",
                  answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated based on your billing cycle.",
                },
                {
                  question: "Is there a free trial?",
                  answer: "The Professional plan comes with a 14-day free trial. No credit card required to try our Starter plan.",
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards (Visa, Mastercard, American Express) as well as PayPal. Enterprise plans can be invoiced.",
                },
                {
                  question: "How does billing work?",
                  answer: "Plans are billed monthly or annually in advance. You'll receive a receipt via email for each payment.",
                },
              ].map((faq, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" variants={cardVariants} viewport={{ once: true }} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary to-accent text-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 className="text-3xl font-bold mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Ready to Transform Your Healthcare Experience?
            </motion.h2>
            <motion.p className="text-xl mb-8 max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}>
              Join thousands of users and healthcare providers using HealthSync AI today.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                Get Started Free
              </Link>
              <Link to="/demo" className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Schedule a Demo
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;

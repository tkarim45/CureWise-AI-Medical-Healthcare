import { motion } from "framer-motion";
import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";
import { FaSearch, FaTag, FaCalendarAlt, FaArrowRight } from "react-icons/fa";
import { IoMdTrendingUp } from "react-icons/io";

const BlogPage = () => {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
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

  // Dummy blog posts
  const featuredPost = {
    title: "AI in Healthcare: Revolutionizing Patient Care",
    excerpt: "Discover how artificial intelligence is enhancing diagnostics, personalizing treatments, and improving patient outcomes in modern medicine.",
    date: "March 15, 2025",
    category: "AI Technology",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  };

  const blogPosts = [
    {
      title: "The Future of Wearable Health Tech with AI",
      excerpt: "Explore how HealthSync AI integrates with wearable devices to provide real-time health insights and proactive care solutions.",
      date: "March 10, 2025",
      category: "Wearable Tech",
      readTime: "4 min read",
    },
    {
      title: "Ethical Considerations in AI-Driven Medicine",
      excerpt: "A deep dive into the ethical challenges and responsibilities of deploying AI in healthcare settings.",
      date: "March 5, 2025",
      category: "Ethics in AI",
      readTime: "6 min read",
    },
    {
      title: "Machine Learning Models for Early Disease Detection",
      excerpt: "How predictive algorithms are transforming early diagnosis and preventive healthcare strategies.",
      date: "February 28, 2025",
      category: "AI Technology",
      readTime: "7 min read",
    },
    {
      title: "Personalized Medicine: The AI Approach",
      excerpt: "Understanding how AI enables truly personalized treatment plans based on genetic and lifestyle factors.",
      date: "February 22, 2025",
      category: "Healthcare Innovation",
      readTime: "5 min read",
    },
  ];

  const popularTags = [
    { name: "AI Diagnostics", count: 24 },
    { name: "Telemedicine", count: 18 },
    { name: "Neural Networks", count: 15 },
    { name: "Health Data", count: 12 },
    { name: "Predictive Analytics", count: 9 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      {/* Hero Section */}
      <motion.main className="flex-grow" initial="hidden" animate="visible" variants={containerVariants}>
        <section className="relative py-24 px-6 bg-gradient-to-br from-primary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-10"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div variants={fadeInUp}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Insights from the <br className="hidden md:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">HealthSync AI Team</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto mb-8">Expert perspectives on AI, healthcare innovation, and the future of medicine.</p>
              <div className="relative max-w-xl mx-auto">
                <input type="text" placeholder="Search articles, topics, or keywords..." className="w-full p-4 pl-12 pr-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-gray-200" />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-200" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={fadeInUp}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
                <IoMdTrendingUp className="text-primary mr-2" />
                Featured Article
              </h2>
            </motion.div>

            <motion.article variants={scaleIn} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-8 md:w-1/2">
                  <div className="flex items-center mb-4">
                    <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">{featuredPost.category}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-500 text-sm flex items-center">
                      <FaCalendarAlt className="mr-1" /> {featuredPost.date}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{featuredPost.title}</h3>
                  <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{featuredPost.readTime}</span>
                    <motion.a href="#" className="text-primary font-medium flex items-center group" whileHover={{ x: 5 }}>
                      Read full article
                      <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        {/* Blog Content */}
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
            {/* Main Content */}
            <div className="lg:w-2/3">
              <motion.div variants={fadeInUp}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-8">Latest Articles</h2>
              </motion.div>

              <motion.div className="grid md:grid-cols-2 gap-8" variants={containerVariants}>
                {blogPosts.map((post, index) => (
                  <motion.article key={index} variants={fadeInUp} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">{post.category}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-500 text-xs flex items-center">
                          <FaCalendarAlt className="mr-1" /> {post.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                        <motion.a href="#" className="text-primary text-sm font-medium flex items-center group" whileHover={{ x: 3 }}>
                          Read more
                          <FaArrowRight className="ml-1 text-xs group-hover:translate-x-1 transition-transform" />
                        </motion.a>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>

              {/* Pagination */}
              <motion.div variants={fadeInUp} className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button className="px-4 py-2 rounded-lg bg-primary text-white font-medium">1</button>
                  <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">2</button>
                  <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">3</button>
                  <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Next</button>
                </nav>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3">
              <motion.aside variants={fadeInUp}>
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                  <ul className="space-y-3">
                    {["AI Technology", "Healthcare Innovation", "Wearable Tech", "Ethics in AI", "Patient Data"].map((category, index) => (
                      <li key={index}>
                        <a href="#" className="flex items-center justify-between text-gray-700 hover:text-primary transition-colors">
                          <div className="flex items-center">
                            <FaTag className="text-primary/70 mr-2 text-sm" />
                            <span>{category}</span>
                          </div>
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">24</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag, index) => (
                      <a key={index} href="#" className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">
                        {tag.name}
                        <span className="ml-1 text-xs text-gray-500">{tag.count}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary to-accent p-6 rounded-xl shadow-md text-white">
                  <h3 className="text-lg font-semibold mb-3">Subscribe to our newsletter</h3>
                  <p className="text-sm text-white/80 mb-4">Get the latest articles and news delivered to your inbox.</p>
                  <div className="flex">
                    <input type="email" placeholder="Your email address" className="flex-grow px-4 py-2 rounded-l-lg text-gray-900 focus:outline-none" />
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-r-lg hover:bg-gray-800 transition-colors">Subscribe</button>
                  </div>
                </div>
              </motion.aside>
            </div>
          </div>
        </section>
      </motion.main>

      <Footer />
    </div>
  );
};

export default BlogPage;

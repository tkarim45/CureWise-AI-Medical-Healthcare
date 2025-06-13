import React, { useEffect, useState } from "react";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FaHeartbeat, FaWeight, FaTint, FaChartLine, FaRunning, FaBed, FaAppleAlt } from "react-icons/fa";
import { IoMdTrendingUp, IoMdTrendingDown } from "react-icons/io";
import { BsDropletHalf, BsLightningFill } from "react-icons/bs";
import { FiAlertTriangle } from "react-icons/fi";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

const API_URL = process.env.REACT_APP_API_URL;

const HealthAnalyticsPage = () => {
  const { user, token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [activeMetric, setActiveMetric] = useState("heartRate");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/health-analytics?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, token, timeRange]);

  const MetricCard = ({ icon, title, value, unit, trend, change, onClick }) => {
    if (value === undefined || trend === undefined || change === undefined) return null;

    const TrendIcon = trend === "up" ? IoMdTrendingUp : IoMdTrendingDown;
    const trendColor = trend === "up" ? "text-red-500" : "text-green-500";

    return (
      <motion.div whileHover={{ y: -5 }} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 cursor-pointer transition-all ${trend === "up" ? "border-red-400" : "border-green-400"} ${activeMetric === title.toLowerCase().replace(/\s+/g, "") ? "ring-2 ring-blue-400" : ""}`} onClick={onClick}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg mr-3 ${trend === "up" ? "bg-red-50" : "bg-green-50"}`}>{icon}</div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">{title}</h3>
              <div className="flex items-end">
                <span className="text-2xl font-bold text-gray-800 mr-1">{value}</span>
                <span className="text-sm text-gray-400">{unit}</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="mr-1" />
            {change}%
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMainChart = () => {
    if (!analytics?.trends?.[activeMetric]) return null;

    const data = analytics.trends[activeMetric].map((item, index) => ({
      name: timeRange === "week" ? `Day ${index + 1}` : `Week ${index + 1}`,
      value: item,
    }));

    const getChartColor = () => {
      switch (activeMetric) {
        case "heartRate":
          return "#ef4444";
        case "weight":
          return "#10b981";
        case "bloodPressure":
          return "#3b82f6";
        case "bloodSugar":
          return "#8b5cf6";
        default:
          return "#3b82f6";
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-5 h-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 capitalize">{activeMetric.replace(/([A-Z])/g, " $1")} Trend</h3>
          <div className="flex space-x-2">
            <button onClick={() => setTimeRange("week")} className={`px-3 py-1 text-xs rounded-full ${timeRange === "week" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>
              1W
            </button>
            <button onClick={() => setTimeRange("month")} className={`px-3 py-1 text-xs rounded-full ${timeRange === "month" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>
              1M
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                background: "#fff",
              }}
              formatter={(value) => [`${value} ${getUnit(activeMetric)}`, activeMetric.replace(/([A-Z])/g, " $1")]}
            />
            <Line type="monotone" dataKey="value" stroke={getChartColor()} strokeWidth={3} dot={{ r: 4, fill: getChartColor() }} activeDot={{ r: 6, stroke: getChartColor(), strokeWidth: 2, fill: "#fff" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const getUnit = (metric) => {
    switch (metric) {
      case "heartRate":
        return "bpm";
      case "weight":
        return "kg";
      case "bloodPressure":
        return "mmHg";
      case "bloodSugar":
        return "mg/dL";
      default:
        return "";
    }
  };

  const renderActivityChart = () => {
    if (!analytics?.activity) return null;

    const data = [
      { name: "Steps", value: analytics.activity.steps || 0, goal: 10000, fill: "#8b5cf6" },
      { name: "Sleep", value: analytics.activity.sleepHours || 0, goal: 8, fill: "#3b82f6" },
      { name: "Water", value: analytics.activity.waterIntake || 0, goal: 8, fill: "#0ea5e9" },
      { name: "Calories", value: analytics.activity.caloriesBurned || 0, goal: 2000, fill: "#ef4444" },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm p-5 h-80">
        <h3 className="font-semibold text-gray-800 mb-4">Daily Activity</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name) => [`${value} ${name === "Sleep" ? "hrs" : name === "Water" ? "glasses" : ""}`, name]}
            />
            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} background={{ fill: "#f3f4f6", radius: [4, 4, 0, 0] }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSleepQualityChart = () => {
    if (!analytics?.sleepQuality) return null;

    const data = [{ name: "Quality", value: analytics.sleepQuality, fill: "#3b82f6" }];

    return (
      <div className="bg-white rounded-xl shadow-sm p-5 h-full">
        <h3 className="font-semibold text-gray-800 mb-4">Sleep Quality</h3>
        <ResponsiveContainer width="100%" height={150}>
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={10} fill="#3b82f6" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
              {analytics.sleepQuality}%
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="text-center text-sm text-gray-500 mt-2">{analytics.sleepQuality >= 80 ? "Excellent" : analytics.sleepQuality >= 60 ? "Good" : "Needs Improvement"}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-25">
      <NavBar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FaChartLine className="text-xl" />
            </div>
            <span>Health Analytics Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-2">Track and analyze your health metrics over time</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : !analytics ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No analytics data available.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {analytics.heartRate && <MetricCard icon={<FaHeartbeat className="text-red-500 text-xl" />} title="Heart Rate" value={analytics.heartRate.current} unit="bpm" trend={analytics.heartRate.trend} change={analytics.heartRate.change} onClick={() => setActiveMetric("heartRate")} />}
              {analytics.weight && <MetricCard icon={<FaWeight className="text-green-500 text-xl" />} title="Weight" value={analytics.weight.current} unit="kg" trend={analytics.weight.trend} change={analytics.weight.change} onClick={() => setActiveMetric("weight")} />}
              {analytics.bloodPressure && <MetricCard icon={<BsDropletHalf className="text-blue-500 text-xl" />} title="Blood Pressure" value={analytics.bloodPressure.current} unit="mmHg" trend={analytics.bloodPressure.trend} change={analytics.bloodPressure.change} onClick={() => setActiveMetric("bloodPressure")} />}
              {analytics.bloodSugar && <MetricCard icon={<FaTint className="text-purple-500 text-xl" />} title="Blood Sugar" value={analytics.bloodSugar.current} unit="mg/dL" trend={analytics.bloodSugar.trend} change={analytics.bloodSugar.change} onClick={() => setActiveMetric("bloodSugar")} />}
            </div>

            {/* Main Chart and Sleep Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">{renderMainChart()}</div>
              <div>{renderSleepQualityChart()}</div>
            </div>

            {/* Activity and Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderActivityChart()}

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <BsLightningFill className="text-yellow-500" />
                  Health Insights & Recommendations
                </h3>
                <div className="space-y-5">
                  {analytics.heartRate && (
                    <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <FaHeartbeat className="text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Cardiovascular Health</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Your average heart rate is {analytics.heartRate.current} bpm.
                          {analytics.heartRate.current > 80 ? " Consider adding 30 minutes of cardio 3-4 times per week." : " This is within the healthy range. Keep it up!"}
                        </p>
                      </div>
                    </div>
                  )}

                  {analytics.bloodSugar && (
                    <div className="flex items-start p-3 bg-green-50 rounded-lg">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <FaAppleAlt className="text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Nutrition</h4>
                        <p className="text-sm text-gray-600 mt-1">{analytics.bloodSugar.current > 120 ? "Your blood sugar levels are slightly elevated. Reduce sugar intake and increase fiber." : "Your blood sugar levels are optimal. Maintain your balanced diet with plenty of vegetables."}</p>
                      </div>
                    </div>
                  )}

                  {analytics.activity && (
                    <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                      <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <FaRunning className="text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Activity Level</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          You're averaging {analytics.activity.steps || 0} steps daily.
                          {analytics.activity.steps < 8000 ? " Try to reach 10,000 steps for optimal health." : " Great job maintaining an active lifestyle!"}
                        </p>
                      </div>
                    </div>
                  )}

                  {analytics.activity && (
                    <div className="flex items-start p-3 bg-red-50 rounded-lg">
                      <div className="bg-red-100 p-2 rounded-lg mr-3">
                        <FaBed className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Sleep Patterns</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          You're getting {analytics.activity.sleepHours || 0} hours of sleep.
                          {analytics.activity.sleepHours < 7 ? " Aim for 7-9 hours for better recovery and cognitive function." : " This is within the recommended range."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default HealthAnalyticsPage;

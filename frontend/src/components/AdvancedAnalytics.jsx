import React, { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "../lib/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedBloodType, setSelectedBloodType] = useState("all");

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedBloodType]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/advanced-analytics?timeRange=${timeRange}&bloodType=${selectedBloodType}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center text-gray-600">No data available</div>;
  }

  const demandTrendData = {
    labels: analyticsData.demandTrend?.labels || [],
    datasets: [
      {
        label: "Blood Demand",
        data: analyticsData.demandTrend?.data || [],
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
      },
      {
        label: "Available Donors",
        data: analyticsData.supplyTrend?.data || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const geographicDistributionData = {
    labels: analyticsData.geographicDistribution?.labels || [],
    datasets: [
      {
        label: "Donors by Region",
        data: analyticsData.geographicDistribution?.data || [],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
      },
    ],
  };

  const emergencyResponseData = {
    labels: ["Critical", "Urgent", "Normal"],
    datasets: [
      {
        data: [
          analyticsData.emergencyStats?.critical || 0,
          analyticsData.emergencyStats?.urgent || 0,
          analyticsData.emergencyStats?.normal || 0,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Analytics Dashboard</h2>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <select
            value={selectedBloodType}
            onChange={(e) => setSelectedBloodType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Blood Types</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Donations</h3>
            <p className="text-3xl font-bold text-red-600">{analyticsData.totalDonations || 0}</p>
            <p className="text-sm text-gray-500">This period</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Active Donors</h3>
            <p className="text-3xl font-bold text-green-600">{analyticsData.activeDonors || 0}</p>
            <p className="text-sm text-gray-500">Currently available</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Emergency Requests</h3>
            <p className="text-3xl font-bold text-orange-600">{analyticsData.emergencyRequests || 0}</p>
            <p className="text-sm text-gray-500">This period</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Response Time</h3>
            <p className="text-3xl font-bold text-blue-600">{analyticsData.avgResponseTime || 0}m</p>
            <p className="text-sm text-gray-500">Average</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Demand vs Supply Trend */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Demand vs Supply Trend</h3>
            <Line
              data={demandTrendData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Geographic Distribution</h3>
            <Bar
              data={geographicDistributionData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        {/* Emergency Response Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Emergency Response Distribution</h3>
          <div className="max-w-md mx-auto">
            <Doughnut
              data={emergencyResponseData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" },
                },
              }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">AI-Generated Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-green-600">Positive Trends</h4>
              <ul className="text-sm text-gray-600 mt-2">
                {analyticsData.insights?.positive?.map((insight, index) => (
                  <li key={index} className="mb-1">• {insight}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-red-600">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 mt-2">
                {analyticsData.insights?.improvements?.map((insight, index) => (
                  <li key={index} className="mb-1">• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 
import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import axios from "../lib/axios";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const BloodStats = () => {
  const [data, setData] = useState([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/admin/blood-stats");
        setData(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div></div>;
  if (error) return <div className="flex items-center justify-center h-screen"><p className="text-3xl">{error}</p></div>;

  // Render Pie Chart for Selected Blood Group
  const renderPieChart = () => {
    if (!selectedBloodGroup) return <p className="text-center text-2xl">Select a blood type to view details.</p>;

    const groupData = data.find((item) => item._id === selectedBloodGroup);

    if (!groupData)
      return <p className="text-center text-2xl">No data available for the selected blood group.</p>;

    const pieData = {
      labels: ["Donors", "Recipients"],
      datasets: [
        {
          data: [groupData.totalDonors, groupData.totalRecipients],
          backgroundColor: [
            "rgba(255, 159, 64, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
        },
      ],
    };

    return (
      <div className="flex flex-col items-center md:flex-row md:justify-between md:space-x-4 md:space-y-0 space-y-4">
        <h3 className="text-2xl font-bold">{selectedBloodGroup} Breakdown</h3>
        <div className="flex-1 max-w-xs">
          <Pie
            data={pieData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
            }}
          />
        </div>
        <div className="text-center">
          <p className="font-bold text-2xl">Total Users: {groupData.totalUsers}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto md:px-8">
      <h2 className="text-3xl font-bold text-center mb-4">Blood Type Statistics</h2>
      {/* Dropdown to select a blood type */}
      <div className="flex flex-col items-center md:flex-row md:justify-between md:space-x-4 md:space-y-0 space-y-4">
        <label htmlFor="bloodGroupSelect" className="text-lg">
          Select Blood Group:
        </label>
        <select
          id="bloodGroupSelect"
          onChange={(e) => setSelectedBloodGroup(e.target.value)}
          className="py-2 px-4 border-2 border-gray-300 rounded-md w-full sm:max-w-xs md:w-auto"
        >
          <option value="">-- Select --</option>
          {data.map((item) => (
            <option key={item._id} value={item._id}>
              {item._id}
            </option>
          ))}
        </select>
      </div>
      {/* Pie Chart */}
      {renderPieChart()}
    </div>
  );
};

export default BloodStats;


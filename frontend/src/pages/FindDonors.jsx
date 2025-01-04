import React, { useState } from "react";
import { useBloodStore } from "../store/useBloodStore";
import BloodDonorCard from "../components/BloodDonorCard";
import { useUserStore } from "../store/useUserStore";
import { Link } from "react-router-dom";

const FindDonors = () => {
  const [distance, setDistance] = useState("");
  const [bloodType, setBloodType] = useState("");
  const { user } = useUserStore();
  const { findDonors, searching, donors } = useBloodStore();

  const handleSearch = (e) => {
    e.preventDefault();
    findDonors(bloodType, distance);
  };

  return (
    <>
      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-8">
          <h2 className="text-2xl font-semibold text-center text-red-600 mb-4">
            Find Donor
          </h2>
          <form onSubmit={handleSearch}>
            <div className="mb-4">
              <label
                htmlFor="distance"
                className="block text-gray-700 font-medium mb-2"
              >
                Distance (in km):
              </label>
              <input
                type="number"
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="Enter distance"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="bloodType"
                className="block text-gray-700 font-medium mb-2"
              >
                Blood Type:
              </label>
              <select
                id="bloodType"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Select blood type</option>
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
            <div className="text-center">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold text-center text-red-600 mb-4">
            Please login to search for donors based on your location
          </h2>
          <Link to="/login">
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Login
            </button>
          </Link>
        </div>
      )}
      {donors?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {donors.map((donor) => (
            <BloodDonorCard donor={donor} key={donor._id} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 mt-8">No donors found.</p>
      )}
    </>
  );
};

export default FindDonors;


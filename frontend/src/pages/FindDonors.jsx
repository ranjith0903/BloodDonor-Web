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
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Privacy Protected</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Donor contact information is protected. Click "Request Contact" to send a secure request. Donors will only share their contact details after approving your request.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {donors.map((donor) => (
              <BloodDonorCard donor={donor} key={donor._id} />
            ))}
          </div>
        </>
      ) : donors && donors.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8 max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Available Donors Found</h3>
          <p className="text-yellow-700 mb-4">
            No donors are currently available for {bloodType} blood type within {distance}km of your location.
          </p>
          <div className="text-sm text-yellow-600">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="mt-2 space-y-1">
              <li>• Try increasing the search distance</li>
              <li>• Check if donors have set themselves as available</li>
              <li>• Consider other blood types that are compatible</li>
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FindDonors;


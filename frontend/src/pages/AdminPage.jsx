import React, { useEffect } from 'react';
import { FaUser, FaList, FaDonate } from 'react-icons/fa';
import { useAdminStore } from '../store/useAdminStore';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const { loading, treceivers, getTreceivers, tdonors, getTdonors, tcampaigns, tusers, getTusers, getTcampaigns } = useAdminStore();

  useEffect(() => {
    getTusers();
    getTcampaigns();
    getTdonors();
    getTreceivers();
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="py-20 bg-gray-100">
      <div className="container mx-auto px-6 md:px-12">
        <h2 className="text-3xl font-bold text-center mb-6">Admin Dashboard</h2>
        <div className="flex flex-wrap justify-center md:flex-nowrap md:space-x-6">
          <div className="w-full md:w-1/4 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <FaUser className="h-12 w-12 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">Total Users</h3>
                <p className="text-gray-600">{tusers}</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/4 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <FaList className="h-12 w-12 text-green-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">Total Campaigns</h3>
                <p className="text-gray-600">{tcampaigns}</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/4 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <FaDonate className="h-12 w-12 text-red-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">Total Recipients</h3>
                <p className="text-gray-600">{treceivers}</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/4 bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <FaDonate className="h-12 w-12 text-red-600" />
              <div className="ml-4">
                <h3 className="text-2xl font-bold">Total Donors</h3>
                <p className="text-gray-600">{tdonors}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-10 space-x-4 flex-wrap md:flex-nowrap">
          <Link to="/deleteuser">
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto mb-4 md:mb-0">
              Delete User
            </button>
          </Link>
          <Link to='/deletecampaign'>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto mb-4 md:mb-0">
              Delete Campaign
            </button>
          </Link>
          <Link to="/bloodstats">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto">
              Blood Group Stats
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;


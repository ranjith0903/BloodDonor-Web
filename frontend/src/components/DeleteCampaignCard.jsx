import React from "react";
import { useState } from "react";
import axios from "../lib/axios";
import { useAdminStore } from "../store/useAdminStore";
import LoadingSpinner from "./LoadingSpinner";

const DeleteCampaignCard = ({ campaign }) => {
  const { deleteCampaign, loading } = useAdminStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onDelete = async (id) => {
    deleteCampaign(id);
    setIsModalOpen(false);
    

   
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 md:p-8">
      <div className="flex items-center border-b border-gray-200 pb-4">
        <img
          src={"https://via.placeholder.com/150"}
          alt="profile picture"
          className="w-12 h-12 rounded-full mr-4"
        />
        <div className="flex-1">
          <h2 className="text-lg font-bold">{campaign.campaignName}</h2>
          <p className="text-sm text-gray-600">
            Date: {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(campaign.date))}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm">
          <strong>Phone Number:</strong> {campaign.organizerContactNumber}
        </p>
        <p className="text-sm">
          <strong>Address:</strong> {campaign.streetAddress}, {campaign.city}, {campaign.state}, {campaign.country}, {campaign.pincode}
        </p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleModalOpen}
        >
          Delete
        </button>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow max-w-sm w-full">
            <h2 className="text-sm font-semibold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(campaign._id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteCampaignCard;


import React from "react";
import { useState } from "react";
import axios from "../lib/axios";
import { useAdminStore } from "../store/useAdminStore";

const DeleteCard = ({ user}) => {
  const {deleteUser,loading} = useAdminStore();
 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fullName, email, phoneNumber, bloodType, available } = user;
  const onDelete=async(id)=>{
 
    deleteUser(id);
    

    setIsModalOpen(false);
    
 
  
}
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center border-b border-gray-200 pb-6">
        <img
          src={"https://via.placeholder.com/150"}
          alt="profile picture"
          className="w-20 h-20 rounded-full mr-4"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{fullName}</h2>
          <p className="text-lg text-gray-600">Blood Type: {bloodType}</p>
          <p className="text-lg text-gray-600">Email: {email}</p>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-lg">
          <strong>Phone Number:</strong> {phoneNumber}
        </p>
        <p className="text-lg">
          <strong>Availability:</strong>
          <span
            className={`px-2 py-1 rounded-full ${
              available ? "bg-green-200" : "bg-red-200"
            }`}
          >
            {available ? "Available" : "Not Available"}
          </span>
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() =>setIsModalOpen(true) }
        >
          Delete
        </button>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={()=>onDelete(user._id)}
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

export default DeleteCard;

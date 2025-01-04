import React from "react";

const BloodDonorCard = ({ donor }) => {
  const { bloodType, phoneNumber, fullName, available,profilePicture} = donor;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-sm mx-auto">
      <div className="flex flex-col md:flex-row items-center border-b border-gray-200 pb-4 md:pb-6">
        <img
          src={profilePicture || "https://via.placeholder.com/150"}
          alt="profile picture"
          className="w-16 h-16 md:w-20 md:h-20 rounded-full mb-4 md:mb-0 md:mr-4"
        />
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold">{fullName}</h2>
          <p className="text-md md:text-lg text-gray-600">Blood Type: {bloodType}</p>
        </div>
      </div>
      <div className="mt-4 md:mt-6 text-center md:text-left">
        <p className="text-md md:text-lg">
          <strong>Phone Number:</strong> {phoneNumber}
        </p>
        <p className="text-md md:text-lg mt-2">
          <strong>Availability:</strong>
          <span className={`px-2 py-1 rounded-full ${available ? "bg-green-200" : "bg-red-200"}`}>
            {available ? "Available" : "Not Available"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default BloodDonorCard;


import React from "react";

export const CampaignCard = ({ campaign }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 m-4 w-full sm:w-96">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">{campaign.campaignName}</h2>
        <p className="text-sm text-gray-600">{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(campaign.date))}</p>
      </div>
      <div className="text-gray-700 space-y-2">
        <p>
          <strong>Organizer:</strong>{campaign.organizerName}
        </p>
        <p>
          <strong>Email:</strong>{campaign.organizerEmail}
        </p>
        <p>
          <strong>Contact:</strong> {campaign.organizerContactNumber}
        </p>
        <p>
          <strong>Address:</strong> {campaign.streetAddress}, {campaign.state}, {campaign.country}
        </p>
        <p>
          <strong>Pincode:</strong> {campaign.pincode}
        </p>
      </div>
    </div>
  );
};

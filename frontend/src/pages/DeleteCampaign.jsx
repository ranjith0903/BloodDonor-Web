
import React, { useState } from 'react'
import { useAdminStore } from '../store/useAdminStore';
import DeleteCampaignCard from '../components/DeleteCampaignCard';
import LoadingSpinner from '../components/LoadingSpinner';

const DeleteCampaign = () => {
  const [campaignName,setCampaign]=useState("");
  const {campaigns,loading,searchCampaign}=useAdminStore();
  const handleCampaignSearch=(e)=>{
    e.preventDefault();
    searchCampaign(campaignName);



  }
  if(loading) return <LoadingSpinner/>

  return (
    <div className="mt-16 p-4 sm:p-6 md:p-8 lg:p-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Delete Campaign</h1>
      <form
        className="flex items-center justify-center mb-8"
        onSubmit={handleCampaignSearch}
      >
        <input
          type="text"
          placeholder="Search here"
          className="flex-grow rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
          value={campaignName}
          onChange={(e)=>{
            setCampaign(e.target.value);
          }}
          style={{width: '100%'}}
        />
        <button
          type="submit"
          className="ml-3 bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          Search
        </button>
      </form>
      {campaigns?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <DeleteCampaignCard campaign={campaign} key={campaign._id} className="mb-4" />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 mt-8">No Campaign found.</p>
      )}
    </div>
    
  )
}

export default DeleteCampaign




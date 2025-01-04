import React, { useEffect } from 'react'
import { CampaignCard } from '../components/CampaignCard'

import { useCampaignStore } from '../store/useCampaignStore';

const FindCampaign = () => {
  const {loading,findCampaign,campaignData}=useCampaignStore();
  useEffect(()=>{
    findCampaign();
  },[])

  return (
    <>
    {campaignData?.length?<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {
        
        campaignData.map((campaign)=>{
          
          return <CampaignCard campaign={campaign} key={campaign._id}/>
        })
      }
      
    </div>:<div className="text-center">No Campaign Found</div>}
    </>
  )
}

export default FindCampaign

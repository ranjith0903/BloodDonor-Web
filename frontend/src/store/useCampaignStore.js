import {create} from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios.js"

export const useCampaignStore=create((set,get)=>({
    campaignData:null,
    loading:false,

    registerCampaign:async({campaignName,country,state,city,streetAddress,pincode,organizerName,organizerEmail,date,organizerContactNumber})=>{
        set({loading:true})
        try {
            const res=await axios.post("/campaign/register-campaign",{campaignName,country,state,city,streetAddress,pincode,organizerName,organizerEmail,date,organizerContactNumber});
            set({loading:false,campaignData:res.data});
            toast.success("Campaign registered successfully");
            
        } catch (error) {
            set({loading:false,campaignData:null});
            toast.error(error.response?.data?.message || "An error occurred");
            
        }
    },
    findCampaign:async()=>{
        set({loading:true})
        try {
            const res=await axios.get("/campaign/findCampaign");
            
            set({loading:false,campaignData:res.data})
        } catch (error) {
            set({loading:false,campaignData:null});
            toast.error(error.response?.data?.message || "An error occurred")
        }

    },
  
}))
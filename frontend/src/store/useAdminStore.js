import {create} from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios.js";

export const useAdminStore=create((set,get)=>({
    loading:false,
    tusers:null,
    searched_user:null,
    tcampaigns:null,
    tdonors:null,
    treceivers:null,
    campaigns:null,

    getTusers: async()=>{
        set({loading:true})
        try {
            const res=await axios.get("/admin/tusers");
            set({loading:false,tusers:res.data})
           
            
        } catch (error) {
            set({loading:false,tusers:null});
            toast.error(error.response?.data?.message || "An error occurred");
            
        }

    },
    getTcampaigns:async()=>{
        set({loading:true})
        try {
            const res=await axios.get("/admin/tcampaigns");
            set({loading:false,tcampaigns:res.data})

            
        } catch (error) {
            set({loading:false,tcampaigns:null});
            toast.error(error.response?.data?.message || "An error occurred");
            
        }
    },
    getTdonors:async()=>{
        set({loading:true})
        try {
            const res=await axios.get("/admin/userAvail");
            set({loading:false,tdonors:res.data})

            
        } catch (error) {
            set({loading:false,tdonors:null});
            toast.error(error.response?.data?.message || "An error occurred");
            
        }
    },
    getTreceivers:async()=>{
        set({loading:true})
        try {
            const res=await axios.get("/admin/usersNotAvail");
            set({loading:false,treceivers:res.data})

            
        } catch (error) {
            set({loading:false,tdonors:null});
            toast.error(error.response?.data?.message || "An error occurred");
            
        }
    },
    getUserByEmail:async(email)=>{
        set({loading:true})
        try {
            const res=await axios.post("/admin/getUserByEmail",{email});
            set({loading:false,searched_user:res.data});
           
        } catch (error) {
            set({loading:false,searched_user:null});
            toast.error(error.response?.data?.message || "An error occurred")
        }


    },
    deleteUser:async(id)=>{
        set({loading:true})
      try {
        await axios.delete(`/admin/delete/${id}`)
     
     set({loading:false,searched_user:null});

        
      } catch (error) {
        set({loading:false});
            toast.error(error.response?.data?.message || "An error occurred")

        
      }
    },
    searchCampaign:async(campaignName)=>{
        set({loading:true});
        try {
            const res=await axios.post("/admin/getCampaign",{campaignName});
            set({loading:false,campaigns:res.data});
            
        } catch (error) {
            set({loading:false});
            toast.error(error.response?.data?.message || "An error occurred");
            
            
        }
    },
    deleteCampaign:async(id)=>{
        set({loading:true});
        try {
            await axios.delete(`/admin/deleteCampaign/${id}`);
            
            set({loading:false})

            
            
        } catch (error) {
            set({loading:false});
            toast.error(error.response?.data?.message || "An error occurred");

            
        }
    }




}))
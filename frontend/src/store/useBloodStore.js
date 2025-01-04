import {create} from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios.js";

export const useBloodStore=create((set,get)=>({
    donors:null,
    searching:false,
    findDonors:async(bloodType,radius)=>{
        set({searching:true})
        try {
            const res=await axios.post(`/findDonors/${radius}`,{bloodType});
            set({donors:res.data,searching:false})

            
        } catch (error) {
            set({searching:false})
            toast.error(error.response?.data?.message || "An error occurred");
        }
    }



}))
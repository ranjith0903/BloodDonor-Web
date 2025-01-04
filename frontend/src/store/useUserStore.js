import {create} from "zustand";
import axios from "../lib/axios.js";
import {toast} from "react-hot-toast";
export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ fullName, email, password, phoneNumber, bloodType, available,location }) => {
    set({ loading: true });
    
    try {
      const res = await axios.post("/auth/signup", { fullName, email, password, phoneNumber, bloodType, available,location });
      set({ user: res.data, loading: false });
      
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
  
    }
  },
  login:async (email,password)=>{
    set({loading:true});
    try{
        const res=await axios.post("/auth/login",{email,password});
        set({user:res.data,loading:false});
    }
    catch(error){
        set({loading:false});
        toast.error(error.response?.data?.message || "An error occurred");
        
    }
  },
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const res = await axios.get("/auth/get-profile");
      set({ user: res.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
    }
  },
  logout: async()=>{
    try {
      await axios.post("/auth/logout");
      set({user:null});
      
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during logout");
		}
      
    },
    getProfile:async()=>{
      set({loading:true})
      try {
        const res=await axios.get("/auth/get-profile");
        
        set({loading:false,user:res.data})
        
      } catch (error) {
        set({user:null,loading:false})
        toast.error(error.response?.data?.message || "An error occurred during logout");

        
      }

    }

}));

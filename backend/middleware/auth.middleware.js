import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
export const protectRoute=async(req,res,next)=>{
    try {
        const accessToken=req.cookies.accessToken;
        if(!accessToken){
            return res.status(400).json({
                message: "No access token"
            })
        }
        const decode=jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decode.userid).select("-password");;
        if(!user){
            return res.status(500).json({
                message: "No user found according to the access token"
            })
        }
        req.user=user;
        next()
    } catch (error) {
        
        return res.status(400).json({
            message: error.message
        })
        
    }

}
export const adminRoute=async(req,res,next)=>{
    try {
        if(req.user && req.user.role==="admin"){
            next();
        }
        
    } catch (error) {
        return res.status(403).json({ message: "Access denied - Admin only" });
        
    }
}
import Campaign from "../models/campaign.model.js";
import User from "../models/user.model.js";

export const getUserByEmail=async(req,res)=>{
    try {
        const {email}=req.body;
        const userFound=await User.find({email}).select("-password -refreshToken -location");
        if(!userFound){
            return res.status(400).json({
                message: "user not found"
            })
        }
        return res.status(200).json(userFound)
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })

        
    }

}
export const deleteUser=async(req,res)=>{
    try {
        const user=await User.findById(req.params.id);
        if(!user){
            return res.status(500).json({
                message: "no user found"
            })
        }
        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            message : "User Successfully Deleted"
        })
        
    } catch (error) {
        
        return res.status(500).json({
            message: "error.message"
        })
        
    }
}
export const getUsersByBloodType=async(req,res)=>{
    try {
        const {bloodType}=req.body;
        const userCount=await User.find({available: true, bloodType: bloodType}).countDocuments();
        if(userCount===0){
            return res.status(400).json({
                message: "No users found"
            })
        }
        return res.status(200).json(userCount);

        
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })
        
    }
}
export const usersNotAvail=async(req,res)=>{
    try {
        const usersCount=await User.find({
            available: false
        }).countDocuments();
        return res.status(200).json(usersCount);
        
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })
        
    }
}
export const userAvail=async(req,res)=>{
    try {
        const usersCount=await User.find({
            available:true,
        }).countDocuments();
        return res.status(200).json(usersCount)
        
    } catch (error) {
        
        return res.status(500).json({
            message: error.message,
        })
        
    }
}
export const tUsers = async (req, res) => {
    try {
        const tusers = await User.countDocuments({});
        return res.status(200).json(tusers);
    } catch (error) {
       
        return res.status(500).json({
            message: error.message
        });
    }
};
export const tCampaigns=async(req,res)=>{
    try {
        const tcampaigns=await Campaign.find({}).countDocuments();
        return res.status(200).json(tcampaigns);

        
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })
        
    }

}
export const searchCampaign=async(req,res)=>{
    try {
        const {campaignName}=req.body;
        const campaign=await Campaign.find({campaignName});
        if(!campaign){
            return res.status(400).json({
                message: "No campaign found"
            })
        }
        return res.status(200).json(campaign);
        
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })
        
    }
}
export const DeleteCampaign=async(req,res)=>{
    try {
        const campaign=await Campaign.findById(req.params.id);
        if(!campaign){
            return res.status(400).json({
                message: "No campaign found"
            })
        }
        await Campaign.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            message: 'SuccessFully Deleted'
        })
        
        
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })
        
    }
}




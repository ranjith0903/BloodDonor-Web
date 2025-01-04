import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
const generateTokens=(userid)=>{
    const accessToken=jwt.sign({userid},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"})
    const refreshToken=jwt.sign({userid},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"})
    return{refreshToken,accessToken}
};
const setCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 15 * 60 * 1000, // 15 minutes
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
};

export const registerUser=async (req,res) => {
    //Name, email, password (hashed), blood type, location, contact, role (donor or recipient).
    try {
        const {fullName,email,password,bloodType,phoneNumber,available,location}=req.body;
      
        const userExists=await User.findOne({email:email}); ;
        if(userExists){
            return res.status(400).json({message: "User already exists"})
        }
        const user=await User.create({fullName,email,password,bloodType,phoneNumber,available,location});
        const {refreshToken,accessToken}=generateTokens(user._id);
        user.refreshToken=refreshToken;
        await user.save();
        setCookies(res,accessToken,refreshToken);
        return res.status(200).json({
            user:user._id,
            fullName:user.fullName,
            email:user.email,
            bloodType:user.bloodType
            
        })
    } catch (error) {
        
        return res.status(400).json({message:error.message})
        
    }


}
export const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;
     
		const userFound = await User.findOne({ email });
		if (userFound && (await userFound.comparePassword(password))) {
			const { refreshToken, accessToken } = generateTokens(userFound._id);
			userFound.refreshToken = refreshToken;
			await userFound.save();
			setCookies(res, accessToken, refreshToken);
			return res.status(200).json({
				fullName: userFound.fullName,
				email: userFound.email,
				message: "Successfully Logged In",
			});
		} else {
			return res.status(400).json({
				message: "Wrong Email or Password",
			});
		}
	} catch (error) {
		
		return res.status(500).json({
			message: error.message,
		});
	}
};
export const logoutUser=async (req,res)=>{
    try {
        const refreshToken=req.cookies.refreshToken;
        if(refreshToken){
            const decodedUser=jwt.verify(refreshToken,process.env.ACCESS_TOKEN_SECRET);
            const user=await User.findById(decodedUser.userid);
            user.refreshToken="";
            await user.save();
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return res.status(200).json("Logged Out successfully");
    
    
        }
        else{
            return res.status(400).json({
                message:"No refreshTokenFound"
            })
    
        }
    } catch (error) {
        
        return res.status(500).json({
            message: error.message
        })
        
    }
}
export const getProfile=(req,res)=>{
   try {
     const user=req.user;
     if(!user){z
         return res.status(500).json({
             message: "No user found"
 
         })
     }
     return res.status(200).json(user)
   } catch (error) {
    
    return res.status(500).json({message: error.message})
    
   }
}




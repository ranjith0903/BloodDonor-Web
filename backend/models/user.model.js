import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
//Name, email, password (hashed), blood type, location, contact, role (donor or recipient).
const userSchema = new mongoose.Schema({
   fullName:{
    type:String,
    required:true
   },
   email:{
      type:String,
      required:true
   },
   profilePicture:{
      type:String,
      default:"https://res.cloudinary.com/dfj48q4my/image/upload/v1735983955/user_epshym.png"
   },
   
   
   password:{
    type:String,
    required:true,
   },
   bloodType:{
    type:String,
    required:true
   },
   location: {
      type: {
         type: String,
         enum: ['Point'],
         
      },
      coordinates: {
         type: [Number],
         
      }
   },

   phoneNumber:{
    type:String,
    required:true,
   },
   refreshToken: {
    type: String
},
 available:{
   type:Boolean,
   default:false
 },
   role:{
    type:String,
    enum: ["user","admin"],
    default: "user",
   }
})
userSchema.index({ location: '2dsphere' });
userSchema.pre("save",async function (next){
   if(!this.isModified("password")){
    return next();
   }
   try {
    const salt=await bcrypt.genSalt(10);
   this.password=await bcrypt.hash(this.password,salt);
   next();
    
   } catch (error) {
  
    next(error);
    
   }

})
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};
const User=mongoose.model("User",userSchema);
export default  User;

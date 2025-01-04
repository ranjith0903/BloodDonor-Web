import mongoose from "mongoose";

const campaignSchema=new mongoose.Schema({
    campaignName:{
        type:String,
        required:true,
        
    },
    date:{
      type:String,
      required:true
    },
    country:{
      type:String,
      required:true
    },
    state:{
      type:String,
      required:true,
    },
    city:{
      type:String,
      required:true,
    },
    streetAddress:{
      type:String,
      required:true
    },
    pincode:{
      type:String,
      required:true
    },
    organizerName:{
      type:String,
      required:true
    },
    organizerEmail:{
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
    organizerContactNumber:{
      type:String,
      required:true
    }
})
campaignSchema.index({ location: '2dsphere' });
const Campaign=mongoose.model("Campaign",campaignSchema);
export default Campaign ;
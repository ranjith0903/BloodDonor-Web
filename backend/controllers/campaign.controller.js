import Campaign from "../models/campaign.model.js";
import NodeGeocoder from 'node-geocoder';
import User from "../models/user.model.js";


export const registerCampaign = async (req, res) => {
    try {
        const {
            campaignName,
            country,
            state,
            city,
            streetAddress,
            pincode,
            organizerName,
            organizerEmail,
            date,
            organizerContactNumber
        } = req.body;

        const options = {
            provider: 'openstreetmap',
          };
          

        const geocoder = NodeGeocoder(options);
        

        try {
            const geocodeResult = await geocoder.geocode(pincode);
            if (geocodeResult.length > 0) {
                const { latitude, longitude } = geocodeResult[0];
                const newCampaign = await Campaign({
                    campaignName,
                    country,
                    state,
                    city,
                    streetAddress,
                    pincode,
                    organizerName,
                    organizerEmail,
                    date,
                    organizerContactNumber,
                    location: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    }
                });
                await newCampaign.save();
                return res.status(200).json({
                    message: "Successfully created",
                    campaignName: campaignName,
                    date,
                });
            } else {
                throw new Error('No results found for the provided address');
            }
        } catch (err) {
            console.error(err);
            throw new Error('Failed to geocode location');
        }
    } catch (error) {
        
        return res.status(400).json({
            message: error.message
        });
    }
}
export const findCampaign=async(req,res)=>{
    try {
        const user=req.user;
        const radiusInMeters=50 * 1000;
        if(!user){
            return res.status(400).json({
                message: "No user found "
            })
        }
        const loggedInUser=await User.findById(user._id).select("-password");
        const {location}=loggedInUser;
        if(!location || !location.coordinates){
            return res.status(400).json({
                message:"No location found"
            })
        }
        const [longitude,latitude]=location.coordinates;
        const campaigns = await Campaign.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        }).select("-__v -createdAt -updatedAt").lean();
        return res.status(200).json(campaigns)
    } catch (error) {
        
        return res.status(500).json(
            {
                message: error.message
            }
        )
        
    }



}

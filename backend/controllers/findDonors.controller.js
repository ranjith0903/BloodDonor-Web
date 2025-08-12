import User from "../models/user.model.js";
export const findDonors = async (req, res) => {
    const { radius } = req.params;
    const {bloodType}=req.body // Radius in kilometers from the URL path
    const user = req.user;

    const radiusInMeters = radius * 1000; // Convert radius to meters

    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    try {
        // Fetch latitude and longitude of the logged-in user
        const loggedInUser = await User.findById(user._id).select("-password");
        const { location } = loggedInUser;

        if (!location || !location.coordinates) {
            return res.status(400).json({ error: "User location not found" });
        }

        const [longitude, latitude] = location.coordinates; // Extract longitude and latitude

        // Query nearby donors within the radius
        const donors = await User.find({
            _id: { $ne: user._id },
            bloodType: bloodType,
            available: true, // Only return available donors
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        }).select("-password -refreshToken -role -__v").lean();

        return res.status(200).json(donors);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
  };
  

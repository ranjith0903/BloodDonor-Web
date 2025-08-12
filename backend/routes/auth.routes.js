import express from "express";
import multer from 'multer';
import User from "../models/user.model.js";
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import NodeGeocoder from 'node-geocoder';
import { getProfile, registerUser, updateAvailability, makeAllUsersAvailable } from "../controllers/auth.controller.js";
import {loginUser,logoutUser} from "../controllers/auth.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js"
dotenv.config();
const router=express.Router();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post('/profile/update', protectRoute, async (req, res) => {
  const { field, value } = req.body;


  try {
    // Find user from the database by ID
    const user = await User.findById(req.user._id).lean();


    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (field === 'location') {
      const options = {
        provider: 'openstreetmap'
      };
      const geocoder = NodeGeocoder(options);
     

      const geocodeResult = await geocoder.geocode(value);
      
      if (geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        user.location = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };
        await User.findByIdAndUpdate(req.user._id, user);
        res.json({ success: true, message: 'Location updated successfully', user });
      } else {
        res.status(400).json({ success: false, message: 'Invalid pincode' });
      }
    } else if (user.hasOwnProperty(field)) {
      user[field] = value;
      await User.findByIdAndUpdate(req.user._id, user);
      res.json({ success: true, message: 'Profile updated successfully', user });
    } else {
      res.status(400).json({ success: false, message: 'Invalid field' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post("/profile/upload", protectRoute, upload.single("profilePicture"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const fileBase64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

    // Upload image to Cloudinary using the data URI
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'auto', // This will automatically detect the file type (e.g., image, video, etc.)
      folder: "blood-donation/profile-pictures", // Set folder if needed
    });

    // Update user profile picture URL in the database
    const user = await User.findById(req.user._id);
    user.profilePicture = result.secure_url;
    await user.save();

    // Return the success response with the new image URL
    res.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.delete('/profile/delete',protectRoute,async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the authenticated request
    await User.findByIdAndDelete(userId); // Delete user from the database
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

router.post("/signup",registerUser);
router.post("/login",loginUser);
router.post("/logout",logoutUser);
router.get("/get-profile",protectRoute,getProfile);
router.put("/update-availability", protectRoute, updateAvailability);
router.post("/make-all-available", makeAllUsersAvailable); // For testing - no auth required

export default router

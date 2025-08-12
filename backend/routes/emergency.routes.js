import express from "express";
import Emergency from "../models/emergency.model.js";
import User from "../models/user.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create emergency request
router.post("/create", protectRoute, async (req, res) => {
  try {
    const {
      bloodType,
      priority,
      units,
      location,
      hospital,
      contactPerson,
      description,
      expiresAt
    } = req.body;

    const emergency = new Emergency({
      requesterId: req.user._id,
      bloodType,
      priority,
      units,
      location,
      hospital,
      contactPerson,
      description,
      expiresAt: new Date(expiresAt)
    });

    await emergency.save();

    // Find nearby donors
    const donors = await User.find({
      bloodType,
      available: true,
      _id: { $ne: req.user._id },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location.coordinates,
          },
          $maxDistance: 50000, // 50km radius
        },
      },
    }).select("-password -refreshToken");

    // Add matched donors to emergency
    emergency.matchedDonors = donors.map(donor => ({
      donorId: donor._id,
      distance: calculateDistance(location.coordinates, donor.location.coordinates),
      status: "pending"
    }));

    await emergency.save();

    res.json({
      success: true,
      emergency,
      matchedDonors: donors.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active emergencies
router.get("/active", protectRoute, async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      status: "active",
      expiresAt: { $gt: new Date() }
    })
    .populate("requesterId", "fullName")
    .populate("matchedDonors.donorId", "fullName phoneNumber")
    .sort({ priority: -1, createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to emergency (donor accepts/declines)
router.post("/respond/:emergencyId", protectRoute, async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { action } = req.body; // "accepted" or "declined"

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: "Emergency not found" });
    }

    const matchedDonor = emergency.matchedDonors.find(
      md => md.donorId.toString() === req.user._id.toString()
    );

    if (!matchedDonor) {
      return res.status(400).json({ error: "Not matched to this emergency" });
    }

    matchedDonor.status = action;
    matchedDonor.responseTime = new Date();

    await emergency.save();

    res.json({ success: true, emergency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate distance
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default router; 
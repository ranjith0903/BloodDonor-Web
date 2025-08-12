import EmergencyCall from "../models/emergencyCall.model.js";
import User from "../models/user.model.js";

// Create emergency call (rings all nearby donors)
export const createEmergencyCall = async (req, res) => {
  try {
    const {
      bloodType,
      units,
      urgency,
      hospital,
      address,
      patientName,
      notes
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Generate unique call ID
    const callId = `CALL${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create emergency call
    const emergencyCall = new EmergencyCall({
      callId,
      requester: {
        userId: req.user._id,
        name: req.user.fullName,
        phone: req.user.phoneNumber,
        email: req.user.email,
        location: req.user.location
      },
      bloodRequest: {
        bloodType,
        units,
        urgency: urgency || "critical",
        hospital,
        address,
        patientName,
        notes
      },
      status: "ringing"
    });

    await emergencyCall.save();

    // Find all nearby available donors
    const nearbyDonors = await findNearbyAvailableDonors(
      req.user.location?.coordinates,
      bloodType,
      30 // 30km radius for emergency calls
    );

    // Add all donors to the call
    const donorResponses = nearbyDonors.map(donor => ({
      donorId: donor._id,
      donorName: donor.fullName,
      donorPhone: donor.phoneNumber,
      status: "ringing", // All donors start with ringing status
      responseTime: null
    }));

    emergencyCall.donorResponses = donorResponses;
    await emergencyCall.save();

    console.log(`🚨 EMERGENCY CALL: ${callId} - Ringing ${nearbyDonors.length} donors`);

    res.status(201).json({
      success: true,
      data: {
        callId: emergencyCall.callId,
        status: emergencyCall.status,
        ringingDonors: nearbyDonors.length,
        message: `Emergency call created! Ringing ${nearbyDonors.length} nearby donors.`
      }
    });

  } catch (error) {
    console.error("Error creating emergency call:", error);
    res.status(500).json({ error: "Failed to create emergency call" });
  }
};

// Find nearby available donors
const findNearbyAvailableDonors = async (coordinates, bloodType, maxDistance = 30) => {
  try {
    if (!coordinates) return [];

    const [longitude, latitude] = coordinates;
    const radiusInMeters = maxDistance * 1000;

    // Find nearby available donors
    const donors = await User.find({
      available: true,
      bloodType: bloodType === "any" ? { $exists: true } : bloodType,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select("fullName phoneNumber bloodType location").limit(15);

    return donors;
  } catch (error) {
    console.error("Error finding nearby donors:", error);
    return [];
  }
};

// Donor responds to emergency call (accept/reject)
export const respondToEmergencyCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { response } = req.body; // "accept" or "reject"

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const emergencyCall = await EmergencyCall.findOne({ callId });

    if (!emergencyCall) {
      return res.status(404).json({ error: "Emergency call not found" });
    }

    if (emergencyCall.status !== "ringing" && emergencyCall.status !== "connected") {
      return res.status(400).json({ error: "Emergency call is no longer active" });
    }

    // Find donor's response in the call
    const donorResponse = emergencyCall.donorResponses.find(
      r => r.donorId.toString() === req.user._id.toString()
    );

    if (!donorResponse) {
      return res.status(404).json({ error: "You are not part of this emergency call" });
    }

    // Check if donor has already responded
    if (donorResponse.status === "accept" || donorResponse.status === "reject") {
      return res.status(400).json({ error: "You have already responded to this emergency call" });
    }

    // Update donor's response
    console.log("Updating donor response:", {
      donorId: req.user._id,
      currentStatus: donorResponse.status,
      newStatus: response
    });
    
    donorResponse.status = response;
    donorResponse.responseTime = new Date();

    // If donor accepts, update call status and share contact details
    if (response === "accept") {
      // Add donor to accepted donors list
      const donorDetails = {
        donorId: req.user._id,
        donorName: req.user.fullName,
        donorPhone: req.user.phoneNumber,
        donorEmail: req.user.email,
        donorBloodType: req.user.bloodType,
        acceptedAt: new Date()
      };

      // Add to accepted donors if not already there
      const existingDonor = emergencyCall.acceptedDonors.find(
        donor => donor.donorId.toString() === req.user._id.toString()
      );
      
      if (!existingDonor) {
        emergencyCall.acceptedDonors.push(donorDetails);
        
        // Set first accepted time if this is the first acceptance
        if (!emergencyCall.timeline.firstAcceptedAt) {
          emergencyCall.timeline.firstAcceptedAt = new Date();
        }
      }
      
      // Update call status to connected if not already
      if (emergencyCall.status === "ringing") {
        emergencyCall.status = "connected";
      }
    }

    await emergencyCall.save();

    // If accepted, return requester's contact details to donor AND share donor details with requester
    if (response === "accept") {
      res.json({
        success: true,
        data: {
          callId: emergencyCall.callId,
          status: emergencyCall.status,
          requesterContact: {
            name: emergencyCall.requester.name,
            phone: emergencyCall.requester.phone,
            email: emergencyCall.requester.email
          },
          bloodRequest: emergencyCall.bloodRequest,
          acceptedDonors: emergencyCall.acceptedDonors,
          acceptedCount: emergencyCall.acceptedDonors.length,
          message: "Call accepted! Contact details shared successfully."
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          callId: emergencyCall.callId,
          status: "reject",
          message: "Call rejected."
        }
      });
    }

  } catch (error) {
    console.error("Error responding to emergency call:", error);
    console.error("Error details:", {
      callId: req.params.callId,
      response: req.body.response,
      userId: req.user?._id,
      errorMessage: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Failed to respond to emergency call",
      details: error.message 
    });
  }
};

// Get active emergency calls for user
export const getActiveEmergencyCalls = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const calls = await EmergencyCall.find({
      $or: [
        { "requester.userId": req.user._id },
        { "donorResponses.donorId": req.user._id }
      ],
      status: { $in: ["ringing", "connected"] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: calls,
      count: calls.length
    });

  } catch (error) {
    console.error("Error getting emergency calls:", error);
    res.status(500).json({ error: "Failed to get emergency calls" });
  }
};

// Get emergency call details
export const getEmergencyCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;

    const emergencyCall = await EmergencyCall.findOne({ callId });

    if (!emergencyCall) {
      return res.status(404).json({ error: "Emergency call not found" });
    }

    res.json({
      success: true,
      data: emergencyCall
    });

  } catch (error) {
    console.error("Error getting emergency call details:", error);
    res.status(500).json({ error: "Failed to get emergency call details" });
  }
};

// Get donor details for requester when call is accepted
export const getDonorDetailsForRequester = async (req, res) => {
  try {
    const { callId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const emergencyCall = await EmergencyCall.findOne({ callId });

    if (!emergencyCall) {
      return res.status(404).json({ error: "Emergency call not found" });
    }

    // Only requester can get donor details
    if (emergencyCall.requester.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the requester can get donor details" });
    }

    if (emergencyCall.status !== "connected" || !emergencyCall.acceptedDonors || emergencyCall.acceptedDonors.length === 0) {
      return res.status(400).json({ error: "No donors have accepted this call yet" });
    }

    res.json({
      success: true,
      data: {
        callId: emergencyCall.callId,
        acceptedDonors: emergencyCall.acceptedDonors,
        acceptedCount: emergencyCall.acceptedDonors.length,
        bloodRequest: emergencyCall.bloodRequest,
        message: "Donor details retrieved successfully"
      }
    });

  } catch (error) {
    console.error("Error getting donor details:", error);
    res.status(500).json({ error: "Failed to get donor details" });
  }
};

// End emergency call
export const endEmergencyCall = async (req, res) => {
  try {
    const { callId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const emergencyCall = await EmergencyCall.findOne({ callId });

    if (!emergencyCall) {
      return res.status(404).json({ error: "Emergency call not found" });
    }

    // Only requester can end the call
    if (emergencyCall.requester.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the requester can end this call" });
    }

    emergencyCall.status = "ended";
    emergencyCall.endedAt = new Date();

    await emergencyCall.save();

    res.json({
      success: true,
      data: {
        callId: emergencyCall.callId,
        status: emergencyCall.status,
        message: "Emergency call ended"
      }
    });

  } catch (error) {
    console.error("Error ending emergency call:", error);
    res.status(500).json({ error: "Failed to end emergency call" });
  }
}; 
import EmergencyAlert from "../models/emergencyAlert.model.js";
import User from "../models/user.model.js";

// Create emergency blood alert (bypasses normal request process)
export const createEmergencyAlert = async (req, res) => {
  try {
    const {
      emergencyType,
      bloodType,
      units,
      urgency,
      requiredBy,
      hospital,
      address,
      emergencyContact,
      role,
      notes
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Generate unique alert ID
    const alertId = `EMG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create emergency alert
    const emergencyAlert = new EmergencyAlert({
      alertId,
      emergencyType,
      requester: {
        userId: req.user._id,
        name: req.user.fullName,
        phone: req.user.phoneNumber,
        email: req.user.email,
        role
      },
      bloodRequest: {
        bloodType,
        units,
        urgency: urgency || "critical",
        requiredBy: new Date(requiredBy)
      },
      location: {
        type: "Point",
        coordinates: req.user.location?.coordinates || [0, 0],
        address,
        hospital,
        emergencyContact
      },
      notes: {
        emergency: notes
      }
    });

    await emergencyAlert.save();

    // Immediately find and notify nearby available donors
    const nearbyDonors = await findNearbyAvailableDonors(
      req.user.location?.coordinates,
      bloodType,
      50 // 50km radius for emergency
    );

    console.log(`🚨 EMERGENCY ALERT: ${alertId} - Found ${nearbyDonors.length} nearby donors`);

    res.status(201).json({
      success: true,
      data: {
        alertId: emergencyAlert.alertId,
        status: emergencyAlert.status,
        nearbyDonors: nearbyDonors.length,
        message: `Emergency alert created! ${nearbyDonors.length} donors notified immediately.`
      }
    });

  } catch (error) {
    console.error("Error creating emergency alert:", error);
    res.status(500).json({ error: "Failed to create emergency alert" });
  }
};

// Find nearby available donors for emergency
const findNearbyAvailableDonors = async (coordinates, bloodType, maxDistance = 50) => {
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
    }).select("fullName phoneNumber bloodType location").limit(20);

    return donors;
  } catch (error) {
    console.error("Error finding nearby donors:", error);
    return [];
  }
};

// Get all active emergency alerts
export const getActiveEmergencyAlerts = async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({
      status: { $in: ["active", "responding"] }
    }).sort({ priority: 1, "timeline.created": -1 });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error("Error getting emergency alerts:", error);
    res.status(500).json({ error: "Failed to get emergency alerts" });
  }
};

// Respond to emergency alert (donor side)
export const respondToEmergencyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, eta, notes } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const emergencyAlert = await EmergencyAlert.findOne({ alertId });

    if (!emergencyAlert) {
      return res.status(404).json({ error: "Emergency alert not found" });
    }

    if (!emergencyAlert.isActive()) {
      return res.status(400).json({ error: "Emergency alert is no longer active" });
    }

    // Check if user already responded
    const existingResponse = emergencyAlert.responses.find(
      r => r.donorId.toString() === req.user._id.toString()
    );

    if (existingResponse) {
      // Update existing response
      existingResponse.status = status;
      existingResponse.eta = eta ? new Date(eta) : undefined;
      existingResponse.notes = notes;
      existingResponse.responseTime = new Date();
    } else {
      // Add new response
      emergencyAlert.responses.push({
        donorId: req.user._id,
        donorName: req.user.fullName,
        donorPhone: req.user.phoneNumber,
        status,
        eta: eta ? new Date(eta) : undefined,
        notes
      });
    }

    // Update alert status if first response
    if (emergencyAlert.responses.length === 1) {
      emergencyAlert.status = "responding";
      emergencyAlert.timeline.firstResponse = new Date();
    }

    await emergencyAlert.save();

    res.json({
      success: true,
      data: {
        alertId: emergencyAlert.alertId,
        status: emergencyAlert.status,
        message: `Response recorded. ${emergencyAlert.responses.length} donors responding.`
      }
    });

  } catch (error) {
    console.error("Error responding to emergency alert:", error);
    res.status(500).json({ error: "Failed to respond to emergency alert" });
  }
};

// Get emergency alert details
export const getEmergencyAlertDetails = async (req, res) => {
  try {
    const { alertId } = req.params;

    const emergencyAlert = await EmergencyAlert.findOne({ alertId });

    if (!emergencyAlert) {
      return res.status(404).json({ error: "Emergency alert not found" });
    }

    res.json({
      success: true,
      data: emergencyAlert
    });

  } catch (error) {
    console.error("Error getting emergency alert details:", error);
    res.status(500).json({ error: "Failed to get emergency alert details" });
  }
};

// Resolve emergency alert
export const resolveEmergencyAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolutionNotes } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const emergencyAlert = await EmergencyAlert.findOne({ alertId });

    if (!emergencyAlert) {
      return res.status(404).json({ error: "Emergency alert not found" });
    }

    emergencyAlert.status = "resolved";
    emergencyAlert.timeline.resolved = new Date();
    emergencyAlert.notes.coordination = resolutionNotes;

    await emergencyAlert.save();

    res.json({
      success: true,
      data: {
        alertId: emergencyAlert.alertId,
        status: emergencyAlert.status,
        message: "Emergency alert resolved successfully"
      }
    });

  } catch (error) {
    console.error("Error resolving emergency alert:", error);
    res.status(500).json({ error: "Failed to resolve emergency alert" });
  }
};

// Get emergency alerts for a specific user (donor or requester)
export const getUserEmergencyAlerts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const alerts = await EmergencyAlert.find({
      $or: [
        { "requester.userId": req.user._id },
        { "responses.donorId": req.user._id }
      ]
    }).sort({ "timeline.created": -1 });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error("Error getting user emergency alerts:", error);
    res.status(500).json({ error: "Failed to get user emergency alerts" });
  }
}; 
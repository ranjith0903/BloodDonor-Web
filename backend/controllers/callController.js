import Emergency from "../models/emergency.model.js";
import User from "../models/user.model.js";

// Store active calls in memory (in production, use Redis)
const activeCalls = new Map();

export const handleCallOffer = async (req, res) => {
  try {
    const { emergencyId, donorId, offer } = req.body;

    // Validate emergency exists
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: "Emergency not found" });
    }

    // Validate donor exists and is matched
    const matchedDonor = emergency.matchedDonors.find(
      md => md.donorId.toString() === donorId
    );
    if (!matchedDonor) {
      return res.status(400).json({ error: "Donor not matched to this emergency" });
    }

    // Store call offer
    const callId = `${emergencyId}_${donorId}`;
    activeCalls.set(callId, {
      emergencyId,
      donorId,
      offer,
      status: 'pending',
      createdAt: new Date()
    });

    // Send notification to donor (in real app, this would be a push notification)
    const donor = await User.findById(donorId);
    
    res.json({
      success: true,
      callId,
      message: `Call offer sent to ${donor.fullName}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleCallAnswer = async (req, res) => {
  try {
    const { callId, answer, donorId } = req.body;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    // Update call status
    call.answer = answer;
    call.status = 'answered';
    call.answeredAt = new Date();

    activeCalls.set(callId, call);

    res.json({
      success: true,
      message: "Call answer received"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleCallReject = async (req, res) => {
  try {
    const { emergencyId, donorId } = req.body;

    // Update emergency status
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: "Emergency not found" });
    }

    const matchedDonor = emergency.matchedDonors.find(
      md => md.donorId.toString() === donorId
    );
    if (matchedDonor) {
      matchedDonor.status = 'rejected';
      matchedDonor.responseTime = new Date();
      await emergency.save();
    }

    // Remove from active calls
    const callId = `${emergencyId}_${donorId}`;
    activeCalls.delete(callId);

    res.json({
      success: true,
      message: "Call rejected, moving to next donor"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleCallAccept = async (req, res) => {
  try {
    const { emergencyId, donorId } = req.body;

    // Update emergency status
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: "Emergency not found" });
    }

    const matchedDonor = emergency.matchedDonors.find(
      md => md.donorId.toString() === donorId
    );
    if (matchedDonor) {
      matchedDonor.status = 'accepted';
      matchedDonor.responseTime = new Date();
      emergency.status = 'fulfilled';
      await emergency.save();
    }

    // Remove from active calls
    const callId = `${emergencyId}_${donorId}`;
    activeCalls.delete(callId);

    res.json({
      success: true,
      message: "Call accepted, emergency fulfilled"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = activeCalls.get(callId);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.json({
      callId,
      status: call.status,
      createdAt: call.createdAt,
      answeredAt: call.answeredAt
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const endCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = activeCalls.get(callId);
    if (call) {
      call.status = 'ended';
      call.endedAt = new Date();
      activeCalls.set(callId, call);
    }

    res.json({
      success: true,
      message: "Call ended"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActiveCalls = async (req, res) => {
  try {
    const calls = Array.from(activeCalls.entries()).map(([callId, call]) => ({
      callId,
      emergencyId: call.emergencyId,
      donorId: call.donorId,
      status: call.status,
      createdAt: call.createdAt
    }));

    res.json({ calls });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
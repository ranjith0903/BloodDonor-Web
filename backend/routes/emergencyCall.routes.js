import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createEmergencyCall,
  respondToEmergencyCall,
  getActiveEmergencyCalls,
  getEmergencyCallDetails,
  getDonorDetailsForRequester,
  endEmergencyCall
} from "../controllers/emergencyCall.controller.js";

const router = express.Router();

// Create emergency call (rings all nearby donors)
router.post("/create", protectRoute, createEmergencyCall);

// Donor responds to emergency call (accept/reject)
router.post("/:callId/respond", protectRoute, respondToEmergencyCall);

// Get active emergency calls for current user
router.get("/active", protectRoute, getActiveEmergencyCalls);

// Get specific emergency call details
router.get("/:callId", getEmergencyCallDetails);

// Get donor details for requester (when call is accepted)
router.get("/:callId/donor-details", protectRoute, getDonorDetailsForRequester);

// End emergency call (requester only)
router.put("/:callId/end", protectRoute, endEmergencyCall);

export default router; 
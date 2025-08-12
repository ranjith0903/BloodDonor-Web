import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createEmergencyAlert,
  getActiveEmergencyAlerts,
  respondToEmergencyAlert,
  getEmergencyAlertDetails,
  resolveEmergencyAlert,
  getUserEmergencyAlerts
} from "../controllers/emergencyAlert.controller.js";

const router = express.Router();

// Create emergency alert (requires authentication)
router.post("/create", protectRoute, createEmergencyAlert);

// Get all active emergency alerts (public - for donors to see)
router.get("/active", getActiveEmergencyAlerts);

// Get emergency alerts for current user
router.get("/user", protectRoute, getUserEmergencyAlerts);

// Get specific emergency alert details
router.get("/:alertId", getEmergencyAlertDetails);

// Respond to emergency alert (donor side)
router.post("/:alertId/respond", protectRoute, respondToEmergencyAlert);

// Resolve emergency alert (requester side)
router.put("/:alertId/resolve", protectRoute, resolveEmergencyAlert);

export default router; 
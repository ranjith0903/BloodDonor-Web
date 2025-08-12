import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  handleCallOffer,
  handleCallAnswer,
  handleCallReject,
  handleCallAccept,
  getCallStatus,
  endCall,
  getActiveCalls
} from "../controllers/callController.js";

const router = express.Router();

// Call signaling routes
router.post("/call-offer", protectRoute, handleCallOffer);
router.post("/call-answer", protectRoute, handleCallAnswer);
router.post("/call-reject", protectRoute, handleCallReject);
router.post("/call-accept", protectRoute, handleCallAccept);

// Call management routes
router.get("/status/:callId", protectRoute, getCallStatus);
router.delete("/end/:callId", protectRoute, endCall);
router.get("/active-calls", protectRoute, getActiveCalls);

export default router; 
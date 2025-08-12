import express from "express";
import {
  findNearbyBloodBanks,
  getBloodBankDetails,
  checkBloodAvailability,
  requestBlood,
  getAllBloodBanks,
  createBloodBank,
  createSampleBloodBanks,
  recreateSampleBloodBanks
} from "../controllers/bloodBank.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/nearby", findNearbyBloodBanks);
router.get("/:bloodBankId", getBloodBankDetails);
router.get("/availability/check", checkBloodAvailability);
router.get("/all/public", getAllBloodBanks); // Public endpoint to get all blood banks

// Protected routes (auth required)
router.post("/request", protectRoute, requestBlood);

// Admin routes
router.get("/admin/all", protectRoute, getAllBloodBanks);
router.post("/admin/create", protectRoute, createBloodBank);
router.post("/admin/sample-data", createSampleBloodBanks);
router.post("/admin/recreate-sample-data", recreateSampleBloodBanks);

export default router; 
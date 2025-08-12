import express from "express";
import { predictDemand, updateDemandData } from "../controllers/aiPrediction.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// AI-powered blood demand prediction
router.post("/predict-demand", protectRoute, predictDemand);

// Update demand data for ML training
router.post("/update-demand", protectRoute, updateDemandData);

export default router; 
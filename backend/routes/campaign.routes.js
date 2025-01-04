import express from "express";
import { findCampaign, registerCampaign } from "../controllers/campaign.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router=express.Router();
router.post("/register-campaign",registerCampaign);
router.get("/findCampaign",protectRoute,findCampaign)
export default router;
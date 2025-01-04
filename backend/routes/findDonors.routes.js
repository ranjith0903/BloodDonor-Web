
import express from "express";
import { findDonors } from "../controllers/findDonors.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:radius", protectRoute, findDonors);
export default router;

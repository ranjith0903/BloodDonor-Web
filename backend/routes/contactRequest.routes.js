import express from "express";
import {
  createContactRequest,
  getDonorRequests,
  getRequesterRequests,
  respondToRequest,
  getRequestDetails,
  completeRequest
} from "../controllers/contactRequest.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Create a contact request
router.post("/create", createContactRequest);

// Get requests for donor (donor side)
router.get("/donor", getDonorRequests);

// Get requests made by user (requester side)
router.get("/requester", getRequesterRequests);

// Donor responds to a request
router.put("/respond/:requestId", respondToRequest);

// Get specific request details
router.get("/:requestId", getRequestDetails);

// Mark request as completed
router.put("/complete/:requestId", completeRequest);

export default router; 
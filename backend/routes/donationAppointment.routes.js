import express from "express";
import {
  scheduleAppointment,
  getAvailableSlots,
  getUpcomingAppointments,
  getDonationHistory,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentDetails,
  checkEligibility,
  getNearbyHospitals,
  setTestLastDonation
} from "../controllers/donationAppointment.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Schedule a new appointment
router.post("/schedule", scheduleAppointment);

// Get available time slots
router.get("/slots/available", getAvailableSlots);

// Get user's upcoming appointments
router.get("/upcoming", getUpcomingAppointments);

// Get user's donation history
router.get("/history", getDonationHistory);

// Get appointment details
router.get("/:appointmentId", getAppointmentDetails);

// Cancel an appointment
router.delete("/:appointmentId", cancelAppointment);

// Reschedule an appointment
router.put("/:appointmentId/reschedule", rescheduleAppointment);

// Check eligibility
router.get("/eligibility/check", checkEligibility);

// Get nearby hospitals with available slots
router.get("/hospitals/nearby", getNearbyHospitals);

// Test endpoint to set last donation date (for testing)
router.post("/test/set-last-donation", setTestLastDonation);

export default router;

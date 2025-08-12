import DonationAppointment from "../models/donationAppointment.model.js";
import User from "../models/user.model.js";
import BloodBank from "../models/bloodBank.model.js";

// Schedule a new donation appointment
export const scheduleAppointment = async (req, res) => {
  try {
    const { hospitalId, date, time, bloodType, notes } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!hospitalId || !date || !time || !bloodType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if hospital exists
    const hospital = await BloodBank.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Check eligibility
    const eligibility = await checkDonorEligibility(userId);
    if (!eligibility.eligible) {
      return res.status(400).json({ 
        error: "Not eligible to donate",
        eligibility: eligibility
      });
    }

    // Check if slot is available
    const availableSlots = await DonationAppointment.findAvailableSlots(hospitalId, date, bloodType);
    if (!availableSlots.includes(time)) {
      return res.status(400).json({ 
        error: "Selected time slot is not available",
        availableSlots: availableSlots
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await DonationAppointment.findOne({
      "donor.userId": userId,
      "appointment.date": new Date(date),
      "appointment.status": { $in: ["scheduled", "confirmed"] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: "You already have an appointment on this date" });
    }

    // Create appointment
    const appointment = new DonationAppointment({
      donor: {
        userId: userId,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        bloodType: bloodType
      },
      hospital: {
        hospitalId: hospitalId,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone
      },
      appointment: {
        date: new Date(date),
        time: time,
        status: "scheduled"
      },
      eligibility: {
        checked: true,
        eligible: true,
        lastDonationDate: user.lastDonationDate,
        nextEligibleDate: eligibility.nextEligibleDate
      },
      notes: {
        donor: notes || "",
        system: "Appointment scheduled via web interface"
      }
    });

    // Generate reminders
    appointment.generateReminders();

    await appointment.save();

    // Update user's last appointment date
    await User.findByIdAndUpdate(userId, {
      lastAppointmentDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Appointment scheduled successfully",
      appointment: appointment
    });

  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ error: "Failed to schedule appointment" });
  }
};

// Get available time slots for a hospital and date
export const getAvailableSlots = async (req, res) => {
  try {
    const { hospitalId, date, bloodType } = req.query;

    if (!hospitalId || !date) {
      return res.status(400).json({ error: "Hospital ID and date are required" });
    }

    const availableSlots = await DonationAppointment.findAvailableSlots(hospitalId, date, bloodType);

    res.json({
      success: true,
      slots: availableSlots,
      date: date,
      hospitalId: hospitalId
    });

  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: "Failed to get available slots" });
  }
};

// Get user's upcoming appointments
export const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user._id;

    const appointments = await DonationAppointment.getUpcomingAppointments(userId);

    res.json({
      success: true,
      appointments: appointments
    });

  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    res.status(500).json({ error: "Failed to get upcoming appointments" });
  }
};

// Get user's donation history
export const getDonationHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await DonationAppointment.getDonationHistory(userId);

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    console.error('Error getting donation history:', error);
    res.status(500).json({ error: "Failed to get donation history" });
  }
};

// Cancel an appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const appointment = await DonationAppointment.findOne({
      _id: appointmentId,
      "donor.userId": userId
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.appointment.status === "cancelled") {
      return res.status(400).json({ error: "Appointment is already cancelled" });
    }

    if (appointment.appointment.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel completed appointment" });
    }

    // Check if appointment is within 24 hours
    const appointmentDateTime = new Date(appointment.appointment.date);
    appointmentDateTime.setHours(parseInt(appointment.appointment.time.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(appointment.appointment.time.split(':')[1]));
    
    const hoursUntilAppointment = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 24) {
      return res.status(400).json({ 
        error: "Cannot cancel appointment within 24 hours",
        hoursUntilAppointment: Math.round(hoursUntilAppointment)
      });
    }

    appointment.appointment.status = "cancelled";
    appointment.notes.system = "Appointment cancelled by donor";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment: appointment
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
};

// Reschedule an appointment
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate, newTime } = req.body;
    const userId = req.user._id;

    if (!newDate || !newTime) {
      return res.status(400).json({ error: "New date and time are required" });
    }

    const appointment = await DonationAppointment.findOne({
      _id: appointmentId,
      "donor.userId": userId
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.appointment.status === "cancelled") {
      return res.status(400).json({ error: "Cannot reschedule cancelled appointment" });
    }

    if (appointment.appointment.status === "completed") {
      return res.status(400).json({ error: "Cannot reschedule completed appointment" });
    }

    // Check if new slot is available
    const availableSlots = await DonationAppointment.findAvailableSlots(
      appointment.hospital.hospitalId,
      newDate,
      appointment.donor.bloodType
    );

    if (!availableSlots.includes(newTime)) {
      return res.status(400).json({ 
        error: "Selected time slot is not available",
        availableSlots: availableSlots
      });
    }

    // Update appointment
    appointment.appointment.date = new Date(newDate);
    appointment.appointment.time = newTime;
    appointment.appointment.status = "scheduled";
    appointment.notes.system = "Appointment rescheduled by donor";
    
    // Regenerate reminders
    appointment.generateReminders();
    
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: appointment
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: "Failed to reschedule appointment" });
  }
};

// Get appointment details
export const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const appointment = await DonationAppointment.findOne({
      _id: appointmentId,
      "donor.userId": userId
    }).populate('hospital.hospitalId');

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({
      success: true,
      appointment: appointment
    });

  } catch (error) {
    console.error('Error getting appointment details:', error);
    res.status(500).json({ error: "Failed to get appointment details" });
  }
};

// Check donor eligibility
export const checkEligibility = async (req, res) => {
  try {
    const userId = req.user._id;
    const eligibility = await checkDonorEligibility(userId);

    res.json({
      success: true,
      eligibility: eligibility
    });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ error: "Failed to check eligibility" });
  }
};

// Helper function to check donor eligibility
const checkDonorEligibility = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const lastDonation = user.lastDonationDate;
  const today = new Date();
  
  if (lastDonation) {
    const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
    const minDaysBetweenDonations = 56; // 8 weeks
    
    if (daysSinceLastDonation < minDaysBetweenDonations) {
      const nextEligibleDate = new Date(lastDonation.getTime() + (minDaysBetweenDonations * 24 * 60 * 60 * 1000));
      return {
        eligible: false,
        reason: `You must wait at least 8 weeks between donations. You can donate again on ${nextEligibleDate.toLocaleDateString()}.`,
        lastDonation: lastDonation.toLocaleDateString(),
        nextEligibleDate: nextEligibleDate.toLocaleDateString(),
        daysSinceLastDonation: daysSinceLastDonation,
        daysUntilEligible: minDaysBetweenDonations - daysSinceLastDonation
      };
    }
  }
  
  return {
    eligible: true,
    lastDonation: lastDonation ? lastDonation.toLocaleDateString() : "Never",
    nextEligibleDate: null,
    daysSinceLastDonation: lastDonation ? Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24)) : null
  };
};

// Test endpoint to set last donation date (for testing purposes)
export const setTestLastDonation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { daysAgo = 30 } = req.body; // Default to 30 days ago
    
    const lastDonationDate = new Date();
    lastDonationDate.setDate(lastDonationDate.getDate() - daysAgo);
    
    await User.findByIdAndUpdate(userId, {
      lastDonationDate: lastDonationDate
    });
    
    res.json({
      success: true,
      message: `Last donation date set to ${daysAgo} days ago`,
      lastDonationDate: lastDonationDate
    });
    
  } catch (error) {
    console.error('Error setting test last donation:', error);
    res.status(500).json({ error: "Failed to set test last donation" });
  }
};

// Get nearby hospitals with available slots
export const getNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query; // radius in km
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Location coordinates are required" });
    }

    // Find nearby hospitals
    const hospitals = await BloodBank.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).limit(20);

    // Get available slots for each hospital for the next 7 days
    const hospitalsWithSlots = await Promise.all(
      hospitals.map(async (hospital) => {
        const slots = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateString = date.toISOString().split('T')[0];
          
          const availableSlots = await DonationAppointment.findAvailableSlots(
            hospital._id,
            dateString
          );
          
          if (availableSlots.length > 0) {
            slots.push({
              date: dateString,
              slots: availableSlots
            });
          }
        }
        
        return {
          ...hospital.toObject(),
          availableSlots: slots,
          totalAvailableSlots: slots.reduce((sum, day) => sum + day.slots.length, 0)
        };
      })
    );

    // Sort by total available slots
    hospitalsWithSlots.sort((a, b) => b.totalAvailableSlots - a.totalAvailableSlots);

    res.json({
      success: true,
      hospitals: hospitalsWithSlots
    });

  } catch (error) {
    console.error('Error getting nearby hospitals:', error);
    res.status(500).json({ error: "Failed to get nearby hospitals" });
  }
};

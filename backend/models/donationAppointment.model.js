import mongoose from "mongoose";

const donationAppointmentSchema = new mongoose.Schema({
  donor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: String,
    email: String,
    phone: String,
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
    }
  },
  hospital: {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank",
      required: true
    },
    name: String,
    address: String,
    phone: String
  },
  appointment: {
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 60 // minutes
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled", "no-show"],
      default: "scheduled"
    }
  },
  eligibility: {
    checked: {
      type: Boolean,
      default: false
    },
    eligible: {
      type: Boolean,
      default: true
    },
    lastDonationDate: Date,
    nextEligibleDate: Date,
    healthCheck: {
      weight: Number,
      bloodPressure: String,
      hemoglobin: Number,
      temperature: Number
    },
    restrictions: [String] // e.g., ["medication", "travel", "illness"]
  },
  notes: {
    donor: String,
    hospital: String,
    system: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ["email", "sms", "push"],
      required: true
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  followUp: {
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      wouldDonateAgain: Boolean
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
donationAppointmentSchema.index({ "donor.userId": 1, "appointment.date": 1 });
donationAppointmentSchema.index({ "hospital.hospitalId": 1, "appointment.date": 1 });
donationAppointmentSchema.index({ "appointment.status": 1, "appointment.date": 1 });
donationAppointmentSchema.index({ "appointment.date": 1, "appointment.time": 1 });

// Pre-save middleware to update hospital info
donationAppointmentSchema.pre('save', async function(next) {
  if (this.isModified('hospital.hospitalId')) {
    try {
      const BloodBank = mongoose.model('BloodBank');
      const hospital = await BloodBank.findById(this.hospital.hospitalId);
      if (hospital) {
        this.hospital.name = hospital.name;
        this.hospital.address = hospital.address;
        this.hospital.phone = hospital.phone;
      }
    } catch (error) {
      console.error('Error updating hospital info:', error);
    }
  }
  next();
});

// Virtual for checking if appointment is in the past
donationAppointmentSchema.virtual('isPast').get(function() {
  const appointmentDateTime = new Date(this.appointment.date);
  appointmentDateTime.setHours(parseInt(this.appointment.time.split(':')[0]));
  appointmentDateTime.setMinutes(parseInt(this.appointment.time.split(':')[1]));
  return appointmentDateTime < new Date();
});

// Virtual for checking if appointment is today
donationAppointmentSchema.virtual('isToday').get(function() {
  const today = new Date().toDateString();
  const appointmentDate = new Date(this.appointment.date).toDateString();
  return today === appointmentDate;
});

// Virtual for checking if appointment is upcoming
donationAppointmentSchema.virtual('isUpcoming').get(function() {
  const appointmentDateTime = new Date(this.appointment.date);
  appointmentDateTime.setHours(parseInt(this.appointment.time.split(':')[0]));
  appointmentDateTime.setMinutes(parseInt(this.appointment.time.split(':')[1]));
  return appointmentDateTime > new Date();
});

// Method to check eligibility
donationAppointmentSchema.methods.checkEligibility = function() {
  const lastDonation = this.eligibility.lastDonationDate;
  const today = new Date();
  
  if (lastDonation) {
    const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
    const minDaysBetweenDonations = 56; // 8 weeks
    
    if (daysSinceLastDonation < minDaysBetweenDonations) {
      this.eligibility.eligible = false;
      this.eligibility.nextEligibleDate = new Date(lastDonation.getTime() + (minDaysBetweenDonations * 24 * 60 * 60 * 1000));
      return false;
    }
  }
  
  this.eligibility.eligible = true;
  this.eligibility.checked = true;
  return true;
};

// Method to generate reminders
donationAppointmentSchema.methods.generateReminders = function() {
  const appointmentDateTime = new Date(this.appointment.date);
  appointmentDateTime.setHours(parseInt(this.appointment.time.split(':')[0]));
  appointmentDateTime.setMinutes(parseInt(this.appointment.time.split(':')[1]));
  
  this.reminders = [
    {
      type: 'email',
      scheduledFor: new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000)) // 24 hours before
    },
    {
      type: 'sms',
      scheduledFor: new Date(appointmentDateTime.getTime() - (2 * 60 * 60 * 1000)) // 2 hours before
    },
    {
      type: 'push',
      scheduledFor: new Date(appointmentDateTime.getTime() - (30 * 60 * 1000)) // 30 minutes before
    }
  ];
};

// Static method to find available slots
donationAppointmentSchema.statics.findAvailableSlots = async function(hospitalId, date, bloodType) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get all appointments for the hospital on that date
  const existingAppointments = await this.find({
    "hospital.hospitalId": hospitalId,
    "appointment.date": {
      $gte: startOfDay,
      $lte: endOfDay
    },
    "appointment.status": { $nin: ["cancelled", "no-show"] }
  });
  
  // Generate all possible time slots (9 AM to 5 PM, 30-minute intervals)
  const allSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  
  // Remove booked slots
  const bookedSlots = existingAppointments.map(apt => apt.appointment.time);
  const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
  
  return availableSlots;
};

// Static method to get donor's upcoming appointments
donationAppointmentSchema.statics.getUpcomingAppointments = async function(userId) {
  return await this.find({
    "donor.userId": userId,
    "appointment.status": { $in: ["scheduled", "confirmed"] },
    "appointment.date": { $gte: new Date() }
  }).sort({ "appointment.date": 1, "appointment.time": 1 });
};

// Static method to get donor's donation history
donationAppointmentSchema.statics.getDonationHistory = async function(userId) {
  return await this.find({
    "donor.userId": userId,
    "appointment.status": "completed"
  }).sort({ "appointment.date": -1 });
};

const DonationAppointment = mongoose.model("DonationAppointment", donationAppointmentSchema);

export default DonationAppointment;

import mongoose from "mongoose";

const contactRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  requester: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: String,
    phone: String,
    email: String,
    relationship: {
      type: String,
      enum: ["self", "family", "friend", "hospital", "blood_bank", "other"]
    }
  },
  donor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: String,
    phone: String // Will be hidden until approved
  },
  bloodRequest: {
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
    },
    units: {
      type: Number,
      required: true,
      min: 1
    },
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency", "critical"],
      default: "routine"
    },
    purpose: {
      type: String,
      enum: ["surgery", "emergency", "transfusion", "donation", "testing", "other"],
      required: true
    },
    requiredBy: Date,
    hospital: String,
    patientName: String,
    patientAge: Number,
    patientGender: String
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "expired", "completed"],
    default: "pending"
  },
  donorResponse: {
    action: {
      type: String,
      enum: ["approved", "rejected", "not_available", "redirected"]
    },
    message: String,
    availableDate: Date,
    preferredContact: {
      type: String,
      enum: ["phone", "email", "whatsapp", "in_person"]
    },
    responseTime: Date
  },
  timeline: {
    requestedAt: {
      type: Date,
      default: Date.now
    },
    viewedAt: Date,
    respondedAt: Date,
    contactSharedAt: Date,
    completedAt: Date
  },
  privacy: {
    showPhone: {
      type: Boolean,
      default: false
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showLocation: {
      type: Boolean,
      default: false
    },
    allowDirectContact: {
      type: Boolean,
      default: false
    }
  },
  notes: {
    requester: String,
    donor: String,
    admin: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  }
}, {
  timestamps: true
});

// Indexes
contactRequestSchema.index({ donor: 1, status: 1 });
contactRequestSchema.index({ requester: 1, status: 1 });
contactRequestSchema.index({ "bloodRequest.bloodType": 1, status: 1 });
contactRequestSchema.index({ location: '2dsphere' });

// Virtual for request age
contactRequestSchema.virtual('requestAge').get(function() {
  const now = new Date();
  const requested = new Date(this.timeline.requestedAt);
  const diffTime = now - requested;
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return diffHours;
});

// Method to check if request is urgent
contactRequestSchema.methods.isUrgent = function() {
  return this.bloodRequest.urgency === "urgent" || 
         this.bloodRequest.urgency === "emergency" || 
         this.bloodRequest.urgency === "critical";
};

// Method to check if request is expired (24 hours for routine, 2 hours for emergency)
contactRequestSchema.methods.isExpired = function() {
  if (this.status === "completed" || this.status === "rejected") return false;
  
  const now = new Date();
  const requested = new Date(this.timeline.requestedAt);
  const diffHours = (now - requested) / (1000 * 60 * 60);
  
  if (this.bloodRequest.urgency === "critical" && diffHours > 2) return true;
  if (this.bloodRequest.urgency === "emergency" && diffHours > 4) return true;
  if (this.bloodRequest.urgency === "urgent" && diffHours > 8) return true;
  if (this.bloodRequest.urgency === "routine" && diffHours > 24) return true;
  
  return false;
};

// Static method to get pending requests for a donor
contactRequestSchema.statics.getPendingForDonor = function(donorId) {
  return this.find({
    "donor.userId": donorId,
    status: "pending"
  }).sort({ "timeline.requestedAt": -1 });
};

// Static method to get urgent requests
contactRequestSchema.statics.getUrgentRequests = function() {
  return this.find({
    "bloodRequest.urgency": { $in: ["urgent", "emergency", "critical"] },
    status: "pending"
  }).sort({ "bloodRequest.urgency": 1, "timeline.requestedAt": 1 });
};

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);
export default ContactRequest; 
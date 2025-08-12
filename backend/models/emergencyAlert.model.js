import mongoose from "mongoose";

const emergencyAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  emergencyType: {
    type: String,
    enum: ["accident", "surgery", "hemorrhage", "trauma", "other"],
    required: true
  },
  requester: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: String,
    phone: String,
    email: String,
    role: {
      type: String,
      enum: ["patient", "family", "doctor", "hospital", "emergency_contact"],
      required: true
    }
  },
  bloodRequest: {
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "any"]
    },
    units: {
      type: Number,
      required: true,
      min: 1
    },
    urgency: {
      type: String,
      enum: ["critical", "emergency", "urgent"],
      default: "critical"
    },
    requiredBy: {
      type: Date,
      required: true
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    address: String,
    hospital: String,
    emergencyContact: String
  },
  status: {
    type: String,
    enum: ["active", "responding", "resolved", "cancelled"],
    default: "active"
  },
  responses: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    donorName: String,
    donorPhone: String,
    responseTime: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["available", "on_way", "arrived", "donated", "unavailable"],
      default: "available"
    },
    eta: Date,
    notes: String
  }],
  timeline: {
    created: {
      type: Date,
      default: Date.now
    },
    firstResponse: Date,
    resolved: Date,
    cancelled: Date
  },
  priority: {
    type: Number,
    default: 1, // 1 = highest priority
    min: 1,
    max: 5
  },
  notes: {
    emergency: String,
    medical: String,
    coordination: String
  }
}, {
  timestamps: true
});

// Indexes for fast queries
emergencyAlertSchema.index({ status: 1, "bloodRequest.bloodType": 1 });
emergencyAlertSchema.index({ location: '2dsphere' });
emergencyAlertSchema.index({ "timeline.created": -1 });
emergencyAlertSchema.index({ priority: 1, status: 1 });

// Virtual for alert age
emergencyAlertSchema.virtual('alertAge').get(function() {
  const now = new Date();
  const created = new Date(this.timeline.created);
  const diffMinutes = Math.ceil((now - created) / (1000 * 60));
  return diffMinutes;
});

// Virtual for response count
emergencyAlertSchema.virtual('responseCount').get(function() {
  return this.responses.length;
});

// Virtual for available donors count
emergencyAlertSchema.virtual('availableDonorsCount').get(function() {
  return this.responses.filter(r => r.status === "available" || r.status === "on_way").length;
});

// Method to check if alert is still active
emergencyAlertSchema.methods.isActive = function() {
  return this.status === "active" || this.status === "responding";
};

// Method to check if alert is critical
emergencyAlertSchema.methods.isCritical = function() {
  return this.bloodRequest.urgency === "critical";
};

// Static method to get active emergency alerts
emergencyAlertSchema.statics.getActiveAlerts = function() {
  return this.find({
    status: { $in: ["active", "responding"] }
  }).sort({ priority: 1, "timeline.created": 1 });
};

// Static method to get critical alerts
emergencyAlertSchema.statics.getCriticalAlerts = function() {
  return this.find({
    "bloodRequest.urgency": "critical",
    status: { $in: ["active", "responding"] }
  }).sort({ "timeline.created": 1 });
};

const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);
export default EmergencyAlert; 
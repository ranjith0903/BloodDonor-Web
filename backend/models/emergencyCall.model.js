import mongoose from "mongoose";

const emergencyCallSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  requester: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: String,
    phone: String,
    email: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
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
    hospital: String,
    address: String,
    patientName: String,
    notes: String
  },
  status: {
    type: String,
    enum: ["ringing", "connected", "ended", "cancelled"],
    default: "ringing"
  },
  donorResponses: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    donorName: String,
    donorPhone: String,
    status: {
      type: String,
      enum: ["ringing", "accept", "reject", "missed"],
      default: "ringing"
    },
    responseTime: Date
  }],
  // Changed from single connectedDonor to multiple acceptedDonors
  acceptedDonors: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    donorName: String,
    donorPhone: String,
    donorEmail: String,
    donorBloodType: String,
    acceptedAt: Date
  }],
  timeline: {
    callStarted: {
      type: Date,
      default: Date.now
    },
    firstResponse: Date,
    firstAcceptedAt: Date,
    endedAt: Date
  },
  ringTimeout: {
    type: Number,
    default: 30000 // 30 seconds timeout
  }
}, {
  timestamps: true
});

// Indexes
emergencyCallSchema.index({ callId: 1 });
emergencyCallSchema.index({ status: 1 });
emergencyCallSchema.index({ "requester.userId": 1 });
emergencyCallSchema.index({ "donorResponses.donorId": 1 });
emergencyCallSchema.index({ createdAt: -1 });

// Virtual for call duration
emergencyCallSchema.virtual('callDuration').get(function() {
  if (this.timeline.callStarted && this.timeline.endedAt) {
    return Math.ceil((this.timeline.endedAt - this.timeline.callStarted) / 1000);
  }
  return null;
});

// Virtual for accepted donors count
emergencyCallSchema.virtual('acceptedDonorsCount').get(function() {
  return this.acceptedDonors ? this.acceptedDonors.length : 0;
});

// Virtual for response count
emergencyCallSchema.virtual('responseCount').get(function() {
  return this.donorResponses ? this.donorResponses.length : 0;
});

// Virtual for accepted count
emergencyCallSchema.virtual('acceptedCount').get(function() {
  return this.donorResponses ? this.donorResponses.filter(dr => dr.status === 'accept').length : 0;
});

// Method to check if call is still ringing
emergencyCallSchema.methods.isRinging = function() {
  return this.status === "ringing";
};

// Method to check if call has timed out
emergencyCallSchema.methods.hasTimedOut = function() {
  const now = new Date();
  const callStart = new Date(this.timeline.callStarted);
  const timeoutMs = this.ringTimeout || 30000;
  return (now - callStart) > timeoutMs;
};

// Static method to get ringing calls for a donor
emergencyCallSchema.statics.getRingingCallsForDonor = function(donorId) {
  return this.find({
    "donorResponses.donorId": donorId,
    "donorResponses.status": "ringing",
    status: "ringing"
  }).sort({ createdAt: -1 });
};

// Static method to get active calls for requester
emergencyCallSchema.statics.getActiveCallsForRequester = function(requesterId) {
  return this.find({
    "requester.userId": requesterId,
    status: { $in: ["ringing", "connected"] }
  }).sort({ createdAt: -1 });
};

const EmergencyCall = mongoose.model("EmergencyCall", emergencyCallSchema);

export default EmergencyCall; 
import mongoose from "mongoose";

const emergencyConnectionSchema = new mongoose.Schema({
  connectionId: {
    type: String,
    required: true,
    unique: true
  },
  alertId: {
    type: String,
    required: true,
    ref: "EmergencyAlert"
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
  donor: {
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
  status: {
    type: String,
    enum: ["connecting", "connected", "in_transit", "arrived", "completed", "cancelled"],
    default: "connecting"
  },
  connectionMethod: {
    type: String,
    enum: ["call", "sms", "whatsapp", "in_app_chat"],
    default: "call"
  },
  communication: {
    callInitiated: { type: Boolean, default: false },
    callDuration: Number, // in seconds
    messages: [{
      sender: { type: String, enum: ["requester", "donor"] },
      message: String,
      timestamp: { type: Date, default: Date.now },
      messageType: { type: String, enum: ["text", "location", "status"] }
    }],
    lastContact: Date
  },
  coordination: {
    meetingPoint: String,
    eta: Date,
    specialInstructions: String,
    hospitalContact: String,
    emergencyContact: String
  },
  timeline: {
    connectedAt: Date,
    callStarted: Date,
    callEnded: Date,
    donorLeft: Date,
    donorArrived: Date,
    completedAt: Date
  },
  bloodRequest: {
    bloodType: String,
    units: Number,
    urgency: String,
    requiredBy: Date
  }
}, {
  timestamps: true
});

// Indexes
emergencyConnectionSchema.index({ alertId: 1 });
emergencyConnectionSchema.index({ status: 1 });
emergencyConnectionSchema.index({ "requester.userId": 1 });
emergencyConnectionSchema.index({ "donor.userId": 1 });

// Virtual for connection duration
emergencyConnectionSchema.virtual('connectionDuration').get(function() {
  if (this.timeline.connectedAt && this.timeline.completedAt) {
    return Math.ceil((this.timeline.completedAt - this.timeline.connectedAt) / (1000 * 60));
  }
  return 0;
});

// Virtual for call duration
emergencyConnectionSchema.virtual('callDurationMinutes').get(function() {
  if (this.communication.callDuration) {
    return Math.ceil(this.communication.callDuration / 60);
  }
  return 0;
});

// Method to add message
emergencyConnectionSchema.methods.addMessage = function(sender, message, messageType = "text") {
  this.communication.messages.push({
    sender,
    message,
    messageType,
    timestamp: new Date()
  });
  this.communication.lastContact = new Date();
  return this.save();
};

// Method to update status
emergencyConnectionSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  // Update timeline based on status
  switch (newStatus) {
    case "connected":
      this.timeline.connectedAt = new Date();
      break;
    case "in_transit":
      this.timeline.donorLeft = new Date();
      break;
    case "arrived":
      this.timeline.donorArrived = new Date();
      break;
    case "completed":
      this.timeline.completedAt = new Date();
      break;
  }
  
  return this.save();
};

// Static method to get active connections for user
emergencyConnectionSchema.statics.getActiveConnections = function(userId) {
  return this.find({
    $or: [
      { "requester.userId": userId },
      { "donor.userId": userId }
    ],
    status: { $in: ["connecting", "connected", "in_transit", "arrived"] }
  }).sort({ createdAt: -1 });
};

const EmergencyConnection = mongoose.model("EmergencyConnection", emergencyConnectionSchema);
export default EmergencyConnection; 
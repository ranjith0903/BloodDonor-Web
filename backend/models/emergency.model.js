import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  bloodType: {
    type: String,
    required: true,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  },
  priority: {
    type: String,
    enum: ["critical", "urgent", "normal"],
    default: "normal"
  },
  units: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  hospital: {
    type: String,
    required: true
  },
  contactPerson: {
    name: String,
    phone: String
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "fulfilled", "expired", "cancelled"],
    default: "active"
  },
  urgencyScore: {
    type: Number,
    default: 0
  },
  matchedDonors: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    distance: Number,
    responseTime: Date,
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed"],
      default: "pending"
    }
  }],
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1, priority: 1, createdAt: -1 });
emergencySchema.index({ bloodType: 1, status: 1 });

// Calculate urgency score based on priority and time remaining
emergencySchema.methods.calculateUrgencyScore = function() {
  const now = new Date();
  const timeRemaining = this.expiresAt - now;
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  
  let priorityScore = 0;
  switch(this.priority) {
    case "critical": priorityScore = 100; break;
    case "urgent": priorityScore = 70; break;
    case "normal": priorityScore = 40; break;
  }
  
  // Time urgency: more urgent as time runs out
  const timeUrgency = Math.max(0, 50 - hoursRemaining * 2);
  
  this.urgencyScore = priorityScore + timeUrgency;
  return this.urgencyScore;
};

const Emergency = mongoose.model("Emergency", emergencySchema);
export default Emergency; 
import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
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
    type: {
      type: String,
      enum: ["individual", "hospital", "clinic"],
      default: "individual"
    }
  },
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BloodBank",
    required: true
  },
  bloodType: {
    type: String,
    required: true,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  },
  component: {
    type: String,
    required: true,
    enum: ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate"]
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ["units", "bags", "ml"]
  },
  priority: {
    type: String,
    enum: ["routine", "urgent", "emergency", "critical"],
    default: "routine"
  },
  purpose: {
    type: String,
    enum: ["surgery", "emergency", "transfusion", "donation", "testing", "other"],
    required: true
  },
  patientInfo: {
    name: String,
    age: Number,
    gender: String,
    caseNumber: String,
    diagnosis: String
  },
  pickupDetails: {
    method: {
      type: String,
      enum: ["self_pickup", "delivery", "ambulance"],
      default: "self_pickup"
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number]
      }
    },
    contactPerson: String,
    contactPhone: String,
    pickupTime: Date,
    specialInstructions: String
  },
  status: {
    type: String,
    enum: ["pending", "approved", "preparing", "ready", "picked_up", "completed", "cancelled", "rejected"],
    default: "pending"
  },
  timeline: {
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: Date,
    preparedAt: Date,
    readyAt: Date,
    pickedUpAt: Date,
    completedAt: Date
  },
  notes: {
    requester: String,
    bloodBank: String,
    admin: String
  },
  cost: {
    amount: Number,
    currency: {
      type: String,
      default: "USD"
    },
    breakdown: {
      bloodCost: Number,
      processingFee: Number,
      deliveryFee: Number,
      total: Number
    }
  },
  payment: {
    method: {
      type: String,
      enum: ["cash", "card", "insurance", "free", "pending"]
    },
    status: {
      type: String,
      enum: ["pending", "paid", "waived", "refunded"]
    },
    transactionId: String,
    paidAt: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
transferSchema.index({ bloodBankId: 1, status: 1 });
transferSchema.index({ requester: 1, status: 1 });
transferSchema.index({ priority: 1, status: 1 });
transferSchema.index({ "pickupDetails.location": '2dsphere' });

// Virtual for request age
transferSchema.virtual('requestAge').get(function() {
  const now = new Date();
  const requested = new Date(this.timeline.requestedAt);
  const diffTime = now - requested;
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return diffHours;
});

// Virtual for processing time
transferSchema.virtual('processingTime').get(function() {
  if (!this.timeline.readyAt || !this.timeline.requestedAt) return null;
  const ready = new Date(this.timeline.readyAt);
  const requested = new Date(this.timeline.requestedAt);
  const diffTime = ready - requested;
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return diffHours;
});

// Method to check if request is urgent
transferSchema.methods.isUrgent = function() {
  return this.priority === "urgent" || this.priority === "emergency" || this.priority === "critical";
};

// Method to check if request is overdue
transferSchema.methods.isOverdue = function() {
  if (this.status === "completed" || this.status === "cancelled") return false;
  
  const now = new Date();
  const requested = new Date(this.timeline.requestedAt);
  const diffHours = (now - requested) / (1000 * 60 * 60);
  
  if (this.priority === "critical" && diffHours > 2) return true;
  if (this.priority === "emergency" && diffHours > 4) return true;
  if (this.priority === "urgent" && diffHours > 8) return true;
  if (this.priority === "routine" && diffHours > 24) return true;
  
  return false;
};

// Static method to get urgent requests
transferSchema.statics.getUrgentRequests = function(bloodBankId) {
  return this.find({
    bloodBankId: bloodBankId,
    priority: { $in: ["urgent", "emergency", "critical"] },
    status: { $in: ["pending", "approved", "preparing"] }
  }).sort({ priority: 1, "timeline.requestedAt": 1 });
};

// Static method to get requests by status
transferSchema.statics.getByStatus = function(bloodBankId, status) {
  return this.find({
    bloodBankId: bloodBankId,
    status: status
  }).sort({ "timeline.requestedAt": -1 });
};

const Transfer = mongoose.model("Transfer", transferSchema);
export default Transfer; 
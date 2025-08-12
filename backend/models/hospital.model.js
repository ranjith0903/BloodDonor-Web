import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ["government", "private", "charitable", "military", "specialty"],
    required: true
  },
  level: {
    type: String,
    enum: ["primary", "secondary", "tertiary", "quaternary"],
    required: true
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    emergency: {
      type: String,
      required: true
    },
    bloodBank: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  capacity: {
    beds: {
      total: Number,
      available: Number,
      icu: Number,
      emergency: Number
    },
    bloodBank: {
      hasOwn: {
        type: Boolean,
        default: false
      },
      capacity: Number,
      services: [String]
    }
  },
  departments: [{
    name: String,
    head: String,
    contact: String,
    specialties: [String]
  }],
  emergencyServices: {
    trauma: {
      type: Boolean,
      default: false
    },
    cardiac: {
      type: Boolean,
      default: false
    },
    neuro: {
      type: Boolean,
      default: false
    },
    pediatric: {
      type: Boolean,
      default: false
    },
    obstetric: {
      type: Boolean,
      default: false
    },
    burn: {
      type: Boolean,
      default: false
    }
  },
  bloodBankPartners: [{
    bloodBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodBank"
    },
    partnershipType: {
      type: String,
      enum: ["primary", "secondary", "emergency", "backup"]
    },
    agreementDate: Date,
    terms: String
  }],
  accreditation: {
    type: String,
    enum: ["NABH", "ISO", "JCI", "CAP", "none"],
    default: "none"
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance", "emergency"],
    default: "active"
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  staff: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: {
      type: String,
      enum: ["doctor", "nurse", "technician", "coordinator", "admin"]
    },
    department: String,
    permissions: [String]
  }],
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  integrationSettings: {
    hl7Enabled: {
      type: Boolean,
      default: false
    },
    fhirEnabled: {
      type: Boolean,
      default: false
    },
    realTimeSync: {
      type: Boolean,
      default: true
    },
    autoRequest: {
      type: Boolean,
      default: true
    },
    emergencyPriority: {
      type: Boolean,
      default: true
    }
  },
  emergencyProtocols: {
    bloodRequest: {
      autoNotify: {
        type: Boolean,
        default: true
      },
      priorityLevels: {
        critical: { responseTime: Number, notifyPartners: Boolean },
        urgent: { responseTime: Number, notifyPartners: Boolean },
        routine: { responseTime: Number, notifyPartners: Boolean }
      }
    },
    coordination: {
      centralCommand: String,
      backupContacts: [String],
      escalationMatrix: [{
        level: Number,
        contact: String,
        role: String
      }]
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ code: 1 });
hospitalSchema.index({ status: 1 });
hospitalSchema.index({ type: 1, level: 1 });

// Virtual for bed occupancy percentage
hospitalSchema.virtual('bedOccupancyPercentage').get(function() {
  if (!this.capacity.beds.total) return 0;
  const occupied = this.capacity.beds.total - this.capacity.beds.available;
  return Math.round((occupied / this.capacity.beds.total) * 100);
});

// Method to check if hospital has emergency capacity
hospitalSchema.methods.hasEmergencyCapacity = function() {
  return this.capacity.beds.emergency > 0 && this.status === "active";
};

// Method to get primary blood bank partner
hospitalSchema.methods.getPrimaryBloodBank = function() {
  const primary = this.bloodBankPartners.find(partner => 
    partner.partnershipType === "primary"
  );
  return primary ? primary.bloodBankId : null;
};

// Method to get emergency contacts
hospitalSchema.methods.getEmergencyContacts = function() {
  return {
    main: this.contact.emergency,
    bloodBank: this.contact.bloodBank,
    centralCommand: this.emergencyProtocols.coordination.centralCommand
  };
};

// Static method to find nearby hospitals
hospitalSchema.statics.findNearby = function(coordinates, maxDistance = 50000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: "active"
  }).sort({ location: 1 });
};

// Static method to find hospitals with specific emergency services
hospitalSchema.statics.findWithEmergencyService = function(service) {
  const query = {};
  query[`emergencyServices.${service}`] = true;
  query.status = "active";
  
  return this.find(query);
};

const Hospital = mongoose.model("Hospital", hospitalSchema);
export default Hospital; 
import mongoose from "mongoose";

const bloodBankSchema = new mongoose.Schema({
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
    enum: ["government", "private", "charitable", "hospital", "redcross"],
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
    }
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
    total: {
      type: Number,
      required: true
    },
    available: {
      type: Number,
      default: 0
    }
  },
  services: [{
    type: String,
    enum: ["whole_blood", "platelets", "plasma", "red_cells", "cryoprecipitate", "stem_cells"]
  }],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  emergencyServices: {
    type: Boolean,
    default: true
  },
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
      enum: ["manager", "technician", "nurse", "coordinator"]
    },
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
    autoUpdate: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
bloodBankSchema.index({ location: '2dsphere' });
bloodBankSchema.index({ code: 1 });
bloodBankSchema.index({ status: 1 });
bloodBankSchema.index({ type: 1 });

// Virtual for current capacity percentage
bloodBankSchema.virtual('capacityPercentage').get(function() {
  return this.capacity.available > 0 ? 
    Math.round((this.capacity.available / this.capacity.total) * 100) : 0;
});

// Method to check if blood bank is open
bloodBankSchema.methods.isOpen = function() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  
  const hours = this.operatingHours[day];
  if (!hours || !hours.open || !hours.close) return false;
  
  return time >= hours.open && time <= hours.close;
};

// Method to get emergency contact
bloodBankSchema.methods.getEmergencyContact = function() {
  return this.contact.emergency || this.contact.phone;
};

const BloodBank = mongoose.model("BloodBank", bloodBankSchema);
export default BloodBank; 
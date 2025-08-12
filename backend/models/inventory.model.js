import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
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
    enum: ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate", "stem_cells"]
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ["units", "bags", "ml", "cc"]
  },
  status: {
    type: String,
    enum: ["available", "reserved", "in_transit", "expired", "quarantine", "used"],
    default: "available"
  },
  collectionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  donorInfo: {
    name: String,
    age: Number,
    gender: String,
    contact: String
  },
  testing: {
    hiv: { type: Boolean, default: false },
    hbv: { type: Boolean, default: false },
    hcv: { type: Boolean, default: false },
    syphilis: { type: Boolean, default: false },
    malaria: { type: Boolean, default: false },
    testedDate: Date,
    testedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  storage: {
    temperature: {
      type: Number,
      required: true
    },
    humidity: Number,
    location: String,
    rack: String,
    shelf: String
  },
  quality: {
    hemoglobin: Number,
    hematocrit: Number,
    plateletCount: Number,
    whiteCellCount: Number,
    notes: String
  },
  cost: {
    collection: Number,
    processing: Number,
    storage: Number,
    total: Number
  },
  tags: [String],
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

// Indexes for performance
inventorySchema.index({ bloodBankId: 1, bloodType: 1, status: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ collectionDate: 1 });
inventorySchema.index({ status: 1, bloodType: 1 });

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for age of blood
inventorySchema.virtual('bloodAge').get(function() {
  const now = new Date();
  const collection = new Date(this.collectionDate);
  const diffTime = now - collection;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for expiry status
inventorySchema.virtual('expiryStatus').get(function() {
  const daysUntilExpiry = this.daysUntilExpiry;
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 3) return 'critical';
  if (daysUntilExpiry <= 7) return 'warning';
  return 'safe';
});

// Method to check if blood is expired
inventorySchema.methods.isExpired = function() {
  return new Date() > new Date(this.expiryDate);
};

// Method to check if blood is critical (expiring soon)
inventorySchema.methods.isCritical = function() {
  const daysUntilExpiry = this.daysUntilExpiry;
  return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
};

// Static method to get available inventory by blood type
inventorySchema.statics.getAvailableByType = function(bloodBankId, bloodType) {
  return this.aggregate([
    {
      $match: {
        bloodBankId: new mongoose.Types.ObjectId(bloodBankId),
        bloodType: bloodType,
        status: "available",
        expiryDate: { $gt: new Date() }
      }
    },
    {
      $group: {
        _id: "$component",
        totalQuantity: { $sum: "$quantity" },
        units: { $sum: 1 },
        earliestExpiry: { $min: "$expiryDate" }
      }
    }
  ]);
};

// Static method to get expiring soon inventory
inventorySchema.statics.getExpiringSoon = function(bloodBankId, days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    bloodBankId: bloodBankId,
    status: "available",
    expiryDate: { $lte: expiryDate, $gt: new Date() }
  }).sort({ expiryDate: 1 });
};

// Pre-save middleware to update total cost
inventorySchema.pre('save', function(next) {
  if (this.cost.collection && this.cost.processing && this.cost.storage) {
    this.cost.total = this.cost.collection + this.cost.processing + this.cost.storage;
  }
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory; 
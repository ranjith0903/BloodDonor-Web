import mongoose from "mongoose";

const bloodDemandSchema = new mongoose.Schema({
  bloodType: {
    type: String,
    required: true,
    enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  },
  date: {
    type: Date,
    required: true
  },
  demand: {
    type: Number,
    required: true
  },
  supply: {
    type: Number,
    required: true
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
  season: {
    type: String,
    enum: ["winter", "spring", "summer", "fall"]
  },
  events: [{
    name: String,
    impact: Number // -1 to 1 scale
  }],
  predictedDemand: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

bloodDemandSchema.index({ location: '2dsphere' });
bloodDemandSchema.index({ date: 1, bloodType: 1 });

const BloodDemand = mongoose.model("BloodDemand", bloodDemandSchema);
export default BloodDemand; 
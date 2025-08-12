import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["emergency", "campaign", "donation_reminder", "achievement", "system"],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium"
  },
  data: {
    bloodType: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign"
    },
    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency"
    },
    distance: Number,
    urgencyScore: Number
  },
  read: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: String,
    enum: ["accepted", "declined", "ignored"],
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration based on type
      const now = new Date();
      switch(this.type) {
        case "emergency": return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        case "campaign": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        case "donation_reminder": return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }
    }
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 });

// Smart notification filtering
notificationSchema.statics.createSmartNotification = async function(recipientId, type, data) {
  const user = await mongoose.model("User").findById(recipientId);
  
  // Check user preferences and notification history
  const recentNotifications = await this.find({
    recipientId,
    type,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).countDocuments();
  
  // Prevent spam: max 3 notifications of same type per day
  if (recentNotifications >= 3) {
    return null;
  }
  
  // Calculate relevance score based on user's blood type and location
  let relevanceScore = 0;
  if (data.bloodType && user.bloodType === data.bloodType) {
    relevanceScore += 50;
  }
  
  if (data.location && user.location) {
    const distance = calculateDistance(user.location.coordinates, data.location.coordinates);
    if (distance <= 10) relevanceScore += 30; // Within 10km
    else if (distance <= 50) relevanceScore += 15; // Within 50km
  }
  
  // Only create notification if relevance score is high enough
  if (relevanceScore >= 30) {
    return await this.create({
      recipientId,
      type,
      ...data
    });
  }
  
  return null;
};

// Calculate distance between two coordinates
const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification; 
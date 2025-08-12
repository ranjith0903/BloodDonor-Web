import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["donation_count", "emergency_response", "campaign_participation", "streak", "milestone"],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ["bronze", "silver", "gold", "platinum", "diamond"],
    default: "bronze"
  },
  criteria: {
    count: Number,
    timeFrame: String, // "lifetime", "monthly", "weekly"
    bloodType: String,
    distance: Number
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
});

achievementSchema.index({ userId: 1, type: 1 });
achievementSchema.index({ level: 1, points: -1 });

// Predefined achievements
const ACHIEVEMENTS = [
  {
    type: "donation_count",
    title: "First Blood",
    description: "Complete your first donation",
    icon: "🩸",
    points: 100,
    level: "bronze",
    criteria: { count: 1, timeFrame: "lifetime" }
  },
  {
    type: "donation_count",
    title: "Regular Donor",
    description: "Complete 5 donations",
    icon: "🏆",
    points: 250,
    level: "silver",
    criteria: { count: 5, timeFrame: "lifetime" }
  },
  {
    type: "donation_count",
    title: "Lifesaver",
    description: "Complete 10 donations",
    icon: "💎",
    points: 500,
    level: "gold",
    criteria: { count: 10, timeFrame: "lifetime" }
  },
  {
    type: "emergency_response",
    title: "Emergency Hero",
    description: "Respond to 3 emergency requests",
    icon: "🚨",
    points: 300,
    level: "silver",
    criteria: { count: 3, timeFrame: "lifetime" }
  },
  {
    type: "streak",
    title: "Consistent Donor",
    description: "Donate 3 times in 6 months",
    icon: "🔥",
    points: 200,
    level: "bronze",
    criteria: { count: 3, timeFrame: "monthly" }
  },
  {
    type: "campaign_participation",
    title: "Community Champion",
    description: "Participate in 5 campaigns",
    icon: "👥",
    points: 400,
    level: "gold",
    criteria: { count: 5, timeFrame: "lifetime" }
  },
  {
    type: "milestone",
    title: "Rare Blood Hero",
    description: "Donate rare blood type (AB-, B-, A-)",
    icon: "⭐",
    points: 150,
    level: "silver",
    criteria: { bloodType: "rare" }
  }
];

// Check and award achievements
achievementSchema.statics.checkAchievements = async function(userId, action, data = {}) {
  const user = await mongoose.model("User").findById(userId);
  const userAchievements = await this.find({ userId });
  const unlockedAchievements = userAchievements.map(ua => ua.type + "_" + ua.criteria.count);
  
  const newAchievements = [];
  
  for (const achievement of ACHIEVEMENTS) {
    const key = achievement.type + "_" + achievement.criteria.count;
    
    if (unlockedAchievements.includes(key)) continue;
    
    let shouldAward = false;
    
    switch (achievement.type) {
      case "donation_count":
        const donationCount = await getDonationCount(userId, achievement.criteria.timeFrame);
        shouldAward = donationCount >= achievement.criteria.count;
        break;
        
      case "emergency_response":
        const emergencyResponses = await getEmergencyResponseCount(userId, achievement.criteria.timeFrame);
        shouldAward = emergencyResponses >= achievement.criteria.count;
        break;
        
      case "streak":
        const streakCount = await getStreakCount(userId, achievement.criteria.timeFrame);
        shouldAward = streakCount >= achievement.criteria.count;
        break;
        
      case "campaign_participation":
        const campaignCount = await getCampaignParticipationCount(userId, achievement.criteria.timeFrame);
        shouldAward = campaignCount >= achievement.criteria.count;
        break;
        
      case "milestone":
        if (achievement.criteria.bloodType === "rare") {
          const rareBloodTypes = ["AB-", "B-", "A-"];
          shouldAward = rareBloodTypes.includes(user.bloodType);
        }
        break;
    }
    
    if (shouldAward) {
      const newAchievement = await this.create({
        userId,
        ...achievement,
        progress: {
          current: achievement.criteria.count,
          target: achievement.criteria.count
        }
      });
      
      newAchievements.push(newAchievement);
      
      // Create notification for achievement
      await mongoose.model("Notification").createSmartNotification(userId, "achievement", {
        title: `Achievement Unlocked: ${achievement.title}`,
        message: achievement.description,
        priority: "medium"
      });
    }
  }
  
  return newAchievements;
};

// Helper functions to get counts
const getDonationCount = async (userId, timeFrame) => {
  const query = { userId };
  if (timeFrame === "monthly") {
    query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  return await mongoose.model("Donation").countDocuments(query);
};

const getEmergencyResponseCount = async (userId, timeFrame) => {
  const query = { "matchedDonors.donorId": userId, "matchedDonors.status": "accepted" };
  if (timeFrame === "monthly") {
    query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  return await mongoose.model("Emergency").countDocuments(query);
};

const getStreakCount = async (userId, timeFrame) => {
  // Implementation for streak calculation
  return 0; // Placeholder
};

const getCampaignParticipationCount = async (userId, timeFrame) => {
  const query = { participants: userId };
  if (timeFrame === "monthly") {
    query.date = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  return await mongoose.model("Campaign").countDocuments(query);
};

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement; 
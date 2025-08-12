import BloodDemand from "../models/bloodDemand.model.js";
import User from "../models/user.model.js";

// Simple ML algorithm for blood demand prediction
const predictBloodDemand = (historicalData, bloodType, location, date) => {
  // Convert date string to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Calculate seasonal patterns
  const season = getSeason(dateObj);
  const seasonalFactor = getSeasonalFactor(season, bloodType);
  
  // Calculate trend from historical data
  const trend = calculateTrend(historicalData);
  
  // Calculate base demand
  const baseDemand = historicalData.reduce((sum, data) => sum + data.demand, 0) / historicalData.length;
  
  // Apply seasonal and trend adjustments
  const predictedDemand = baseDemand * seasonalFactor * (1 + trend);
  
  return Math.round(predictedDemand);
};

const calculateHospitalProximity = (location) => {
  // Simplified hospital proximity calculation
  // In production, use Google Places API or similar
  return Math.random() * 10 + 1; // Random distance 1-11 km
};

// Add back missing utility functions
const getSeason = (date) => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
};

const getSeasonalFactor = (season, bloodType) => {
  const factors = {
    winter: { "O+": 1.2, "A+": 1.1, "B+": 1.0, "AB+": 0.9, "O-": 1.1, "A-": 1.0, "B-": 0.9, "AB-": 0.8 },
    spring: { "O+": 1.0, "A+": 1.0, "B+": 1.0, "AB+": 1.0, "O-": 1.0, "A-": 1.0, "B-": 1.0, "AB-": 1.0 },
    summer: { "O+": 0.8, "A+": 0.9, "B+": 1.1, "AB+": 1.2, "O-": 0.9, "A-": 1.0, "B-": 1.1, "AB-": 1.2 },
    fall: { "O+": 1.1, "A+": 1.0, "B+": 1.0, "AB+": 0.9, "O-": 1.0, "A-": 1.0, "B-": 1.0, "AB-": 0.9 }
  };
  return factors[season][bloodType] || 1.0;
};

const calculateTrend = (historicalData) => {
  if (historicalData.length < 2) return 0;
  
  const sortedData = historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, data) => sum + data.demand, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, data) => sum + data.demand, 0) / secondHalf.length;
  
  return (secondAvg - firstAvg) / firstAvg;
};

export const predictDemand = async (req, res) => {
  try {
    console.log('AI Prediction request received:', req.body);
    const { bloodType, location, date } = req.body;
    
    // Simple prediction without complex geospatial queries for now
    const baseDemand = { 'O+': 25, 'A+': 20, 'B+': 15, 'AB+': 8, 'O-': 5, 'A-': 4, 'B-': 3, 'AB-': 2 };
    
    // Get historical data (simplified query)
    let historicalData = await BloodDemand.find({
      bloodType,
      date: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } // Last 6 months
    }).sort({ date: 1 });
    
    // If no historical data, create sample data for demonstration
    if (historicalData.length === 0) {
      console.log('Creating sample data for blood type:', bloodType);
      
      // Create sample historical data for the last 6 months
      const sampleData = [];
      
      for (let i = 5; i >= 0; i--) {
        const sampleDate = new Date();
        sampleDate.setMonth(sampleDate.getMonth() - i);
        
        // Add some variation to make it realistic
        const variation = 0.8 + Math.random() * 0.4; // 80% to 120% variation
        const demand = Math.round(baseDemand[bloodType] * variation);
        const supply = Math.round(demand * (0.7 + Math.random() * 0.6)); // 70% to 130% of demand
        
        const sampleRecord = {
          bloodType,
          date: sampleDate,
          demand,
          supply,
          location: {
            type: 'Point',
            coordinates: location.coordinates || [0, 0]
          },
          season: getSeason(sampleDate)
        };
        
        try {
          const demandData = new BloodDemand(sampleRecord);
          await demandData.save();
          sampleData.push(sampleRecord);
        } catch (saveError) {
          console.error('Error saving sample data:', saveError);
        }
      }
      
      historicalData = sampleData;
    }
    
    const predictedDemand = predictBloodDemand(historicalData, bloodType, location, new Date(date));
    
    // Get current available donors (simplified query)
    const availableDonors = await User.countDocuments({
      bloodType,
      available: true
    });
    
    const shortage = Math.max(0, predictedDemand - availableDonors);
    const confidence = Math.min(95, 70 + (historicalData.length * 2)); // More data = higher confidence
    
    const result = {
      predictedDemand,
      availableDonors,
      shortage,
      confidence: `${confidence}%`,
      recommendation: shortage > 0 ? "Urgent need for donors" : "Supply appears adequate",
      historicalDataPoints: historicalData.length
    };
    
    console.log('AI Prediction result:', result);
    res.json(result);
    
  } catch (error) {
    console.error('AI Prediction error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

export const updateDemandData = async (req, res) => {
  try {
    const { bloodType, demand, supply, location, date } = req.body;
    
    const season = getSeason(new Date(date));
    
    const demandData = new BloodDemand({
      bloodType,
      date: new Date(date),
      demand,
      supply,
      location,
      season
    });
    
    await demandData.save();
    
    res.json({ 
      message: "Demand data updated successfully",
      data: demandData 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
import BloodBank from "../models/bloodBank.model.js";
import Inventory from "../models/inventory.model.js";
import Transfer from "../models/transfer.model.js";
import mongoose from "mongoose";

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Find nearby blood banks
export const findNearbyBloodBanks = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000, bloodType } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Location coordinates required" });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    
    console.log('Searching for blood banks near:', coordinates);
    console.log('Max distance:', maxDistance);
    
    // First, let's get all blood banks to debug
    const allBloodBanks = await BloodBank.find({}).select('name location status');
    console.log('All blood banks in DB:', allBloodBanks.length);
    allBloodBanks.forEach(bank => {
      if (bank.location && bank.location.coordinates) {
        console.log(`${bank.name}: ${bank.location.coordinates}, status: ${bank.status}`);
      } else {
        console.log(`${bank.name}: NO LOCATION DATA, status: ${bank.status}`);
      }
    });
    
    // Find nearby blood banks using geospatial query
    const bloodBanks = await BloodBank.find({
      status: "active"
    }).select('-apiKey -staff -integrationSettings');
    
    // Filter by distance manually for now
    const nearbyBloodBanks = bloodBanks.filter(bank => {
      if (!bank.address || !bank.address.location || !bank.address.location.coordinates) {
        return false;
      }
      
      const bankCoords = bank.address.location.coordinates;
      const distance = calculateDistance(
        parseFloat(latitude), 
        parseFloat(longitude), 
        bankCoords[1], 
        bankCoords[0]
      );
      
      return distance <= parseInt(maxDistance) / 1000; // Convert meters to km
    });
    
    console.log(`Found ${nearbyBloodBanks.length} blood banks within ${maxDistance}m`);
    
    // Use the filtered results
    const finalBloodBanks = nearbyBloodBanks;
    
    console.log('Found nearby blood banks:', finalBloodBanks.length);

    // If blood type specified, check availability
    if (bloodType) {
      const bloodBanksWithAvailability = await Promise.all(
        finalBloodBanks.map(async (bank) => {
          const availability = await Inventory.aggregate([
            {
              $match: {
                bloodBankId: bank._id,
                bloodType: bloodType,
                status: "available",
                expiryDate: { $gt: new Date() }
              }
            },
            {
              $group: {
                _id: "$component",
                totalQuantity: { $sum: "$quantity" },
                units: { $sum: 1 }
              }
            }
          ]);

          return {
            ...bank.toObject(),
            availability: availability
          };
        })
      );

      return res.json({
        success: true,
        data: bloodBanksWithAvailability,
        count: bloodBanksWithAvailability.length
      });
    }

    res.json({
      success: true,
      data: finalBloodBanks,
      count: finalBloodBanks.length
    });

  } catch (error) {
    console.error("Error finding nearby blood banks:", error);
    res.status(500).json({ error: "Failed to find blood banks" });
  }
};

// Get blood bank details with inventory
export const getBloodBankDetails = async (req, res) => {
  try {
    const { bloodBankId } = req.params;
    
    const bloodBank = await BloodBank.findById(bloodBankId)
      .select('-apiKey -staff -integrationSettings');
    
    if (!bloodBank) {
      return res.status(404).json({ error: "Blood bank not found" });
    }

    // Get current inventory
    const inventory = await Inventory.aggregate([
      {
        $match: {
          bloodBankId: bloodBank._id,
          status: "available",
          expiryDate: { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: { bloodType: "$bloodType", component: "$component" },
          totalQuantity: { $sum: "$quantity" },
          units: { $sum: 1 },
          earliestExpiry: { $min: "$expiryDate" }
        }
      },
      {
        $group: {
          _id: "$_id.bloodType",
          components: {
            $push: {
              component: "$_id.component",
              quantity: "$totalQuantity",
              units: "$units",
              earliestExpiry: "$earliestExpiry"
            }
          }
        }
      }
    ]);

    // Check if blood bank is currently open
    const isOpen = bloodBank.isOpen();

    res.json({
      success: true,
      data: {
        ...bloodBank.toObject(),
        inventory: inventory,
        isOpen: isOpen,
        capacityPercentage: bloodBank.capacityPercentage
      }
    });

  } catch (error) {
    console.error("Error getting blood bank details:", error);
    res.status(500).json({ error: "Failed to get blood bank details" });
  }
};

// Check blood availability
export const checkBloodAvailability = async (req, res) => {
  try {
    const { bloodBankId, bloodType, component = "whole_blood" } = req.query;
    
    if (!bloodBankId || !bloodType) {
      return res.status(400).json({ error: "Blood bank ID and blood type required" });
    }

    const availability = await Inventory.aggregate([
      {
        $match: {
          bloodBankId: new mongoose.Types.ObjectId(bloodBankId),
          bloodType: bloodType,
          component: component,
          status: "available",
          expiryDate: { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          units: { $sum: 1 },
          earliestExpiry: { $min: "$expiryDate" },
          latestExpiry: { $max: "$expiryDate" }
        }
      }
    ]);

    const result = availability[0] || {
      totalQuantity: 0,
      units: 0,
      earliestExpiry: null,
      latestExpiry: null
    };

    res.json({
      success: true,
      data: {
        bloodType,
        component,
        available: result.totalQuantity > 0,
        quantity: result.totalQuantity,
        units: result.units,
        earliestExpiry: result.earliestExpiry,
        latestExpiry: result.latestExpiry
      }
    });

  } catch (error) {
    console.error("Error checking blood availability:", error);
    res.status(500).json({ error: "Failed to check availability" });
  }
};

// Request blood from blood bank
export const requestBlood = async (req, res) => {
  try {
    const { bloodBankId, bloodType, component, quantity, priority, purpose, patientInfo, pickupDetails } = req.body;
    
    // Generate unique request ID
    const requestId = `REQ${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const transfer = new Transfer({
      requestId,
      requester: {
        userId: req.user?._id,
        name: req.body.requesterName,
        phone: req.body.requesterPhone,
        email: req.body.requesterEmail,
        type: "individual"
      },
      bloodBankId,
      bloodType,
      component,
      quantity,
      unit: "units",
      priority: priority || "routine",
      purpose,
      patientInfo,
      pickupDetails
    });

    await transfer.save();

    res.status(201).json({
      success: true,
      data: {
        requestId: transfer.requestId,
        status: transfer.status,
        message: "Blood request submitted successfully"
      }
    });

  } catch (error) {
    console.error("Error requesting blood:", error);
    res.status(500).json({ error: "Failed to submit blood request" });
  }
};

// Get all blood banks (for admin)
export const getAllBloodBanks = async (req, res) => {
  try {
    const bloodBanks = await BloodBank.find({})
      .select('-apiKey -staff -integrationSettings')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: bloodBanks,
      count: bloodBanks.length
    });

  } catch (error) {
    console.error("Error getting all blood banks:", error);
    res.status(500).json({ error: "Failed to get blood banks" });
  }
};

// Create blood bank (for admin)
export const createBloodBank = async (req, res) => {
  try {
    const bloodBankData = req.body;
    
    // Generate unique code if not provided
    if (!bloodBankData.code) {
      bloodBankData.code = `BB${Date.now()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    }

    const bloodBank = new BloodBank(bloodBankData);
    await bloodBank.save();

    res.status(201).json({
      success: true,
      data: bloodBank,
      message: "Blood bank created successfully"
    });

  } catch (error) {
    console.error("Error creating blood bank:", error);
    res.status(500).json({ error: "Failed to create blood bank" });
  }
};

// Create sample blood banks for testing
export const createSampleBloodBanks = async (req, res) => {
  try {
    // Check if sample blood banks already exist
    const existingCount = await BloodBank.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: "Sample blood banks already exist",
        count: existingCount
      });
    }

    const sampleBloodBanks = [
      {
        name: "Mysore Medical College Blood Bank",
        code: "MMCBB001",
        type: "government",
        contact: {
          phone: "+91-821-2520500",
          email: "bloodbank@mysoremedicalcollege.edu.in",
          emergency: "+91-821-2520501"
        },
        address: {
          street: "Medical College Campus",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570001",
          location: {
            type: "Point",
            coordinates: [76.5854, 12.3723]
          }
        },
        capacity: {
          total: 1200,
          available: 850
        },
        services: ["whole_blood", "platelets", "plasma", "red_cells", "cryoprecipitate"],
        operatingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" }
        },
        emergencyServices: true,
        accreditation: "NABH",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "K.R. Hospital Blood Center",
        code: "KRHBB002",
        type: "government",
        contact: {
          phone: "+91-821-2520502",
          email: "bloodcenter@krhospital.gov.in",
          emergency: "+91-821-2520503"
        },
        address: {
          street: "K.R. Hospital Complex",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570001",
          location: {
            type: "Point",
            coordinates: [76.5954, 12.3823]
          }
        },
        capacity: {
          total: 800,
          available: 600
        },
        services: ["whole_blood", "platelets", "plasma", "red_cells"],
        operatingHours: {
          monday: { open: "07:00", close: "21:00" },
          tuesday: { open: "07:00", close: "21:00" },
          wednesday: { open: "07:00", close: "21:00" },
          thursday: { open: "07:00", close: "21:00" },
          friday: { open: "07:00", close: "21:00" },
          saturday: { open: "08:00", close: "19:00" },
          sunday: { open: "08:00", close: "19:00" }
        },
        emergencyServices: true,
        accreditation: "ISO",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "Red Cross Blood Bank Mysore",
        code: "RCBM003",
        type: "redcross",
        contact: {
          phone: "+91-821-2444444",
          email: "mysore@redcrossblood.org",
          emergency: "+91-821-2444445"
        },
        address: {
          street: "Red Cross Building, Irwin Road",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570001",
          location: {
            type: "Point",
            coordinates: [76.5754, 12.3623]
          }
        },
        capacity: {
          total: 600,
          available: 450
        },
        services: ["whole_blood", "platelets", "plasma"],
        operatingHours: {
          monday: { open: "09:00", close: "19:00" },
          tuesday: { open: "09:00", close: "19:00" },
          wednesday: { open: "09:00", close: "19:00" },
          thursday: { open: "09:00", close: "19:00" },
          friday: { open: "09:00", close: "19:00" },
          saturday: { open: "10:00", close: "17:00" },
          sunday: { open: "10:00", close: "17:00" }
        },
        emergencyServices: true,
        accreditation: "ISO",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "Apollo Hospital Blood Bank",
        code: "AHBB004",
        type: "private",
        contact: {
          phone: "+91-821-2528888",
          email: "bloodbank@apollomysore.com",
          emergency: "+91-821-2528889"
        },
        address: {
          street: "Apollo Hospital, Kuvempunagar",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570023",
          location: {
            type: "Point",
            coordinates: [76.6054, 12.3523]
          }
        },
        capacity: {
          total: 400,
          available: 300
        },
        services: ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate"],
        operatingHours: {
          monday: { open: "08:30", close: "18:30" },
          tuesday: { open: "08:30", close: "18:30" },
          wednesday: { open: "08:30", close: "18:30" },
          thursday: { open: "08:30", close: "18:30" },
          friday: { open: "08:30", close: "18:30" },
          saturday: { open: "09:30", close: "16:30" },
          sunday: { open: "09:30", close: "16:30" }
        },
        emergencyServices: true,
        accreditation: "JCI",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "JSS Hospital Blood Bank",
        code: "JSSBB005",
        type: "charitable",
        contact: {
          phone: "+91-821-2548333",
          email: "bloodbank@jsshospital.com",
          emergency: "+91-821-2548334"
        },
        address: {
          street: "JSS Hospital, Bannimantap",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570015",
          location: {
            type: "Point",
            coordinates: [76.5654, 12.3923]
          }
        },
        capacity: {
          total: 700,
          available: 550
        },
        services: ["whole_blood", "platelets", "plasma", "red_cells"],
        operatingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" }
        },
        emergencyServices: true,
        accreditation: "NABH",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      }
    ];

    const createdBloodBanks = await BloodBank.insertMany(sampleBloodBanks);

    // Create sample inventory for each blood bank
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const components = ['whole_blood', 'red_cells', 'platelets', 'plasma'];
    
    for (const bloodBank of createdBloodBanks) {
      for (const bloodType of bloodTypes) {
        for (const component of components) {
          const quantity = Math.floor(Math.random() * 25) + 8; // 8-33 units
          const collectionDate = new Date();
          collectionDate.setDate(collectionDate.getDate() - Math.floor(Math.random() * 30)); // 0-30 days ago
          
          const expiryDate = new Date(collectionDate);
          if (component === 'platelets') {
            expiryDate.setDate(expiryDate.getDate() + 5); // Platelets expire in 5 days
          } else if (component === 'plasma') {
            expiryDate.setDate(expiryDate.getDate() + 365); // Plasma expires in 1 year
          } else {
            expiryDate.setDate(expiryDate.getDate() + 42); // Whole blood/red cells expire in 42 days
          }

          const inventory = new Inventory({
            bloodBankId: bloodBank._id,
            bloodType,
            component,
            quantity,
            unit: "units",
            status: "available",
            collectionDate,
            expiryDate,
            storage: {
              temperature: component === 'platelets' ? 22 : 4,
              humidity: 60,
              location: "Main Storage",
              rack: "A",
              shelf: "1"
            },
            cost: {
              collection: 500,
              processing: 300,
              storage: 50,
              total: 850
            }
          });

          await inventory.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      data: createdBloodBanks,
      message: "Sample blood banks and inventory created successfully for Mysore region",
      count: createdBloodBanks.length
    });

  } catch (error) {
    console.error("Error creating sample blood banks:", error);
    res.status(500).json({ error: "Failed to create sample blood banks" });
  }
}; 

// Delete all blood banks and recreate sample data
export const recreateSampleBloodBanks = async (req, res) => {
  try {
    // Delete all existing blood banks and inventory
    await BloodBank.deleteMany({});
    await Inventory.deleteMany({});
    
    console.log('Deleted all existing blood banks and inventory');

    const sampleBloodBanks = [
      {
        name: "Mysore Medical College Blood Bank",
        code: "MMCBB001",
        type: "government",
        contact: {
          phone: "+91-821-2520500",
          email: "bloodbank@mysoremedicalcollege.edu.in",
          emergency: "+91-821-2520501"
        },
        address: {
          street: "Medical College Campus",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570001",
          location: {
            type: "Point",
            coordinates: [76.5854, 12.3723]
          }
        },
        capacity: {
          total: 1200,
          available: 850
        },
        services: ["whole_blood", "platelets", "plasma", "red_cells", "cryoprecipitate"],
        operatingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" }
        },
        emergencyServices: true,
        accreditation: "NABH",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "K.R. Hospital Blood Center",
        code: "KRHBB002",
        type: "government",
        contact: {
          phone: "+91-821-2520502",
          email: "bloodcenter@krhospital.gov.in",
          emergency: "+91-821-2520503"
        },
        address: {
          street: "K.R. Hospital Complex",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570001",
          location: {
            type: "Point",
            coordinates: [76.5954, 12.3823]
          }
        },
        capacity: {
          total: 800,
          available: 600
        },
        services: ["whole_blood", "platelets", "plasma", "red_cells"],
        operatingHours: {
          monday: { open: "07:00", close: "21:00" },
          tuesday: { open: "07:00", close: "21:00" },
          wednesday: { open: "07:00", close: "21:00" },
          thursday: { open: "07:00", close: "21:00" },
          friday: { open: "07:00", close: "21:00" },
          saturday: { open: "08:00", close: "19:00" },
          sunday: { open: "08:00", close: "19:00" }
        },
        emergencyServices: true,
        accreditation: "ISO",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "Red Cross Blood Bank Mysore",
        code: "RCBM003",
        type: "redcross",
        contact: {
          phone: "+91-821-2444444",
          email: "mysore@redcrossblood.org",
          emergency: "+91-821-2444445"
        },
        address: {
          street: "Red Cross Building, Irwin Road",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570001",
          location: {
            type: "Point",
            coordinates: [76.5754, 12.3623]
          }
        },
        capacity: {
          total: 600,
          available: 450
        },
        services: ["whole_blood", "platelets", "plasma"],
        operatingHours: {
          monday: { open: "09:00", close: "19:00" },
          tuesday: { open: "09:00", close: "19:00" },
          wednesday: { open: "09:00", close: "19:00" },
          thursday: { open: "09:00", close: "19:00" },
          friday: { open: "09:00", close: "19:00" },
          saturday: { open: "10:00", close: "17:00" },
          sunday: { open: "10:00", close: "17:00" }
        },
        emergencyServices: true,
        accreditation: "ISO",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "Apollo Hospital Blood Bank",
        code: "AHBB004",
        type: "private",
        contact: {
          phone: "+91-821-2528888",
          email: "bloodbank@apollomysore.com",
          emergency: "+91-821-2528889"
        },
        address: {
          street: "Apollo Hospital, Kuvempunagar",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570023",
          location: {
            type: "Point",
            coordinates: [76.6054, 12.3523]
          }
        },
        capacity: {
          total: 400,
          available: 300
        },
        services: ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate"],
        operatingHours: {
          monday: { open: "08:30", close: "18:30" },
          tuesday: { open: "08:30", close: "18:30" },
          wednesday: { open: "08:30", close: "18:30" },
          thursday: { open: "08:30", close: "18:30" },
          friday: { open: "08:30", close: "18:30" },
          saturday: { open: "09:30", close: "16:30" },
          sunday: { open: "09:30", close: "16:30" }
        },
        emergencyServices: true,
        accreditation: "JCI",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      },
      {
        name: "JSS Hospital Blood Bank",
        code: "JSSBB005",
        type: "charitable",
        contact: {
          phone: "+91-821-2548333",
          email: "bloodbank@jsshospital.com",
          emergency: "+91-821-2548334"
        },
        address: {
          street: "JSS Hospital, Bannimantap",
          city: "Mysore",
          state: "Karnataka",
          country: "India",
          zipCode: "570015",
          location: {
            type: "Point",
            coordinates: [76.5654, 12.3923]
          }
        },
        capacity: {
          total: 700,
          available: 550
        },
        services: ["whole_blood", "platelets", "plasma", "red_cells"],
        operatingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "09:00", close: "18:00" }
        },
        emergencyServices: true,
        accreditation: "NABH",
        status: "active",
        admin: req.user?._id || "507f1f77bcf86cd799439011"
      }
    ];

    const createdBloodBanks = await BloodBank.insertMany(sampleBloodBanks);
    console.log('Created blood banks:', createdBloodBanks.length);

    // Create sample inventory for each blood bank
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const components = ['whole_blood', 'red_cells', 'platelets', 'plasma'];
    
    for (const bloodBank of createdBloodBanks) {
      for (const bloodType of bloodTypes) {
        for (const component of components) {
          const quantity = Math.floor(Math.random() * 25) + 8; // 8-33 units
          const collectionDate = new Date();
          collectionDate.setDate(collectionDate.getDate() - Math.floor(Math.random() * 30)); // 0-30 days ago
          
          const expiryDate = new Date(collectionDate);
          if (component === 'platelets') {
            expiryDate.setDate(expiryDate.getDate() + 5); // Platelets expire in 5 days
          } else if (component === 'plasma') {
            expiryDate.setDate(expiryDate.getDate() + 365); // Plasma expires in 1 year
          } else {
            expiryDate.setDate(expiryDate.getDate() + 42); // Whole blood/red cells expire in 42 days
          }

          const inventory = new Inventory({
            bloodBankId: bloodBank._id,
            bloodType,
            component,
            quantity,
            unit: "units",
            status: "available",
            collectionDate,
            expiryDate,
            storage: {
              temperature: component === 'platelets' ? 22 : 4,
              humidity: 60,
              location: "Main Storage",
              rack: "A",
              shelf: "1"
            },
            cost: {
              collection: 500,
              processing: 300,
              storage: 50,
              total: 850
            }
          });

          await inventory.save();
        }
      }
    }

    console.log('Created inventory for all blood banks');

    res.status(201).json({
      success: true,
      data: createdBloodBanks,
      message: "Sample blood banks and inventory recreated successfully for Mysore region",
      count: createdBloodBanks.length
    });

  } catch (error) {
    console.error("Error recreating sample blood banks:", error);
    res.status(500).json({ error: "Failed to recreate sample blood banks" });
  }
}; 
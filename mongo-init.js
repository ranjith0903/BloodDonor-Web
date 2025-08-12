// MongoDB initialization script
db = db.getSiblingDB('blooddonor');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('bloodbanks');
db.createCollection('campaigns');
db.createCollection('emergencies');
db.createCollection('donationappointments');
db.createCollection('inventory');
db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "location": "2dsphere" });
db.users.createIndex({ "bloodType": 1 });
db.users.createIndex({ "available": 1 });

db.bloodbanks.createIndex({ "location": "2dsphere" });
db.bloodbanks.createIndex({ "status": 1 });

db.campaigns.createIndex({ "location": "2dsphere" });
db.campaigns.createIndex({ "status": 1 });
db.campaigns.createIndex({ "startDate": 1 });

db.emergencies.createIndex({ "status": 1, "priority": 1, "createdAt": -1 });
db.emergencies.createIndex({ "location": "2dsphere" });

db.donationappointments.createIndex({ "donor.userId": 1, "appointment.date": 1 });
db.donationappointments.createIndex({ "hospital.hospitalId": 1, "appointment.date": 1 });
db.donationappointments.createIndex({ "appointment.status": 1, "appointment.date": 1 });

db.inventory.createIndex({ "bloodBankId": 1, "bloodType": 1 });
db.inventory.createIndex({ "expiryDate": 1 });

db.notifications.createIndex({ "recipientId": 1, "read": 1, "createdAt": -1 });

// Create admin user
db.users.insertOne({
  fullName: "Admin User",
  email: "admin@blooddonor.com",
  password: "$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ",
  phoneNumber: "+1234567890",
  bloodType: "O+",
  role: "admin",
  available: true,
  location: {
    type: "Point",
    coordinates: [77.2090, 28.6139] // Delhi coordinates
  },
  address: {
    street: "Admin Street",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    zipCode: "110001"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create sample blood banks
db.bloodbanks.insertMany([
  {
    name: "AIIMS Blood Bank",
    address: {
      street: "Sri Aurobindo Marg",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      zipCode: "110029",
      location: {
        type: "Point",
        coordinates: [77.2090, 28.6139]
      }
    },
    phone: "+91-11-26588500",
    email: "bloodbank@aiims.edu",
    capacity: {
      total: 1000,
      available: 750
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
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Safdarjung Hospital Blood Bank",
    address: {
      street: "Ansari Nagar West",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      zipCode: "110029",
      location: {
        type: "Point",
        coordinates: [77.2090, 28.6139]
      }
    },
    phone: "+91-11-26707444",
    email: "bloodbank@safdarjung.gov.in",
    capacity: {
      total: 800,
      available: 600
    },
    services: ["whole_blood", "platelets", "plasma"],
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
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("MongoDB initialization completed successfully!");

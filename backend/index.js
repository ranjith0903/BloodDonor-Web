import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from 'cors'


import { connectDb } from "./lib/connectDb.js";
import authRoutes from "./routes/auth.routes.js"
import findDonorsRoutes from "./routes/findDonors.routes.js"
import locationRoutes from "./routes/location.routes.js"
import campaignRoutes from "./routes/campaign.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import aiPredictionRoutes from "./routes/aiPrediction.routes.js"
import donationAppointmentRoutes from "./routes/donationAppointment.routes.js"
import emergencyRoutes from "./routes/emergency.routes.js"
import bloodBankRoutes from "./routes/bloodBank.routes.js"
import contactRequestRoutes from "./routes/contactRequest.routes.js"
import emergencyAlertRoutes from "./routes/emergencyAlert.routes.js"
import emergencyCallRoutes from "./routes/emergencyCall.routes.js"
import path from "path"
dotenv.config();
const _dirname = path.resolve(); 




const app=express();

const PORT=7000
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('uploads'))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth',authRoutes);
app.use('/api/findDonors',findDonorsRoutes)
app.use('/api/locations', locationRoutes);
app.use('/api/campaign',campaignRoutes)
app.use('/api/admin',adminRoutes);
app.use('/api/ai-prediction', aiPredictionRoutes);
app.use('/api/donation-appointments', donationAppointmentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/blood-banks', bloodBankRoutes);
app.use('/api/contact-requests', contactRequestRoutes);
app.use('/api/emergency-alerts', emergencyAlertRoutes);
app.use('/api/emergency-calls', emergencyCallRoutes);
app.use(express.static(path.join(_dirname, "/frontend/dist"))); 
app.get("*", (req, res) => {
    res.sendFile(path.resolve(_dirname  , 'frontend',"dist",'index.html'));
})

app.listen(PORT,()=>{
    console.log(`server is listening at port ${PORT}`)
    connectDb();
});


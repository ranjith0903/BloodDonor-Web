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
import path from "path"
dotenv.config();
const _dirname = path.resolve(); 


const app=express();

const PORT=process.env.PORT||7000
app.use(cors({ origin: '*'}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('uploads'))
app.use('/api/auth',authRoutes);
app.use('/api/findDonors',findDonorsRoutes)
app.use('/api/locations', locationRoutes);
app.use('/api/campaign',campaignRoutes)
app.use('/api/admin',adminRoutes);
app.use(express.static(path.join(_dirname, "/frontend/dist"))); 
app.get("*", (req, res) => {
    res.sendFile(path.resolve(_dirname  , 'frontend',"dist",'index.html'));
})

app.listen(PORT,()=>{
    console.log(`server is listening at port ${PORT}`)
    connectDb();
});


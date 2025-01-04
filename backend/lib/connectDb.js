import mongoose from "mongoose";
export const connectDb=async()=>{
    try {
        const con=await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDb connected succesfully ${con.connection.host}`)
        
    } catch (error) {
        
        process.exit(1);
       
    }
}
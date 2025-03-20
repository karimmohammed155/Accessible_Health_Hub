import mongoose from 'mongoose';

export const connectDB=async()=>{
    return await mongoose
    .connect(process.env.CONNECTION_URL)
    .then(()=>{console.log("MongoDB connected successfully")})
    .catch((err)=>{console.log("Error connection to mongoDB",err)});
}

import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    if (mongoose.connection.readyState >= 1) return;

    const uri = process.env.MONGO_URI as string | undefined;
    if (!uri) {
        console.error("❌ MONGO_URI is not defined in environment variables.");
        throw new Error("MONGO_URI not found");
    }
    try {
        await mongoose.connect(uri);
        console.log("✅ MongoDB connected successfully!");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
    }
};

export default connectDB;

import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },//email hear not name
    password: { type: String, required: true }, 
    refreshTokens: [{ token: String, createdAt: Date }],
});

export default models.User || mongoose.model("User", userSchema);

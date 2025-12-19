import mongoose, { Schema, models } from "mongoose";

const reelSchema = new Schema(
    {
        userPic: { type: String, default: "" },
        
        email: { //email
            type: String,
            required: true,
        },
        username: { //username
            type: String,
            required: true,
            trim: true,
        },

        video: { type: String, required: true },

        likes: [
            {
                userPic: { type: String, default: "" },
                username: { type: String, required: true },
            },
        ],

        comments: [
            {
                userPic: { type: String, default: "" },
                username: { type: String, required: true },
                comment: { type: String, required: true },
                commentTime: { type: Date, default: Date.now },
            },
        ],

        description: { type: String, default: "" },

        keywords: { type: [String], default: [] },
    },
    { timestamps: true }
);

export default models.Reels || mongoose.model("Reels", reelSchema);

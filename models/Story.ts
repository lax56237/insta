import mongoose, { Schema, models } from "mongoose";

const storySchema = new Schema(
    {
        email: { //email
            type: String,
            required: true,
            // unique: true,
        },
        username: { //username(unique name)
            type: String,
            required: true,
            // unique: true,
            trim: true,
        },
        story: { type: String, required: true }, // image or video URL
        expires: { type: Date, required: true }, // Date.now() + 24h

        views: [
            {
                userPic: { type: String },
                username: { type: String },
                seenAt: { type: Date, default: Date.now },
            },
        ],

    },
    {
        timestamps: true,
    }
);

export default models.Story || mongoose.model("Story", storySchema);

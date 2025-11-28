import mongoose, { Schema, models } from "mongoose";

const storySchema = new Schema(
    {
        story: { type: String, required: true }, // image or video URL
        expires: { type: Date, required: true }, // Date.now() + 24h
        views: [
            {
                userPic: String,
                username: String,
                seenAt: { type: Date, default: Date.now },
            },
        ],
    },
    { _id: false }
);

const postSchema = new Schema(
    {
        img: { type: String, required: true }, // image URL
        likes: [
            {
                userPic: String,
                username: String,
            },
        ],
        comments: [
            {
                userPic: String,
                username: String,
                comment: String,
                commentTime: { type: Date, default: Date.now },
            },
        ],
        description: { type: String, default: "" },
        keywords: [String], // auto-generated from description words
    },
    { timestamps: true }
);

const reelSchema = new Schema(
    {
        video: { type: String, required: true }, // video URL
        likes: [
            {
                userPic: String,
                username: String,
            },
        ],
        comments: [
            {
                userPic: String,
                username: String,
                comment: String,
                commentTime: { type: Date, default: Date.now },
            },
        ],
        description: { type: String, default: "" },
        keywords: [String],
    },
    { timestamps: true }
);

const userDataSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true },
        stories: [storySchema],
        posts: [postSchema],
        reels: [reelSchema],
    },
    { timestamps: true }
);

const UserData = models.UserData || mongoose.model("UserData", userDataSchema);
export default UserData;

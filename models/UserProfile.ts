import mongoose, { Schema, models } from "mongoose";

const userRefSchema = new Schema(
    {
        userPic: { type: String, default: "" },
        username: { type: String, required: true },
    },
    { _id: false }
);

const userProfileSchema = new Schema(
    {
        email: { //email
            type: String,
            required: true,
            unique: true,
        },
        username: { //username(unique name)
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        bio: {
            type: String,
            default: "",
            maxlength: 200,
        },
        profilePic: {
            type: String,
            default: "",
        },
        followers: {
            type: [userRefSchema],
            default: [],
        },
        following: {
            type: [userRefSchema],
            default: [],
        },
        profileType: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },
        notifications: {
            type: [
                {
                    userPic: { type: String, required: true },
                    username: { type: String, required: true },
                    time: { type: Date, default: Date.now }
                }
            ],
            default: []
        }


    },
    { timestamps: true }
);

export default models.UserProfile ||
    mongoose.model("UserProfile", userProfileSchema);

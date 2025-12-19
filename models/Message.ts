import mongoose, { Schema, models } from "mongoose";

const messageSchema = new Schema({
    users: {                    // usernames of both users
        type: [String],
        required: true,
    },

    profilePics: {              // their profile pictures
        type: [String],
        required: true,
    },
    emails: {                   // emails of users
        type: [String],
        required: true,
    },

    messageId: {                // auto-generated ID (username1 + username2)
        type: String,
        required: true,
        unique: true,
    },

    chat: [
        {
            username: { type: String, required: true }, // who sent message
            messageType: {
                type: String,
            },
            message: { type: String }, // actual content (text / imageURL / videoURL / reelURL)
            sentAt: { type: Date, default: Date.now }, // when message sent
        }
    ]
},
    { timestamps: true }
);

export default models.Message || mongoose.model("Message", messageSchema);

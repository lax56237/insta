import mongoose, { Schema, Document, models } from "mongoose";

interface Like {
    userPic: string;
    username: string;
}

interface Comment {
    userPic: string;
    username: string;
    comment: string;
    commentTime: Date;
}

export interface IPost extends Document {
    email: string;
    username: string;

    img: string;
    likes: Like[];
    comments: Comment[];

    description: string;
    keywords: string[];

    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
        email: { type: String, required: true },
        username: { type: String, required: true },

        img: { type: String, required: true },

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

        keywords: { type: [String], default: [] },
    },
    { timestamps: true }
);

const Post = models.Post || mongoose.model<IPost>("Post", postSchema);
export default Post;

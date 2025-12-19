import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import UserProfile from "@/models/UserProfile";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const postId = searchParams.get("postId");
        const username = searchParams.get("username");
        const comment = searchParams.get("comment");

        if (!postId || !username || !comment) {
            return NextResponse.json(
                { success: false, message: "Missing fields" },
                { status: 400 }
            );
        }

        const userProfile = await UserProfile.findOne({ username });
        if (!userProfile) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const userPic = userProfile.profilePic || "";

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $push: {
                    comments: {
                        userPic,
                        username,
                        comment,
                        commentTime: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!updatedPost) {
            return NextResponse.json(
                { success: false, message: "Post not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                comments: updatedPost.comments,
            },
            { status: 200 }
        );

    } catch (err: any) {
        console.error("COMMENT ERROR:", err);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

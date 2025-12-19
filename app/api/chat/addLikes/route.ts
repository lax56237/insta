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
        const status = searchParams.get("status"); 

        if (!postId || !username || !status) {
            return NextResponse.json(
                { error: "Missing parameters" },
                { status: 400 }
            );
        }

        const userProfile = await UserProfile.findOne({ username });
        if (!userProfile) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userPic = userProfile.profilePic;

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        // -------- LIKE LOGIC ----------
        if (status === "like") {
            const alreadyLiked = post.likes.some(
                (l: any) => l.username === username
            );

            if (!alreadyLiked) {
                post.likes.push({
                    userPic,
                    username,
                });
            }
        }

        // -------- UNLIKE LOGIC ----------
        if (status === "unlike") {
            post.likes = post.likes.filter(
                (l: any) => l.username !== username
            );
        }

        await post.save();

        return NextResponse.json(
            {
                success: true,
                likesCount: post.likes.length,
                likes: post.likes,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("addLikes ERROR:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import UserProfile from "@/models/UserProfile";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const username = searchParams.get("username");

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const targetProfile = await UserProfile.findOne({ username });
        if (!targetProfile) {
            return NextResponse.json({ error: "Target profile not found" }, { status: 404 });
        }

        if (targetProfile.profileType === "public") {
            const post = await Post.find({ username });
            return NextResponse.json({ type: "public", posts: post }, { status: 200 });
        }

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) {
            return NextResponse.json({ type: "private", allowed: false }, { status: 200 });
        }

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) {
            return NextResponse.json({ type: "private", allowed: false }, { status: 200 });
        }

        const accessToken = match[1];
        const decoded = verifyToken(accessToken);
        if (!decoded) {
            return NextResponse.json({ type: "private", allowed: false }, { status: 200 });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ type: "private", allowed: false }, { status: 200 });
        }

        const currentProfile = await UserProfile.findOne({ email: user.username });
        if (!currentProfile) {
            return NextResponse.json({ type: "private", allowed: false }, { status: 200 });
        }

        // Check follower status
        const isFollowing = targetProfile.following.some(
            (f: { username: any; }) => f.username === currentProfile.username
        );

        if (!isFollowing) {
            return NextResponse.json({ type: "private", allowed: false }, { status: 200 });
        }

        // Allowed → Return posts
        const posts = await Post.find({ username });
        return NextResponse.json({ type: "private", allowed: true, posts }, { status: 200 });

    } catch (err) {
        console.error("getSearchedProfile failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

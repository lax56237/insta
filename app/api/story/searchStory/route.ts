import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Story from "@/models/Story";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const targetUsername = searchParams.get("username");

        if (!targetUsername)
            return NextResponse.json({ error: "Missing username" }, { status: 400 });

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader)
            return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match)
            return NextResponse.json({ error: "No access token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        // Logged in user
        const currentUser = await User.findById(decoded.userId);
        const currentProfile = await UserProfile.findOne({ email: currentUser.username });

        // Target profile
        const targetProfile = await UserProfile.findOne({ username: targetUsername });
        if (!targetProfile)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const profileType = targetProfile.profileType;

        // PRIVACY CHECK
        if (profileType === "private") {
            const isFollowing = targetProfile.followers.some(
                (                f: { username: any; }) => f.username === currentProfile.username
            );

            if (!isFollowing) {
                return NextResponse.json(
                    { error: "This user's stories are private" },
                    { status: 403 }
                );
            }
        }

        // STORIES
        const now = new Date();
        const stories = await Story.find({
            username: targetUsername,
            expires: { $gt: now }
        }).sort({ createdAt: -1 });

        if (!stories.length) {
            return NextResponse.json({
                message: "No active stories",
                stories: [],
                hasUnseen: false
            });
        }

        let unseenCount = 0;

        const cleanStories = stories.map(s => {
            const seenByUser = s.views.some((v: { username: any; }) => v.username === currentProfile.username);
            if (!seenByUser) unseenCount++;

            return {
                _id: s._id,
                story: s.story,
                expires: s.expires,
                createdAt: s.createdAt
            };
        });

        const hasUnseen = unseenCount > 0;

        return NextResponse.json({
            message: "Stories fetched",
            stories: cleanStories,
            hasUnseen
        });

    } catch (err) {
        console.error("searchStory error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Story from "@/models/Story";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader)
            return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match)
            return NextResponse.json({ error: "No access token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const storyId = searchParams.get("storyId");

        if (!storyId)
            return NextResponse.json({ error: "storyId missing" }, { status: 400 });

        const user = await User.findById(decoded.userId);
        const userProfile = await UserProfile.findOne({ email: user.username });

        if (!userProfile)
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const viewerUsername = userProfile.username;
        const viewerPic = userProfile.profilePic;

        const story = await Story.findById(storyId);

        if (!story)
            return NextResponse.json({ error: "Story not found" }, { status: 404 });

        const alreadySeen = story.views.some(
            (v: any) => v.username === viewerUsername
        );

        if (!alreadySeen) {
            story.views.push({
                username: viewerUsername,
                userPic: viewerPic,
                seenAt: new Date(),
            });

            await story.save();
        }

        return NextResponse.json({ message: "View counted" }, { status: 200 });

    } catch (err) {
        console.error("seenStory failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
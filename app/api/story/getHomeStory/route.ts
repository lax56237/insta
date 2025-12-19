import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import UserProfile from "@/models/UserProfile";
import Story from "@/models/Story";

export async function GET(req: Request) {
    try {
        await connectDB();

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader)
            return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match)
            return NextResponse.json({ error: "No access token" }, { status: 401 });

        const accessToken = match[1];
        const decoded = verifyToken(accessToken);
        if (!decoded)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        // Get current user
        const user = await User.findById(decoded.userId);
        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const currentUserProfile = await UserProfile.findOne({ email: user.username });
        if (!currentUserProfile)
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const currentUsername = currentUserProfile.username;

        // Get list of users current user is following
        const followingList = currentUserProfile.following.map((f: any) => f.username);

        if (followingList.length === 0) {
            return NextResponse.json({ userStories: [] }, { status: 200 });
        }

        // Get all active stories from followed users (not expired)
        const now = new Date();
        const allStories = await Story.find({
            username: { $in: followingList },
            expires: { $gt: now }
        }).sort({ createdAt: -1 });

        // Group stories by username
        const storiesGroupedByUser: { [username: string]: any[] } = {};

        allStories.forEach(story => {
            if (!storiesGroupedByUser[story.username]) {
                storiesGroupedByUser[story.username] = [];
            }
            storiesGroupedByUser[story.username].push(story);
        });

        // Get user profiles for each user who has stories
        const usersWithStories = Object.keys(storiesGroupedByUser);
        const userProfiles = await UserProfile.find({
            username: { $in: usersWithStories }
        }).select('username profilePic');

        // Create a map of username to profile pic
        const profilePicMap: { [username: string]: string } = {};
        userProfiles.forEach(profile => {
            profilePicMap[profile.username] = profile.profilePic;
        });

        // Build the response with unseen stories first
        const userStories = usersWithStories.map(username => {
            const stories = storiesGroupedByUser[username];

            // Check if current user has seen all stories
            const hasUnseen = stories.some(story =>
                !story.views.some((view: any) => view.username === currentUsername)
            );

            return {
                username,
                profilePic: profilePicMap[username] || "",
                stories: stories.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                ),
                hasUnseen
            };
        });

        // Sort: unseen stories first, then seen stories
        userStories.sort((a, b) => {
            if (a.hasUnseen && !b.hasUnseen) return -1;
            if (!a.hasUnseen && b.hasUnseen) return 1;
            return 0;
        });

        return NextResponse.json({ userStories }, { status: 200 });

    } catch (err) {
        console.error("getHomeStory failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}


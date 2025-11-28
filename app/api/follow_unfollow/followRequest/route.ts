import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const targetUsername = searchParams.get("username");
        const action = searchParams.get("action");


        if (!targetUsername || !action) {
            return NextResponse.json(
                { error: "Missing username or action" },
                { status: 400 }
            );
        }

        // Get token
        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) return NextResponse.json({ error: "No token" }, { status: 401 });

        // Verify token
        const decoded = verifyToken(match[1]);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        // Find current user
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const currentUserProfile = await UserProfile.findOne({ email: user.username });
        if (!currentUserProfile)
            return NextResponse.json({ error: "Current profile not found" }, { status: 404 });

        // Find target
        const targetUserProfile = await UserProfile.findOne({ username: targetUsername });
        if (!targetUserProfile)
            return NextResponse.json({ error: "Target profile not found" }, { status: 404 });

        if (targetUserProfile.profileType === "private" && action === "follow") {

            const userPic = currentUserProfile.profilePic;
            const username = currentUserProfile.username;
            const time = new Date();

            const notification = { userPic, username, time };

            targetUserProfile.notifications.push(notification);
            await targetUserProfile.save();

            return NextResponse.json({
                success: true,
                requested: true
            });
        }


        const currUserObj = {
            username: currentUserProfile.username,
            userPic: currentUserProfile.profilePic
        };

        const targetUserObj = {
            username: targetUserProfile.username,
            userPic: targetUserProfile.profilePic
        };

        // FOLLOW LOGIC
        if (action === "follow") {
            // Add current user to target user's followers if not already
            if (!targetUserProfile.followers.some((u: { username: any; }) => u.username === currUserObj.username)) {
                targetUserProfile.followers.push(currUserObj);
            }

            // Add target user to current user's following
            if (!currentUserProfile.following.some((u: { username: any; }) => u.username === targetUserObj.username)) {
                currentUserProfile.following.push(targetUserObj);
            }
        }

        // UNFOLLOW LOGIC
        if (action === "unfollow") {
            // Remove current user from target followers
            targetUserProfile.followers =
                targetUserProfile.followers.filter((u: { username: any; }) => u.username !== currUserObj.username);

            // Remove target user from current user's following
            currentUserProfile.following =
                currentUserProfile.following.filter((u: { username: any; }) => u.username !== targetUserObj.username);
        }

        // Save both profiles
        await targetUserProfile.save();
        await currentUserProfile.save();

        return NextResponse.json({
            success: true,
            requested: false
        });

    } catch (err) {
        console.error("followRequest ERROR:", err);
        return NextResponse.json({ error: "Server issue" }, { status: 500 });
    }
}

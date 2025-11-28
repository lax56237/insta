import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();
        const { username, action } = body;
        if (!username || !action) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) return NextResponse.json({ error: "No access token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const currentUser = await UserProfile.findOne({ email: user.username });
        if (!currentUser) return NextResponse.json({ error: "Current profile not found" }, { status: 404 });

        const senderProfile = await UserProfile.findOne({ username });
        if (!senderProfile) return NextResponse.json({ error: "Sender profile not found" }, { status: 404 });

        currentUser.notifications = (currentUser.notifications || []).filter(
            (n: any) => n.username !== username
        );

        if (action === "accept") {
            const senderObj = { username: senderProfile.username, userPic: senderProfile.profilePic };
            const currentObj = { username: currentUser.username, userPic: currentUser.profilePic };

            const alreadyFollower = (currentUser.followers || []).some(
                (f: any) => f.username === senderProfile.username
            );
            if (!alreadyFollower) {
                currentUser.followers.push(senderObj);
            }

            const alreadyFollowing = (senderProfile.following || []).some(
                (f: any) => f.username === currentUser.username
            );
            if (!alreadyFollowing) {
                senderProfile.following.push(currentObj);
            }

            await senderProfile.save();
        }

        await currentUser.save();

        return NextResponse.json({ success: true, action }, { status: 200 });
    } catch (err) {
        console.error("conformRequest ERROR:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import Message from "@/models/Message";
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

        const accessToken = match[1];
        const decoded = verifyToken(accessToken);

        if (!decoded)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await User.findById(decoded.userId);
        const profile = await UserProfile.findOne({ email: user.username });
        const currentUserUsername = profile.username;
        const { searchParams } = new URL(req.url);
        const targetUsername = searchParams.get("username");
        const targetUserProfile = await UserProfile.findOne({ username: targetUsername });
        const msgId1 = currentUserUsername + targetUsername;
        const msgId2 = targetUsername + currentUserUsername;


        // ---- Check if conversation already exists ----
        let existing = await Message.findOne({ messageId: msgId1 });
        if (!existing) {
            existing = await Message.findOne({ messageId: msgId2 });
        }

        // ---- If exists → return it ----
        if (existing) {
            return NextResponse.json({ message: existing }, { status: 200 });
        }

        // ---- If NOT found → Create new chat ----
        const newChat = await Message.create({
            messageId: msgId1,
            users: [currentUserUsername, targetUsername],
            emails: [profile.email, targetUserProfile.email,],
            profilePics: [profile.profilePic, targetUserProfile.profilePic],
            chat: []
        });

        return NextResponse.json({ message: newChat }, { status: 200 });

    } catch (err) {
        console.error("getChatList failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
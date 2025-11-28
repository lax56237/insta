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

        // get logged-in user
        const user = await User.findById(decoded.userId);
        const profile = await UserProfile.findOne({ email: user.username });

        const currentUserUsername = profile.username;

        // get all chats for logged-in user
        const chatList = await Message.find({
            users: currentUserUsername
        }).sort({ updatedAt: -1 });

        return NextResponse.json({
            chatList,
            currentUser: currentUserUsername
        });

    } catch (err) {
        console.error("getChatList failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

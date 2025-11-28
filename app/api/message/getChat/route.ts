import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get("chatId");

        if (!chatId)
            return NextResponse.json({ error: "chatId missing" });

        const cookie = req.headers.get("cookie");
        if (!cookie) return NextResponse.json({ error: "no cookie" });

        const token = cookie.match(/access_token=([^;]+)/)?.[1];
        if (!token) return NextResponse.json({ error: "no token" });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "invalid token" });

        const user = await User.findById(decoded.userId);
        const profile = await UserProfile.findOne({ email: user.username });

        const chat = await Message.findOne({ messageId: chatId });

        return NextResponse.json({
            chat: chat.chat,
            users: chat.users,
            currentUser: profile.username,
            profilepics: chat.profilePics
        });

    } catch (err) {
        return NextResponse.json({ error: "server error" });
    }
}

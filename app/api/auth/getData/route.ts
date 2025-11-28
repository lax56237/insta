import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import Post from "@/models/Post";

export async function GET(req: Request) {
    try {
        await connectDB();

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) return NextResponse.json({ error: "No access token" }, { status: 401 });

        const accessToken = match[1];
        const decoded = verifyToken(accessToken);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const posts = await Post.find({ email: user.username }).sort({ createdAt: -1 });

        return NextResponse.json({ posts }, { status: 200 });
    } catch (err) {
        console.error("getPosts failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

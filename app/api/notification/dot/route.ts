import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
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
            return NextResponse.json({ error: "No token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await User.findById(decoded.userId);
        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const profile = await UserProfile.findOne({ email: user.username });
        if (!profile)
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const count = profile.notifications?.length || 0;

        return NextResponse.json({ count });
    } catch (err) {
        console.log("Notif dot error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

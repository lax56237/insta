import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import Story from "@/models/Story";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await connectDB();

        // get story (video string) from frontend
        const body = await req.json();
        const { story } = body;

        if (!story) {
            return NextResponse.json({ error: "No story provided" }, { status: 400 });
        }

        // get token from cookie
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

        // find user
        const user = await User.findById(decoded.userId);
        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        // find profile
        const profile = await UserProfile.findOne({ email: user.username });
        if (!profile)
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const email = profile.email;
        const username = profile.username;

        // expires in 24 hours
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // CREATE A NEW STORY DOC
        const newStory = await Story.create({
            email,
            username,
            story,
            expires,
            views: []
        });

        return NextResponse.json(
            {
                message: "Story added successfully",
                story: newStory,
                status: 200,
            }
        );
    } catch (err) {
        console.error("addStory failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

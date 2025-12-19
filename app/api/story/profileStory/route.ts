import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Story from "@/models/Story";
import User from "@/models/User";
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

        const user = await User.findById(decoded.userId);
        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        // fetch all stories of current user
        let stories = await Story.find({ email: user.username });

        if (!stories || stories.length === 0) {
            return NextResponse.json(
                { message: "No stories found", stories: [] },
                { status: 200 }
            );
        }

        // filter expired (not needed but safe)
        stories = stories.filter((s) => s.expires > new Date());

        if (stories.length === 0) {
            return NextResponse.json(
                { message: "All stories expired", stories: [] },
                { status: 200 }
            );
        }

        // sort by createdAt (oldest first)
        stories.sort((a, b) => a.createdAt - b.createdAt);

        return NextResponse.json(
            {
                message: "Stories fetched",
                stories,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error("profileStory failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

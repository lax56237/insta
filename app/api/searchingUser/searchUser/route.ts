import connectDb from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await connectDb();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.trim() === "")
            return NextResponse.json({ users: [] });

        const users = await UserProfile.find(
            { username: { $regex: query, $options: "i" } },
            { username: 1, profilePic: 1, _id: 0 }
        ).limit(10);

        return NextResponse.json({ users });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

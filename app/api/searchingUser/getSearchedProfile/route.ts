import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const username = searchParams.get("username");

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const user = await UserProfile.findOne({ username });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (err) {
        console.error("getSearchedProfile failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
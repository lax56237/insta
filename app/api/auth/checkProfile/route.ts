import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import UserProfile from "@/models/UserProfile";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        await connectDb();

        const profile = await UserProfile.findOne({ email });
        if (profile) {
            return NextResponse.json({ exists: true });
        } else {
            return NextResponse.json({ exists: false });
        }
    } catch (err) {
        console.error("CheckProfile error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

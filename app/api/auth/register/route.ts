import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDb from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
        }

        await connectDb();

        const exists = await User.findOne({ username });
        if (exists) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hash });

        return NextResponse.json({ success: true, user: { id: user._id, username: user.username } });
    } catch (err: any) {
        console.error("REGISTER ROUTE ERROR:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

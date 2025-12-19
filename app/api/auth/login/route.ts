import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDb from "@/lib/db";
import User from "@/models/User";
import { createTokens } from "@/lib/auth";

export async function POST(req: Request) {
    const { username, password } = await req.json();
    await connectDb();

    const user = await User.findOne({ username });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const { accessToken, refreshToken } = createTokens(user._id.toString());

    user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
    await user.save();

    const res = NextResponse.json({ success: true, user: { id: user._id, username: user.username } });

    const secureFlag = process.env.NODE_ENV === "production";

    res.cookies.set("access_token", accessToken, {
        httpOnly: true, secure: secureFlag, sameSite: "lax", maxAge: 60 * 60 * 24,
        path: "/"
    });
    
    res.cookies.set("refresh_token", refreshToken, {
        httpOnly: true, secure: secureFlag, sameSite: "lax", maxAge: 60 * 60 * 24 * 90,
        path: "/"
    });

    return res;
}
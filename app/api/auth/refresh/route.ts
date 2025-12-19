import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDb from "@/lib/db";
import User from "@/models/User";
import { verifyToken, createTokens } from "@/lib/auth";

export async function POST() {
  try {
    await connectDb();

    const cookieStore = cookies();
    const refreshToken = (await cookieStore).get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
    }

    const decoded = verifyToken(refreshToken, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure the presented refresh token exists (not revoked)
    const exists = (user.refreshTokens || []).some((t: { token: string }) => t.token === refreshToken);
    if (!exists) {
      return NextResponse.json({ error: "Refresh token revoked" }, { status: 401 });
    }

    const { accessToken, refreshToken: newRefresh } = createTokens(user._id.toString());

    // rotate refresh token: remove old and add new
    user.refreshTokens = (user.refreshTokens || []).filter((t: { token: string }) => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefresh, createdAt: new Date() });
    await user.save();

    const res = NextResponse.json({ success: true });
    const secureFlag = process.env.NODE_ENV === "production";

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });
    res.cookies.set("refresh_token", newRefresh, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90d
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Refresh error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
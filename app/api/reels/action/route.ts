import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import Reels from "@/models/Reel";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { reelId, type, comment } = body;

    if (!reelId) return NextResponse.json({ error: "Missing reelId" }, { status: 400 });

    // auth
    const cookie = req.headers.get("cookie");
    const token = cookie?.match(/access_token=([^;]+)/)?.[1];
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const user = await User.findById(decoded.userId);
    const profile = await UserProfile.findOne({ email: user.username });
    if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

    const reel = await Reels.findById(reelId);
    if (!reel) return NextResponse.json({ error: "Reel missing" }, { status: 404 });

    // LIKE
    if (type === "like") {
      const exists = reel.likes.some((x: { username: any; }) => x.username === user.username);
      if (!exists) {
        reel.likes.push({
          username: profile.username,
          userPic: profile.profilePic,
        });
      }
    }

    // COMMENT
    if (type === "comment") {
      reel.comments.push({
        username: profile.username,
        userPic: profile.profilePic,
        comment,
      });
    }

    // Add interest for reel description
    const desc = reel.description;
    const already = profile.interests.some((i: { description: any; }) => i.description === desc);

    if (!already) {
      profile.interests.push({
        description: desc,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });
    }

    await reel.save();
    await profile.save();

    return NextResponse.json({ reel });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
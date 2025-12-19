import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import Reels from "@/models/Reel";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();

        const url = new URL(req.url);
        const skip = Number(url.searchParams.get("skip")) || 0;

        // Token
        const cookie = req.headers.get("cookie");
        const token = cookie?.match(/access_token=([^;]+)/)?.[1];
        if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded?.userId)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        // User
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User missing" }, { status: 404 });

        const profile = await UserProfile.findOne({ email: user.username });
        if (!profile) return NextResponse.json({ error: "Profile missing" }, { status: 404 });

        const interests = profile.interests.map((i: { description: any; }) => i.description);

        // total reels to fetch (5–15)
        const count = Math.floor(Math.random() * 11) + 5;

        const interestRatio = Math.random() * 0.2 + 0.6; // 60–80%
        const interestCount = Math.floor(count * interestRatio);
        const randomCount = count - interestCount;

        let interestReels = [];
        if (interests.length > 0) {
            interestReels = await Reels.aggregate([
                { $match: { description: { $in: interests } } },
                { $sample: { size: interestCount } },
            ]);
        }

        const randomReels = await Reels.aggregate([
            { $sample: { size: randomCount } },
        ]);

        const reels = [...interestReels, ...randomReels];

        return NextResponse.json({
            reels,
            nextSkip: skip + reels.length,
        });
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

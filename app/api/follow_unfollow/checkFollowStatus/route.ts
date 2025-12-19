import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// export async function GET(req: Request) {
//     try {
//         await connectDB();

//         const { searchParams } = new URL(req.url);
//         const targetUsername = searchParams.get("username");

//         if (!targetUsername) {
//             return NextResponse.json(
//                 { error: "Target username missing" },
//                 { status: 400 }
//             );
//         }

//         const cookieHeader = req.headers.get("cookie");
//         if (!cookieHeader) return NextResponse.json({ error: "No cookie" }, { status: 401 });

//         const match = cookieHeader.match(/access_token=([^;]+)/);
//         if (!match) return NextResponse.json({ error: "No token" }, { status: 401 });

//         const decoded = verifyToken(match[1]);
//         if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

//         const user = await User.findById(decoded.userId);
//         if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

//         const currentUserProfile = await UserProfile.findOne({ email: user.username });
//         if (!currentUserProfile)
//             return NextResponse.json({ error: "Profile not found" }, { status: 404 });

//         const isFollowing = currentUserProfile.following.some(
//             (f: { username: string; }) => f.username === targetUsername
//         );

//         return NextResponse.json(
//             { following: isFollowing },
//             { status: 200 }
//         );

//     } catch (err) {
//         console.error("checkFollowStatus ERROR:", err);
//         return NextResponse.json({ error: "Server issue" }, { status: 500 });
//     }
// }



export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const targetUsername = searchParams.get("username");

        if (!targetUsername) {
            return NextResponse.json(
                { error: "Target username missing" },
                { status: 400 }
            );
        }

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader) return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) return NextResponse.json({ error: "No token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const currentUserProfile = await UserProfile.findOne({ email: user.username });
        if (!currentUserProfile)
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const targetProfile = await UserProfile.findOne({ username: targetUsername });
        if (!targetProfile)
            return NextResponse.json({ error: "Target profile not found" }, { status: 404 });

        const isFollowing = currentUserProfile.following.some(
            (f: { username: string; }) => f.username === targetUsername
        );

        const isRequested = targetProfile.notifications.some(
            (n: { username: string }) => n.username === currentUserProfile.username
        );

        return NextResponse.json(
            {
                following: isFollowing,
                requested: isRequested
            },
            { status: 200 }
        );

    } catch (err) {
        console.error("checkFollowStatus ERROR:", err);
        return NextResponse.json({ error: "Server issue" }, { status: 500 });
    }
}

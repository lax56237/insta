import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import Reels from "@/models/Reel"; 

export async function POST(req: Request) {
    try {
        await connectDB();

        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader)
            return NextResponse.json({ success: false, message: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match)
            return NextResponse.json({ success: false, message: "No access token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded)
            return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });

        const user = await User.findById(decoded.userId);
        if (!user)
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

        const profile = await UserProfile.findOne({ email: user.username });
        if (!profile)
            return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });

        const username = profile.username;
        const email = profile.email;

        const formData = await req.formData();
        const videoFile = formData.get("video") as File;
        const description = formData.get("description") as string;

        if (!videoFile)
            return NextResponse.json({ success: false, message: "Video missing" }, { status: 400 });

        // Convert File → Buffer
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // ----------------------------------
        // 3. UPLOAD TO CLOUDINARY
        // ----------------------------------
        const uploadRes = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "instagram_reels",
                    resource_type: "video",
                },
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            ).end(buffer);
        });

        const videoUrl = (uploadRes as any).secure_url;

        // ----------------------------------
        // 4. AUTO KEYWORDS FROM DESCRIPTION
        // ----------------------------------
        const keywords = description
            ? description.split(" ").map((x) => x.toLowerCase())
            : [];

        // ----------------------------------
        // 5. SAVE IN MONGODB
        // ----------------------------------
        const reel = await Reels.create({
            video: videoUrl,
            description,
            keywords,
            email,
            username,
        });

        return NextResponse.json({
            success: true,
            message: "Reel uploaded!",
            reel,
        });

    } catch (error: any) {
        console.error("REELS UPLOAD ERROR:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

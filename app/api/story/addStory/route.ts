import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import Story from "@/models/Story";
import { verifyToken } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!
});

export async function POST(req: Request) {
    try {
        await connectDB();

        // must be multipart/form-data
        const formData = await req.formData();
        const storyFile = formData.get("story") as File;

        if (!storyFile) {
            return NextResponse.json({ error: "No story provided" }, { status: 400 });
        }

        const arrayBuffer = await storyFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Read token
        const cookieHeader = req.headers.get("cookie");
        if (!cookieHeader)
            return NextResponse.json({ error: "No cookie" }, { status: 401 });

        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match)
            return NextResponse.json({ error: "No access token" }, { status: 401 });

        const decoded = verifyToken(match[1]);
        if (!decoded)
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        // User
        const user = await User.findById(decoded.userId);
        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Profile
        const profile = await UserProfile.findOne({ email: user.username });
        if (!profile)
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const email = profile.email;
        const username = profile.username;

        const uploadRes = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "stories",
                    resource_type: "auto",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(buffer);
        });

        const videoUrl = (uploadRes as any).secure_url;

        // Story expires in 24hr
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create story
        const newStory = await Story.create({
            email,
            username,
            story: videoUrl,
            expires,
            views: []
        });

        return NextResponse.json({
            message: "Story added successfully",
            story: newStory,
            status: 200,
        });

    } catch (err) {
        console.error("addStory failed:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

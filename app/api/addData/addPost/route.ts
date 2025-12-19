import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import sharp from "sharp";
import Post from "@/models/Post";

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

        
        const formData = await req.formData();
        const file = formData.get("image");
        const description = (formData.get("description") as string) || "";

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: "No image file provided" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // -------------------------------
        // IMAGE COMPRESSION
        // -------------------------------
        const compressed = await sharp(buffer)
            .resize({ width: 800 })
            .jpeg({ quality: 70 })
            .toBuffer();

        const imageDataUrl = `data:image/jpeg;base64,${compressed.toString("base64")}`;

        // -------------------------------
        // POST META
        // -------------------------------
        const email = user.username;
        const username = profile.username;

        const keywords = description
            .toLowerCase()
            .split(" ")
            .filter((w) => w.trim().length > 1);

        // -------------------------------
        // SAVE TO DB (THIS WAS MISSING)
        // -------------------------------
        const savedPost = await Post.create({
            email,
            username,
            img: imageDataUrl,
            likes: [],
            comments: [],
            description,
            keywords,
        });

        return NextResponse.json({
            success: true,
            message: "Post uploaded successfully",
            post: savedPost,
        });

    } catch (error: any) {
        console.error("UPLOAD+POST ERROR:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import connectDb from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import Reel from "@/models/Reel";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!
});

export async function GET(req: Request) {
    try {
        await connectDb();

        const users = (await UserProfile.find({}));

        if (!users || users.length === 0)
            return NextResponse.json({ msg: "No users found after skipping 6" });

        const reelsRoot = path.join(process.cwd(), "public", "reels");
        const categories = fs.readdirSync(reelsRoot);

        let folderIndex = 0;
        let videoIndex = 0;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            for (let r = 0; r < 5; r++) {
                let currentFolder = categories[folderIndex];
                const folderPath = path.join(reelsRoot, currentFolder);

                const videos = fs
                    .readdirSync(folderPath)
                    .filter((f) => f.endsWith(".mp4"));

                if (videoIndex >= videos.length) {
                    folderIndex++;
                    videoIndex = 0;

                    if (folderIndex >= categories.length) {
                        return NextResponse.json({ msg: "All videos used" });
                    }

                    currentFolder = categories[folderIndex];
                }

                const selectedVideo = videos[videoIndex];
                videoIndex++;

                const videoPath = path.join(folderPath, selectedVideo);

                const result = await cloudinary.uploader.upload(videoPath, {
                    resource_type: "video",
                    folder: "reels",
                });

                const description = currentFolder;
                const keywords = description.split(" ");

                await Reel.create({
                    username: user.username,
                    email: user.email,
                    userPic: user.profilePic,
                    video: result.secure_url,
                    description,
                    keywords,
                    likes: [],
                    comments: [],
                });
            }
        }

        return NextResponse.json({ msg: "Reels added successfully" });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
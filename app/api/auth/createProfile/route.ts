import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDb from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";
import { verifyToken } from "@/lib/auth";
import sharp from "sharp";

export async function POST(req: Request) {
    try {
        await connectDb();

        const cookieStore = cookies();
        const accessToken = (await cookieStore).get("access_token")?.value;

        if (!accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(accessToken);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const form = await req.formData();
        const image = form.get("image");
        const username = (form.get("username") as string) || "";
        const bio = (form.get("bio") as string) || "";
        const profileType = (form.get("profileType") as string) || "public"; // NEW

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const email = user.username;
        const existing = await UserProfile.findOne({ email });

        if (existing) {
            return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
        }

        let profilePic = "";

        if (image && image instanceof File) {
            const arrayBuffer = await image.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const compressed = await sharp(buffer)
                .resize({ width: 400 })
                .jpeg({ quality: 70 })
                .toBuffer();

            profilePic = `data:image/jpeg;base64,${compressed.toString("base64")}`;
        }

        await UserProfile.create({
            email,
            username,
            bio,
            profilePic,
            profileType,       // NEW
            followers: [],
            following: [],
            notifications: [],  // NEW
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("CreateProfile error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

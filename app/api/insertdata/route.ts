import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";

export async function GET() {
    try {
        await connectDB();

        const allUsernames = Array.from({ length: 20 }, (_, i) => `user_${i + 1}`);

        // Build user data
        const usersData = allUsernames.map((username, i) => {
            const email = `user${i + 1}@mail.com`;
            const password = bcrypt.hashSync("123456", 10);

            return {
                userData: {
                    username: email,
                    password,
                    refreshTokens: [],
                },
                profileData: {
                    email,
                    username,
                    bio: `Hey there! I'm ${username}, enjoying this new social app ✨`,
                    profilePic: `https://picsum.photos/seed/profile_${i}/200`,
                    followers: [] as { userPic: string; username: string }[],
                    following: [] as { userPic: string; username: string }[],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };
        });

        // Build followers/following consistency
        usersData.forEach((user, i) => {
            const available = allUsernames.filter((_, idx) => idx !== i);
            const followersCount = Math.floor(Math.random() * 6) + 5; // 5–10
            const followingCount = Math.floor(Math.random() * 6) + 5;

            const followers = available
                .sort(() => 0.5 - Math.random())
                .slice(0, followersCount);
            const following = available
                .sort(() => 0.5 - Math.random())
                .slice(0, followingCount);

            user.profileData.followers = followers.map((name) => ({
                userPic: `https://picsum.photos/seed/${name}/100`,
                username: name,
            }));

            user.profileData.following = following.map((name) => ({
                userPic: `https://picsum.photos/seed/${name}_follow/100`,
                username: name,
            }));
        });

        // Insert into User & UserProfile collections
        const insertedUsers = await User.insertMany(
            usersData.map((u) => u.userData)
        );
        const insertedProfiles = await UserProfile.insertMany(
            usersData.map((u) => u.profileData)
        );

        return NextResponse.json({
            message: "✅ Users & Profiles inserted successfully!",
            userCount: insertedUsers.length,
            profileCount: insertedProfiles.length,
        });
    } catch (error) {
        console.error("Insert error:", error);
        return NextResponse.json(
            { error: "Insert failed", details: error },
            { status: 500 }
        );
    }
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProfilePage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [profileType, setProfileType] = useState<"public" | "private">("public");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl("");
        }
    };

    const onSubmit = async () => {
        if (!username) {
            alert("Please enter a username");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();

            if (imageFile) formData.append("image", imageFile);
            formData.append("username", username);
            formData.append("bio", bio);
            formData.append("profileType", profileType); // NEW

            const res = await fetch("/api/auth/createProfile", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to create profile");
                return;
            }

            router.push("/home");
        } catch (err) {
            console.error("Create profile error:", err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="w-full max-w-md p-8 rounded-2xl bg-neutral-900 shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-6">Create Profile</h1>

                <div className="flex flex-col space-y-4">

                    {/* Profile picture */}
                    <div>
                        <label className="block mb-2">Profile Picture</label>
                        <input type="file" accept="image/*" onChange={onFileChange} />
                        {previewUrl && (
                            <img
                                src={previewUrl}
                                alt="preview"
                                className="mt-3 w-24 h-24 object-cover rounded-full"
                            />
                        )}
                    </div>

                    {/* Username */}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="p-3 rounded-lg bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Bio */}
                    <textarea
                        placeholder="Bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="p-3 rounded-lg bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                    />

                    {/* Profile type toggle (Public / Private) */}
                    <div>
                        <label className="block mb-2 font-semibold">Profile Type</label>

                        <select
                            value={profileType}
                            onChange={(e) => setProfileType(e.target.value as "public" | "private")}
                            className="p-3 rounded-lg bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    {/* Submit button */}
                    <button
                        onClick={onSubmit}
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Profile"}
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";

export default function CreatePostPage() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!image) return;

        setLoading(true);

        const formData = new FormData();
        formData.append("image", image);
        formData.append("description", description);

        try {
            const res = await fetch("/api/addData/addPost", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                alert("Posted Successfully!");
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            alert("Failed to upload image");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-black text-white pt-10">
            <h1 className="text-xl font-semibold mb-6">Create new post</h1>

            {/* STEP 1 — Choose Image */}
            {!preview && (
                <div className="w-[450px] h-[350px] bg-neutral-900 rounded-2xl border border-neutral-700 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-3">🖼️</div>
                    <p className="text-gray-300 mb-4">Drag photos and videos here</p>

                    <label className="bg-blue-600 hover:bg-blue-700 cursor-pointer px-4 py-2 rounded-lg">
                        Select from computer
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            )}

            {/* STEP 2 — Preview + Description */}
            {preview && (
                <div className="w-[450px] flex flex-col items-center">
                    <img
                        src={preview}
                        alt="Preview"
                        className="rounded-xl w-full h-[350px] object-cover border border-neutral-700"
                    />

                    {/* Description/caption box */}
                    <textarea
                        placeholder="Write a caption..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full mt-4 bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-blue-500 resize-none h-24"
                    />

                    <button
                        onClick={handleUpload}
                        className="mt-4 bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                        disabled={loading}
                    >
                        {loading ? "Posting..." : "Post"}
                    </button>
                </div>
            )}
        </div>
    );
}

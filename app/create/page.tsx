"use client";
import { useState, useRef } from "react";

export default function CreatePostPage() {
    const [tab, setTab] = useState<"post" | "reel">("post");

    // Post States
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState("");

    // Reel States
    const [reelFile, setReelFile] = useState<File | null>(null);
    const [reelPreviewURL, setReelPreviewURL] = useState<string | null>(null);
    const reelVideoRef = useRef<HTMLVideoElement | null>(null);
    const [reelDescription, setReelDescription] = useState("");

    const [loading, setLoading] = useState(false);

    const handlePostFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const uploadPost = async () => {
        if (!image) return;

        setLoading(true);
        const fd = new FormData();
        fd.append("image", image);
        fd.append("description", description);

        const res = await fetch("/api/addData/addPost", {
            method: "POST",
            body: fd
        });

        const data = await res.json();
        setLoading(false);

        alert(data.success ? "Posted!" : "Failed");
    };

    const handleReelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setReelPreviewURL(url);
        setReelFile(file);
    };

    const checkReelDuration = () => {
        const vid = reelVideoRef.current;
        if (!vid) return;

        if (vid.duration > 60) {
            alert("Video must be max 1 minute!");
            setReelFile(null);
            setReelPreviewURL(null);
        }
    };

    const uploadReel = async () => {
        if (!reelFile) return alert("Select a video first");

        setLoading(true);

        const fd = new FormData();
        fd.append("video", reelFile);          
        fd.append("description", reelDescription);

        const res = await fetch("/api/addData/addReels", {
            method: "POST",
            body: fd
        });

        const data = await res.json();
        setLoading(false);

        alert(data.success ? "Reel Uploaded!" : "Upload failed");
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center pt-10">

            {/* TABS */}
            <div className="flex gap-6 mb-6 text-lg font-semibold">
                <button className={tab === "post" ? "text-blue-400" : "text-gray-500"}
                    onClick={() => setTab("post")}>
                    Post
                </button>

                <button className={tab === "reel" ? "text-blue-400" : "text-gray-500"}
                    onClick={() => setTab("reel")}>
                    Reel
                </button>
            </div>

            {tab === "post" && (
                <div className="w-[450px] flex flex-col items-center">
                    {!preview && (
                        <div className="w-[450px] h-[350px] bg-neutral-900 rounded-2xl border border-neutral-700 flex flex-col items-center justify-center">
                            <p className="text-gray-300 mb-4">Select an Image</p>

                            <label className="bg-blue-600 px-4 py-2 cursor-pointer rounded-lg">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={handlePostFile} />
                            </label>
                        </div>
                    )}

                    {preview && (
                        <>
                            <img src={preview} className="rounded-xl w-full h-[350px] object-cover mt-4" />

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-neutral-900 p-3 mt-3 rounded-xl"
                                placeholder="Write a caption..."
                            />

                            <button onClick={uploadPost} className="bg-blue-600 px-5 py-2 rounded-lg mt-4">
                                {loading ? "Posting..." : "Post"}
                            </button>
                        </>
                    )}
                </div>
            )}

            {tab === "reel" && (
                <div className="w-[450px] flex flex-col items-center">
                    {!reelPreviewURL && (
                        <div className="w-[450px] h-[350px] bg-neutral-900 rounded-2xl flex flex-col items-center justify-center">
                            <p className="text-gray-300 mb-4">Select a Reel Video (Max 1 min)</p>

                            <label className="bg-blue-600 px-4 py-2 cursor-pointer rounded-lg">
                                Upload
                                <input type="file" accept="video/*" className="hidden" onChange={handleReelFile} />
                            </label>
                        </div>
                    )}

                    {reelPreviewURL && (
                        <>
                            <video
                                ref={reelVideoRef}
                                src={reelPreviewURL}
                                controls
                                className="w-full h-[350px] object-cover rounded-xl mt-3"
                                onLoadedMetadata={checkReelDuration}
                            />

                            <textarea
                                value={reelDescription}
                                onChange={(e) => setReelDescription(e.target.value)}
                                className="w-full bg-neutral-900 p-3 mt-3 rounded-xl"
                                placeholder="Write a caption..."
                            />

                            <button
                                onClick={uploadReel}
                                className="bg-blue-600 px-5 py-2 rounded-lg mt-4"
                                disabled={loading}
                            >
                                {loading ? "Uploading..." : "Upload Reel"}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
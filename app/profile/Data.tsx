"use client";

import { useEffect, useState } from "react";

export default function Data() {
    const [posts, setPosts] = useState<any[]>([]);
    const [popupData, setPopupData] = useState<any[] | null>(null);
    const [popupType, setPopupType] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/auth/getData");
                const data = await res.json();

                if (!res.ok) {
                    console.log("error:", data);
                    return;
                }

                setPosts(data.posts || []);
                setLoading(false);
            } catch (err) {
                console.log(err);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const openPopup = (type: string, data: any[]) => {
        setPopupType(type);
        setPopupData(data);
    };

    const closePopup = () => {
        setPopupData(null);
        setPopupType("");
    };

    return (
        <div className="w-full flex flex-col items-center mt-6">

            {loading && <p className="text-center text-gray-500">Loading…</p>}

            {/* POSTS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full px-4">
                {posts.map((post, index) => (
                    <div key={index} className="relative">
                        <img
                            src={post.img}
                            alt="post"
                            className="w-full h-48 object-cover rounded-md border"
                        />

                        {/* LIKE + COMMENT COUNTS */}
                        <div className="flex justify-between mt-2 px-1 text-sm">

                            <span
                                className="cursor-pointer hover:opacity-70"
                                onClick={() => openPopup("likes", post.likes)}
                            >
                                ❤️ {post.likes.length}
                            </span>

                            <span
                                className="cursor-pointer hover:opacity-70"
                                onClick={() => openPopup("comments", post.comments)}
                            >
                                💬 {post.comments.length}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* POPUP */}
            {popupData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-lg p-4 shadow-xl relative">

                        <button
                            className="absolute top-2 right-2 text-xl cursor-pointer"
                            onClick={closePopup}
                        >
                            ✖
                        </button>

                        <h3 className="text-lg font-bold mb-3 border-b pb-2">
                            {popupType === "likes" ? "Likes" : "Comments"}
                        </h3>

                        {/* LIKES */}
                        {popupType === "likes" &&
                            popupData.map((like, i) => (
                                <div key={i} className="flex items-center gap-3 mb-3 border-b pb-2">
                                    <img
                                        src={like.userPic}
                                        className="w-10 h-10 rounded-full border"
                                    />
                                    <span className="font-medium">{like.username}</span>
                                </div>
                            ))}

                        {/* COMMENTS */}
                        {popupType === "comments" &&
                            popupData.map((comment, i) => (
                                <div key={i} className="mb-3 border-b pb-3">
                                    <div className="flex items-center gap-3 mb-1">
                                        <img
                                            src={comment.userPic}
                                            className="w-10 h-10 rounded-full border"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                {comment.username}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.commentTime).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="ml-14 text-sm">{comment.comment}</p>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
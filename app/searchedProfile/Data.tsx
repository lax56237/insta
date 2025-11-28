"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, MessageCircle, Send, X, Loader2, User } from "lucide-react";

export default function Data() {
    const [posts, setPosts] = useState<any[]>([]);
    const [popupData, setPopupData] = useState<any[] | null>(null);
    const [popupType, setPopupType] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sendingComment, setSendingComment] = useState<string | null>(null);
    const [togglingLike, setTogglingLike] = useState<string | null>(null);

    const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

    const searchParams = useSearchParams();
    const username = searchParams.get("username");

    useEffect(() => {
        if (!username) {
            setError("No username provided");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/searchingUser/getSearchedData?username=${username}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Failed to load posts");
                    return;
                }

                // PUBLIC PROFILE
                if (data.type === "public") {
                    setPosts(data.posts || []);
                    return;
                }

                if (data.type === "private" && data.allowed === false) {
                    setError("This account is private.");
                    return;
                }

                if (data.type === "private" && data.allowed === true) {
                    setPosts(data.posts || []);
                    return;
                }

            } catch (err) {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [username]);

    const toggleLike = async (post: any, index: number) => {
        if (togglingLike === post._id) return;

        const isLiked = post.likes.some((l: any) => l.username === username);
        const status = isLiked ? "unlike" : "like";

        setTogglingLike(post._id);

        try {
            const res = await fetch(
                `/api/chat/addLikes?postId=${post._id}&username=${username}&status=${status}`
            );

            const data = await res.json();
            if (res.ok) {
                const updated = [...posts];
                updated[index].likes = data.likes;
                setPosts(updated);
            }
        } catch (err) {
            console.error("Like error:", err);
        } finally {
            setTogglingLike(null);
        }
    };

    const sendComment = async (post: any, index: number) => {
        const comment = commentInputs[post._id]?.trim();
        if (!comment || sendingComment === post._id) return;

        setSendingComment(post._id);

        try {
            const res = await fetch(
                `/api/chat/addComments?postId=${post._id}&username=${username}&comment=${encodeURIComponent(comment)}`
            );

            const data = await res.json();
            if (data.success) {
                const updated = [...posts];
                updated[index].comments = data.comments;
                setPosts(updated);
                setCommentInputs((prev) => ({ ...prev, [post._id]: "" }));
            }
        } catch (err) {
            console.error("Comment error:", err);
        } finally {
            setSendingComment(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, post: any, index: number) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendComment(post, index);
        }
    };

    const openPopup = (type: string, data: any[]) => {
        setPopupType(type);
        setPopupData(data);
    };

    const closePopup = () => {
        setPopupData(null);
        setPopupType("");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen px-4">
                <div className="text-center">
                    <p className="text-red-600 text-lg mb-2">⚠️ {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-blue-600 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen px-4">
                <div className="text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 text-lg">No posts yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post: any, index: number) => {
                    const isLiked = post.likes.some((l: any) => l.username === username);
                    const isCommentSending = sendingComment === post._id;
                    const isLikeToggling = togglingLike === post._id;

                    return (
                        <div
                            key={post._id || index}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                        >
                            {/* POST IMAGE */}
                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                                <img
                                    src={post.img}
                                    alt="Post"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>

                            {/* CONTENT */}
                            <div className="p-3">
                                {/* ACTION ROW */}
                                <div className="flex items-center gap-4 mb-3">
                                    {/* LIKE */}
                                    <button
                                        onClick={() => toggleLike(post, index)}
                                        disabled={isLikeToggling}
                                        className="flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        <Heart
                                            className={`w-5 h-5 transition-all ${isLiked
                                                ? "fill-red-500 text-red-500"
                                                : "text-gray-700 hover:text-red-500"
                                                }`}
                                        />
                                        <span className={isLiked ? "text-red-500" : "text-gray-700"}>
                                            {post.likes.length}
                                        </span>
                                    </button>

                                    {/* COMMENTS COUNT */}
                                    <button
                                        onClick={() => openPopup("comments", post.comments)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        <span>{post.comments.length}</span>
                                    </button>
                                </div>

                                {/* SEE LIKES */}
                                {post.likes.length > 0 && (
                                    <button
                                        onClick={() => openPopup("likes", post.likes)}
                                        className="text-xs text-gray-600 hover:text-gray-900 mb-2 font-medium"
                                    >
                                        Liked by {post.likes.length} {post.likes.length === 1 ? "person" : "people"}
                                    </button>
                                )}

                                {/* COMMENT INPUT */}
                                <div className="flex gap-2 items-center">
                                    <input
                                        className="border border-gray-300 text-black rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Add a comment…"
                                        value={commentInputs[post._id] || ""}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({
                                                ...prev,
                                                [post._id]: e.target.value,
                                            }))
                                        }
                                        onKeyPress={(e) => handleKeyPress(e, post, index)}
                                        disabled={isCommentSending}
                                    />

                                    <button
                                        onClick={() => sendComment(post, index)}
                                        disabled={!commentInputs[post._id]?.trim() || isCommentSending}
                                        className="text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isCommentSending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* POPUP */}
            {popupData && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    onClick={closePopup}
                >
                    <div
                        className="bg-white w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold">
                                {popupType === "likes" ? "Liked By" : "Comments"}
                            </h3>
                            <button
                                onClick={closePopup}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
                            {popupData.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    No {popupType} yet
                                </p>
                            ) : (
                                <>
                                    {/* LIKE LIST */}
                                    {popupType === "likes" &&
                                        popupData.map((like: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2"
                                            >
                                                <img
                                                    src={like.userPic}
                                                    alt={like.username}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                />
                                                <span className="font-medium text-gray-900">{like.username}</span>
                                            </div>
                                        ))}

                                    {popupType === "comments" &&
                                        popupData.map((comment: any, i: number) => (
                                            <div key={i} className="mb-4 pb-4 border-b last:border-b-0">
                                                <div className="flex items-start gap-3">
                                                    <img
                                                        src={comment.userPic}
                                                        alt={comment.username}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-black ">{comment.username}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(comment.commentTime).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 wrap-break-word">{comment.comment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </>
                            )}
                        </div>
                    </div>

                    <style jsx>{`
                        @keyframes scaleIn {
                            0% { 
                                transform: scale(0.9); 
                                opacity: 0; 
                            }
                            100% { 
                                transform: scale(1); 
                                opacity: 1; 
                            }
                        }
                        .animate-scaleIn {
                            animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
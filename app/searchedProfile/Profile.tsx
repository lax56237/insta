"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

interface UserRef {
    userPic: string;
    username: string;
}

interface Profile {
    username: string;
    bio: string;
    profilePic: string;
    followers: UserRef[];
    following: UserRef[];
    notifications: any[];
}

export default function Profile() {

    const searchParams = useSearchParams();
    const username = searchParams.get("username");
    const [followStatus, setFollowStatus] = useState<"follow" | "unfollow" | "requested" | null>(null);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState<"followers" | "following" | null>(null);
    //story part
    const [showStoryPopup, setShowStoryPopup] = useState(false);
    const [stories, setStories] = useState<any[]>([]);
    const [currentStory, setCurrentStory] = useState(0);
    const [hasUnseenStories, setHasUnseenStories] = useState(false);


    const router = useRouter();

    useEffect(() => {
        if (!username) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/searchingUser/getSearchedProfile?username=${username}`);
                const data = await res.json();
                if (res.ok) {
                    setProfile(data);
                    setFollowing(data.following.length);
                    setFollowers(data.followers.length);
                }
            } catch (err) {
                console.error("Failed to load searched profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    // NEW: Check for unseen stories on page load
    useEffect(() => {
        if (!username) return;

        const checkStoryStatus = async () => {
            try {
                const res = await fetch(`/api/story/searchStory?username=${username}`);
                const data = await res.json();

                if (res.ok && data.stories && data.stories.length > 0) {
                    setHasUnseenStories(data.hasUnseen);
                }
            } catch (err) {
                console.error("Failed to check story status:", err);
            }
        };

        checkStoryStatus();
    }, [username]);

    useEffect(() => {
        const checkFollow = async () => {
            try {
                const res = await fetch(`/api/follow_unfollow/checkFollowStatus?username=${username}`);
                const data = await res.json();

                if (res.ok) {
                    if (data.following) {
                        setFollowStatus("unfollow");
                        return;
                    }

                    if (data.requested) {
                        setFollowStatus("requested");
                        return;
                    }

                    setFollowStatus("follow");
                }
            } catch (err) {
                console.log("FollowCheck error:", err);
            }
        };
        checkFollow();
    }, [username]);

    async function followRequest() {
        if (!username || !followStatus) return;

        // prevent double clicking requested
        if (followStatus === "requested") return;

        const action = followStatus === "unfollow" ? "unfollow" : "follow";

        const res = await fetch(
            `/api/follow_unfollow/followRequest?username=${username}&action=${action}`,
            { method: "POST" }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.requested === true) {
            setFollowStatus("requested");
            return;
        }

        if (action === "follow") {
            setFollowStatus("unfollow");
            setFollowers(prev => prev + 1);
        }

        if (action === "unfollow") {
            setFollowStatus("follow");
            setFollowers(prev => prev - 1);
        }
    }

    const openStories = async () => {
        if (!username) return;

        const res = await fetch(`/api/story/searchStory?username=${username}`);
        const data = await res.json();

        if (res.ok && data.stories) {
            setStories(data.stories);
            setHasUnseenStories(data.hasUnseen);
            setCurrentStory(0);
            setShowStoryPopup(true);

            if (data.stories.length > 0) {
                markStorySeen(data.stories[0]._id);
            }
        } else {
            alert("No active stories");
        }
    };


    const closePopup = () => setShowPopup(null);
    const goToProfile = (username: string) => {
        setShowPopup(null);
        router.push(`/searchedProfile?username=${username}`);
    };

    async function markStorySeen(storyId: string) {
        try {
            await fetch(`/api/story/viewStory?storyId=${storyId}`, {
                method: "GET",
            });
            setHasUnseenStories(false);
        } catch (err) {
            console.error("Failed to mark story as seen:", err);
        }
    }

    const handleMessage = async () => {
        if (!username) return;

        try {
            const res = await axios.get(`/api/message/getOrCreate?username=${username}`);
            const chatId = res.data.message.messageId;

            router.push(`/messages?chatId=${chatId}`);
        } catch (err) {
            console.log("Message GET error: ", err);
        }
    };

    const closeStoryPopup = () => {
        setShowStoryPopup(false);
        // After closing, the ring should no longer show as unseen
        setHasUnseenStories(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                Loading profile...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                User not found.
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center bg-black text-white p-6">

            <img
                src={profile.profilePic}
                onClick={openStories}
                className={`w-36 h-36 rounded-full object-cover cursor-pointer border-4 
        ${hasUnseenStories
                        ? "border-transparent bg-linear-to-tr from-purple-600 via-pink-500 to-yellow-400 p-1"
                        : "border-gray-700"
                    }
    `}
            />

            {/* Username */}
            <h2 className="text-2xl font-bold mt-4">{profile.username}</h2>

            {/* Bio */}
            <p className="text-gray-400 mt-2 text-center max-w-md">{profile.bio}</p>

            {/* Followers & Following */}
            <div className="flex gap-8 mt-4 text-gray-300">
                <button onClick={() => setShowPopup("followers")} className="hover:text-white transition">
                    <span className="font-bold">followers {followers}</span>
                </button>

                <button onClick={() => setShowPopup("following")} className="hover:text-white transition">
                    <span className="font-bold">following {following}</span>
                </button>
                <button
                    onClick={handleMessage}
                    className="mt-3 px-4 py-2 rounded bg-blue-600 text-white cursor-pointer"
                >
                    Message
                </button>
            </div>

            {/* Follow / Requested / Unfollow Button */}
            <button
                className={`px-4 py-1 mt-4 rounded-md font-semibold ${followStatus === "unfollow"
                    ? "bg-gray-700 text-white"
                    : followStatus === "requested"
                        ? "bg-yellow-500 text-black"
                        : "bg-white text-black"
                    }`}
                onClick={followRequest}
            >
                {followStatus === "unfollow"
                    ? "Unfollow"
                    : followStatus === "requested"
                        ? "Requested"
                        : "Follow"}
            </button>

            {/* Popup */}
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 rounded-2xl w-80 max-h-[60vh] p-5 overflow-y-auto shadow-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold capitalize">{showPopup}</h3>
                            <button
                                onClick={closePopup}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <ul className="space-y-3">
                            {profile[showPopup].map((user, i) => (
                                <li
                                    key={user.username || i}
                                    onClick={() => goToProfile(user.username)}
                                    className="flex items-center gap-3 bg-gray-800 px-3 py-2 rounded-md hover:bg-gray-700 cursor-pointer transition"
                                >
                                    <img
                                        src={user.userPic || "/default-avatar.png"}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <span>{user.username}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            {showStoryPopup && stories.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">

                    <div className="w-[340px] bg-neutral-900 rounded-xl p-3 border border-gray-700">

                        {/* Story Content */}
                        <video
                            src={stories[currentStory].story}
                            controls
                            autoPlay
                            className="w-full rounded-lg"
                        />

                        {/* Navigation */}
                        <div className="flex justify-between mt-3">
                            <button
                                disabled={currentStory === 0}
                                onClick={() => {
                                    const prevIndex = currentStory - 1;
                                    setCurrentStory(prevIndex);
                                    markStorySeen(stories[prevIndex]._id);
                                }}

                                className="text-white disabled:text-gray-600"
                            >
                                Prev
                            </button>

                            <button
                                disabled={currentStory === stories.length - 1}
                                onClick={() => {
                                    const nextIndex = currentStory + 1;
                                    setCurrentStory(nextIndex);
                                    markStorySeen(stories[nextIndex]._id);
                                }}

                                className="text-white disabled:text-gray-600"
                            >
                                Next
                            </button>
                        </div>

                        <button
                            className="mt-3 w-full bg-red-500 py-1 rounded-md"
                            onClick={closeStoryPopup}
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}
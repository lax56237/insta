"use client";
import { useEffect, useState, useRef, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { useRouter } from "next/navigation";

interface UserRef {
    userPic: string;
    username: string;
}

interface ProfileData {
    username: string;
    bio: string;
    profilePic: string;
    followers: UserRef[];
    following: UserRef[];
}

export default function Profile() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState<"followers" | "following" | null>(null);
    const [showStoryPopup, setShowStoryPopup] = useState(false);
    const [videoString, setVideoString] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    //story states
    const [stories, setStories] = useState<any[]>([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [showStoryView, setShowStoryView] = useState(false);
    const [showViewsPopup, setShowViewsPopup] = useState(false);


    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/auth/getProfile", {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch profile");
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleFunction = (username: string) => {
        router.push(`/searchedProfile?username=${username}`);
    };

    const closePopup = () => setShowPopup(null);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);

        const reader = new FileReader();
        reader.onload = () => {
            setVideoString(reader.result as string);
        };
        reader.readAsDataURL(file);

        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.src = url;
            }
        }, 200);
    };

    // Send Story
    const sendStory = async () => {
        const input: any = document.querySelector("#storyInput");
        const file = input?.files?.[0];

        if (!file) return alert("Select a video first!");

        const fd = new FormData();
        fd.append("story", file);

        const res = await fetch("/api/story/addStory", {
            method: "POST",
            body: fd,
        });

        if (!res.ok) {
            console.log("Story upload failed");
            return;
        }

        setShowStoryPopup(false);
        setVideoString(null);
        alert("Story added!");
    };


    // Video duration check
    const checkVideoDuration = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.duration > 60) {
            alert("Video must be 1 minute max!");
            setVideoString(null);
        }
    };

    // fetch story
    const openStoryViewer = async () => {
        const res = await fetch("/api/story/profileStory", {
            method: "GET",
            credentials: "include",
        });

        const data = await res.json();
        if (!data.stories || data.stories.length === 0) {
            alert("No active stories");
            return;
        }

        setStories(data.stories);
        setCurrentStoryIndex(0);
        setShowStoryView(true);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                Loading...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                Profile not found
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center bg-black text-white p-6 relative">

            {/* Profile Pic */}
            <div className="relative">
                <img
                    onClick={openStoryViewer}
                    src={profile.profilePic}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover border-2 border-gray-700 cursor-pointer"
                />


                {/* Add Story Button */}
                <button
                    onClick={() => setShowStoryPopup(true)}
                    className="absolute bottom-2 right-2 bg-blue-500 text-white w-9 h-9 rounded-full flex items-center justify-center text-2xl font-bold hover:bg-blue-600"
                >
                    +
                </button>
            </div>

            {/* Username */}
            <h2 className="text-2xl font-bold mt-4">{profile.username}</h2>

            {/* Bio */}
            <p className="text-gray-400 mt-2 text-center max-w-md">{profile.bio}</p>

            {/* Followers & Following */}
            <div className="flex gap-8 mt-4 text-gray-300">
                <button
                    onClick={() => setShowPopup("followers")}
                    className="hover:text-white transition"
                >
                    <span className="font-bold">{profile.followers.length}</span> followers
                </button>

                <button
                    onClick={() => setShowPopup("following")}
                    className="hover:text-white transition"
                >
                    <span className="font-bold">{profile.following.length}</span> following
                </button>
            </div>

            {/* Followers/Following Popup */}
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
                                <div
                                    key={user.username || i}
                                    onClick={() => handleFunction(user.username)}
                                >
                                    <li className="flex items-center gap-3 bg-gray-800 px-3 py-2 rounded-md hover:bg-gray-700 cursor-pointer transition">
                                        <img
                                            src={user.userPic || "/default-avatar.png"}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span>{user.username}</span>
                                    </li>
                                </div>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* ADD STORY POPUP */}
            {showStoryPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                    <div className="bg-neutral-900 p-6 rounded-xl w-96 border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Add Story</h2>
                            <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => setShowStoryPopup(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* File Input */}
                        <input
                            id="storyInput"
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="w-full text-gray-300 mb-4"
                        />

                        {/* Video Preview */}
                        {videoString && (
                            <video
                                ref={videoRef}
                                controls
                                className="w-full rounded-lg mb-3"
                                onLoadedMetadata={checkVideoDuration}
                            />
                        )}

                        <button
                            onClick={sendStory}
                            className="w-full bg-blue-500 hover:bg-blue-600 py-2 rounded-lg mt-2 font-semibold"
                        >
                            Send Story
                        </button>
                    </div>
                </div>
            )}

            {showStoryView && stories.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">

                    <div className="bg-neutral-900 p-4 rounded-xl w-96 border border-gray-700 relative">

                        {/* CLOSE */}
                        <button
                            onClick={() => setShowStoryView(false)}
                            className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl"
                        >
                            ✕
                        </button>

                        {/* STORY VIDEO */}
                        <video
                            src={stories[currentStoryIndex].story}
                            controls
                            autoPlay
                            className="w-full rounded-lg"
                        />

                        {/* NAVIGATION */}
                        <div className="flex justify-between mt-3">
                            <button
                                disabled={currentStoryIndex === 0}
                                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-40"
                                onClick={() => setCurrentStoryIndex(currentStoryIndex - 1)}
                            >
                                Prev
                            </button>

                            <button
                                disabled={currentStoryIndex === stories.length - 1}
                                className="px-3 py-1 bg-gray-700 rounded disabled:opacity-40"
                                onClick={() => setCurrentStoryIndex(currentStoryIndex + 1)}
                            >
                                Next
                            </button>
                        </div>

                        {/* VIEWS BUTTON */}
                        <button
                            onClick={() => setShowViewsPopup(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg mt-4"
                        >
                            Views ({stories[currentStoryIndex].views.length})
                        </button>
                    </div>
                </div>
            )}


            {showViewsPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 p-5 rounded-xl w-80 border border-gray-700">

                        <div className="flex justify-between">
                            <h2 className="text-lg font-bold">Views</h2>
                            <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => setShowViewsPopup(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <ul className="mt-4 space-y-3">
                            {stories[currentStoryIndex].views.map((v: {
                                seenAt: ReactNode; userPic: any; username: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined;
                            }, i: Key | null | undefined) => (
                                <li
                                    key={i}
                                    className="flex items-center w-73 gap-3 bg-gray-800 p-2 rounded-lg"
                                >
                                    <img
                                        src={v.userPic || "/default-avatar.png"}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span>{v.username}</span>
                                    <span>{v.seenAt}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}



        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StoryView {
    userPic: string;
    username: string;
    seenAt: Date;
}

interface Story {
    _id: string;
    email: string;
    username: string;
    story: string;
    expires: Date;
    views: StoryView[];
    createdAt: Date;
}

interface UserStories {
    username: string;
    profilePic: string;
    stories: Story[];
    hasUnseen: boolean;
}

export default function HomeStory() {
    const [allUserStories, setAllUserStories] = useState<UserStories[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetchHomeStories();
    }, []);

    const fetchHomeStories = async () => {
        try {
            const res = await fetch("/api/story/getHomeStory");
            const data = await res.json();

            if (res.ok) {
                setAllUserStories(data.userStories || []);
            }
        } catch (err) {
            console.error("Failed to fetch home stories:", err);
        } finally {
            setLoading(false);
        }
    };

    const openStory = (userIndex: number) => {
        setSelectedUserIndex(userIndex);
        setCurrentStoryIndex(0);
        setShowStoryModal(true);
        
        if (allUserStories[userIndex].stories.length > 0) {
            markStorySeen(allUserStories[userIndex].stories[0]._id, userIndex);
        }
    };

    const markStorySeen = async (storyId: string, userIndex: number) => {
        try {
            await fetch(`/api/story/viewStory?storyId=${storyId}`, {
                method: "GET",
            });

            // Update local state to reflect the story has been seen
            setAllUserStories(prev => {
                const updated = [...prev];
                const userStories = updated[userIndex];
                
                // Mark this specific story as seen by adding current user to views
                const storyIdx = userStories.stories.findIndex(s => s._id === storyId);
                if (storyIdx !== -1) {
                    // Check if already seen (simplified check)
                    if (!userStories.stories[storyIdx].views) {
                        userStories.stories[storyIdx].views = [];
                    }
                }

                // Check if all stories are seen
                const allSeen = userStories.stories.every(story => 
                    story.views && story.views.length > 0
                );

                if (allSeen) {
                    userStories.hasUnseen = false;
                    // Move to end of array
                    const removed = updated.splice(userIndex, 1);
                    updated.push(removed[0]);
                }

                return updated;
            });
        } catch (err) {
            console.error("Failed to mark story as seen:", err);
        }
    };

    const goToNextStory = () => {
        if (selectedUserIndex === null) return;

        const currentUser = allUserStories[selectedUserIndex];
        
        // If there's a next story for this user
        if (currentStoryIndex < currentUser.stories.length - 1) {
            const nextIndex = currentStoryIndex + 1;
            setCurrentStoryIndex(nextIndex);
            markStorySeen(currentUser.stories[nextIndex]._id, selectedUserIndex);
        } 
        // Move to next user's stories
        else if (selectedUserIndex < allUserStories.length - 1) {
            const nextUserIndex = selectedUserIndex + 1;
            setSelectedUserIndex(nextUserIndex);
            setCurrentStoryIndex(0);
            markStorySeen(allUserStories[nextUserIndex].stories[0]._id, nextUserIndex);
        } 
        // Close modal if no more stories
        else {
            closeStoryModal();
        }
    };

    const goToPrevStory = () => {
        if (selectedUserIndex === null) return;

        // If there's a previous story for this user
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        } 
        // Move to previous user's last story
        else if (selectedUserIndex > 0) {
            const prevUserIndex = selectedUserIndex - 1;
            const prevUserLastStory = allUserStories[prevUserIndex].stories.length - 1;
            setSelectedUserIndex(prevUserIndex);
            setCurrentStoryIndex(prevUserLastStory);
        }
    };

    const closeStoryModal = () => {
        setShowStoryModal(false);
        setSelectedUserIndex(null);
        setCurrentStoryIndex(0);
    };

    const goToUserProfile = (username: string) => {
        closeStoryModal();
        router.push(`/searchedProfile?username=${username}`);
    };

    if (loading) {
        return (
            <div className="flex gap-4 p-4 overflow-x-auto bg-black">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse" />
                        <div className="w-12 h-3 bg-gray-800 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    if (allUserStories.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 bg-black">
                No stories available
            </div>
        );
    }

    return (
        <>
            {/* Story Ring Container */}
            <div className="flex gap-4 p-4 overflow-x-auto bg-black border-b border-gray-800">
                {allUserStories.map((userStory, idx) => (
                    <div
                        key={userStory.username}
                        onClick={() => openStory(idx)}
                        className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                    >
                        <div
                            className={`w-16 h-16 rounded-full p-0.5 ${
                                userStory.hasUnseen
                                    ? "bg-linear-to-tr from-purple-600 via-pink-500 to-yellow-400"
                                    : "bg-gray-700"
                            }`}
                        >
                            <img
                                src={userStory.profilePic || "/default-avatar.png"}
                                alt={userStory.username}
                                className="w-full h-full rounded-full object-cover border-2 border-black"
                            />
                        </div>
                        <p className="text-xs text-white truncate w-16 text-center">
                            {userStory.username}
                        </p>
                        {/* Story count indicator */}
                        {userStory.stories.length > 1 && (
                            <span className="text-[10px] text-gray-400">
                                {userStory.stories.length} stories
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Story Modal */}
            {showStoryModal && selectedUserIndex !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-md h-[80vh] flex flex-col">
                        {/* Progress bars */}
                        <div className="flex gap-1 p-2 absolute top-0 left-0 right-0 z-10">
                            {allUserStories[selectedUserIndex].stories.map((_, idx) => (
                                <div
                                    key={idx}
                                    className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden"
                                >
                                    <div
                                        className={`h-full ${
                                            idx < currentStoryIndex
                                                ? "w-full bg-white"
                                                : idx === currentStoryIndex
                                                ? "w-full bg-white animate-progress"
                                                : "w-0 bg-transparent"
                                        }`}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* User info header */}
                        <div className="flex items-center gap-3 p-4 absolute top-6 left-0 right-0 z-10 bg-linear-to-b from-black/50 to-transparent">
                            <img
                                src={allUserStories[selectedUserIndex].profilePic || "/default-avatar.png"}
                                alt={allUserStories[selectedUserIndex].username}
                                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                                onClick={() => goToUserProfile(allUserStories[selectedUserIndex].username)}
                            />
                            <span className="text-white font-semibold cursor-pointer" onClick={() => goToUserProfile(allUserStories[selectedUserIndex].username)}>
                                {allUserStories[selectedUserIndex].username}
                            </span>
                            <button
                                onClick={closeStoryModal}
                                className="ml-auto text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Story Content */}
                        <div className="flex-1 flex items-center justify-center bg-black">
                            {allUserStories[selectedUserIndex].stories[currentStoryIndex].story.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                    src={allUserStories[selectedUserIndex].stories[currentStoryIndex].story}
                                    autoPlay
                                    className="max-w-full max-h-full object-contain"
                                    onEnded={goToNextStory}
                                />
                            ) : (
                                <img
                                    src={allUserStories[selectedUserIndex].stories[currentStoryIndex].story}
                                    alt="Story"
                                    className="max-w-full max-h-full object-contain"
                                />
                            )}
                        </div>

                        {/* Navigation Areas */}
                        <div className="absolute inset-0 flex">
                            <div
                                className="w-1/3 h-full cursor-pointer"
                                onClick={goToPrevStory}
                            />
                            <div className="w-1/3 h-full" />
                            <div
                                className="w-1/3 h-full cursor-pointer"
                                onClick={goToNextStory}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
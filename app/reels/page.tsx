"use client";

import { useEffect, useState, useRef } from "react";

interface IReel {
    _id: string;
    username: string;
    userPic: string;
    description: string;
    video: string;
    likes: any[];
    comments: any[];
}

interface IReelData {
    reels: IReel[];
    nextSkip: number;
}

export default function ReelsPage() {
    const [reels, setReels] = useState<IReel[]>([]);
    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<HTMLVideoElement[]>([]);

    // Load reels
    async function loadMore() {
        if (loading) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/reels/getReels?skip=${skip}`, {
                cache: "no-store",
            });

            if (!res.ok) throw new Error("Failed");

            const data: IReelData = await res.json();

            setReels((prev) => {
                const idSet = new Set(prev.map((r) => r._id));
                const fresh = data.reels.filter((r) => !idSet.has(r._id));
                return [...prev, ...fresh];
            });

            setSkip(data.nextSkip);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMore();
    }, []);

    // Infinite scrolling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        function onScroll() {
            if (!container) return;

            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 200) {
                loadMore();
            }

            const reels = Array.from(container.children) as HTMLDivElement[];
            let activeIndex = 0;

            const mid = container.scrollTop + container.clientHeight / 2;

            reels.forEach((reel, i) => {
                const top = reel.offsetTop;
                const bottom = top + reel.clientHeight;

                if (mid >= top && mid <= bottom) activeIndex = i;
            });

            videoRefs.current.forEach((video, i) => {
                if (!video) return;
                if (i === activeIndex) video.play().catch(() => {});
                else video.pause();
            });
        }

        container.addEventListener("scroll", onScroll);
        return () => container.removeEventListener("scroll", onScroll);
    }, [reels]);

    async function handleAction(reelId: string, type: "like" | "comment") {
        const body: any = { reelId, type };

        if (type === "comment") {
            const text = prompt("Comment:");
            if (!text) return;
            body.comment = text;
        }

        const res = await fetch("/api/reels/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) return alert("Error");

        const updated = await res.json();

        setReels((prev) =>
            prev.map((r) => (r._id === reelId ? updated.reel : r))
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-screen overflow-y-scroll bg-black no-scrollbar snap-y snap-mandatory"
        >
            {reels.map((reel, index) => (
                <div
                    key={reel._id}
                    className="w-full h-screen snap-start relative flex items-center justify-center"
                >
                    <video
                        ref={(el) => {
                            if (el) videoRefs.current[index] = el;
                        }}
                        src={reel.video}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        loop
                    />

                    <div className="absolute bottom-20 left-5 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <img
                                src={reel.userPic}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="text-lg font-semibold">{reel.username}</span>
                        </div>

                        <p className="opacity-90">{reel.description}</p>
                    </div>

                    <div className="absolute right-6 bottom-28 flex flex-col gap-6 text-white text-2xl">
                        <button onClick={() => handleAction(reel._id, "like")} className="text-red-400">
                            ❤️ <div className="text-sm">{reel.likes.length}</div>
                        </button>
                        <button onClick={() => handleAction(reel._id, "comment")} className="text-blue-400">
                            💬 <div className="text-sm">{reel.comments.length}</div>
                        </button>
                    </div>
                </div>
            ))}

            {loading && (
                <div className="text-center text-white py-10">Loading…</div>
            )}
        </div>
    );
}
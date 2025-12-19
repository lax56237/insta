"use client";

import { useEffect, useState } from "react";

interface Notification {
    userPic: string;
    username: string;
    message: string;
    time: string;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notification/getNotifications");

            if (!res.ok) {
                console.log("Fetch failed");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (err) {
            console.log("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (username: string, action: "accept" | "reject") => {
        try {
            const res = await fetch("/api/follow_unfollow/conformRequest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, action }),
            });

            if (!res.ok) {
                console.log("Request failed");
                return;
            }

            setNotifications((prev) =>
                prev.filter((n) => n.username !== username)
            );
        } catch (err) {
            console.log("Error handling request:", err);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center text-xl">
                Loading...
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-semibold">Notifications</h2>
                <p className="mt-4 text-gray-600">No notifications yet.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>

            <div className="flex flex-col gap-4">
                {notifications.map((n, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 p-3 border rounded-lg bg-white shadow-sm"
                    >
                        <img
                            src={n.userPic}
                            alt="pic"
                            className="w-12 h-12 rounded-full border object-cover"
                        />

                        <div className="flex flex-col">
                            <span className="font-semibold text-black">{n.username}</span>

                            <span className="text-black mt-1 gap-3">
                                {n.time}
                            </span>

                            <div className="flex gap-3 mt-2">
                                <button
                                    className="px-3 py-1 bg-black text-white rounded-md"
                                    onClick={() => handleRequest(n.username, "accept")}
                                >
                                    Accept
                                </button>

                                <button
                                    className="px-3 py-1 bg-red-600 text-white rounded-md"
                                    onClick={() => handleRequest(n.username, "reject")}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

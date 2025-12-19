"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
    const params = useSearchParams();
    const chatId = params.get("chatId");

    // States
    const [chatData, setChatData] = useState<{ username: string; message: string; sentAt: any }[]>([]);
    const [currentUser, setCurrentUser] = useState("");
    const [users, setUsers] = useState<string[]>([]);
    const [profilePics, setProfilePics] = useState<string[]>([]);
    const [input, setInput] = useState("");

    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scroll

    // Load when chatId exists
    useEffect(() => {
        if (!chatId) return;
        loadChat();
    }, [chatId]);

    // Auto-scroll to bottom when chatData changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatData]);

    async function loadChat() {
        if (!chatId) return;

        const res = await fetch(`/api/message/getChat?chatId=${chatId}`);
        const data = await res.json();

        setChatData(Array.isArray(data.chat) ? data.chat : []);
        setCurrentUser(data.currentUser ?? "");
        setUsers(Array.isArray(data.users) ? data.users : []);
        setProfilePics(Array.isArray(data.profilepics) ? data.profilepics : []);

        connectSocket(data.currentUser);
    }

    function connectSocket(username: string) {
        if (!username) return;
        // Prevent multiple connections
        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(`ws://localhost:4000?username=${username}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === "new_message") {
                setChatData(prev => [
                    ...prev,
                    { username: msg.from, message: msg.message, sentAt: msg.sentAt }
                ]);
            }
        };
    }

    async function sendMsg(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const opposite = users.find(u => u !== currentUser);

        wsRef.current?.send(JSON.stringify({
            type: "send",
            from: currentUser,
            to: opposite,
            message: input
        }));

        setChatData(prev => [
            ...prev,
            { username: currentUser, message: input, sentAt: Date.now() }
        ]);

        // Save to MongoDB (fire and forget for UI responsiveness)
        fetch("/api/message/sendMessage", {
            method: "POST",
            body: JSON.stringify({ chatId, username: currentUser, message: input })
        });

        setInput("");
    }


    if (!chatId) {
        return (
            <div className="flex justify-center items-center h-full bg-black text-gray-400 font-medium">
                <div className="flex flex-col items-center gap-2">
                    <p>Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    const oppositeUser = users.find(u => u !== currentUser);
    const oppIndex = users.indexOf(oppositeUser ?? "");
    const oppositePic = profilePics[oppIndex];

    return (
        // Main container - keeps h-full as requested
        <div className="flex flex-col h-full">

            {/* Header: Sticky, minimal, slight blur */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 sticky top-0 bg-black backdrop-blur-md z-10">
                <div className="relative">
                    <img
                        src={oppositePic || "/defaultpfp.png"}
                        alt="profile"
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-white text-sm">
                        {oppositeUser}
                    </span>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-black">
                {chatData.map((msg, i) => {
                    const isMe = msg.username === currentUser;
                    // Grouping logic visual: check if next message is same user for border radius
                    const nextMsg = chatData[i + 1];
                    const isLastInGroup = !nextMsg || nextMsg.username !== msg.username;

                    return (
                        <div
                            key={i}
                            className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] px-4 py-2 text-[15px] leading-relaxed wrap-break-word
                                    ${isMe
                                        ? "bg-linear-to-r from-purple-500 to-blue-500 text-white"
                                        : "bg-gray-100 text-gray-900"
                                    }
                                    ${/* Rounding logic for "pill" effect */ ""}
                                    rounded-3xl
                                    ${isMe && isLastInGroup ? "rounded-br-md" : ""} 
                                    ${!isMe && isLastInGroup ? "rounded-bl-md" : ""}
                                    ${!isLastInGroup ? "mb-0.5" : "mb-2"}
                                `}
                            >
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black">
                <form
                    onSubmit={sendMsg}
                    className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-gray-300 transition-colors"
                >
                    <input
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message..."
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className={`text-sm font-semibold transition-colors
                            ${input.trim()
                                ? "text-blue-700 hover:text-blue-700 cursor-pointer"
                                : "text-blue-200 cursor-default"
                            }
                        `}
                    >
                        Send
                    </button>
                </form>
            </div>

        </div>
    );
}
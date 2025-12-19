"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    const [chatList, setChatList] = useState([]);
    const [currentUser, setCurrentUser] = useState("");

    useEffect(() => {
        fetchChatList();
    }, []);

    async function fetchChatList() {
        try {
            const res = await fetch("/api/message/getChatList");
            const data = await res.json();

            setChatList(data.chatList);
            setCurrentUser(data.currentUser);
        } catch (err) {
            console.log("fetch error", err);
        }
    }

    function openChat(messageId: string) {
        router.push(`/messages?chatId=${messageId}`);
    }

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto p-3">

            {chatList.map((chat: any) => {
                if (!currentUser) return null;

                // find the opposite user
                const oppositeIndex =
                    chat.users.indexOf(currentUser) === 0 ? 1 : 0;

                const oppositeUser = chat.users[oppositeIndex];
                const oppositePic = chat.profilePics[oppositeIndex];

                return (
                    <div
                        key={chat.messageId}
                        onClick={() => openChat(chat.messageId)}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-amber-950 cursor-pointer"
                    >
                        <img
                            src={oppositePic}
                            className="w-12 h-12 rounded-full"
                        />

                        <div className="flex flex-col">
                            <span className="font-semibold">{oppositeUser}</span>
                        </div>
                    </div>
                );
            })}

        </div>
    );
}

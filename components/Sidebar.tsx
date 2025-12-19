"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Home,
    Search,
    Compass,
    Clapperboard,
    Send,
    Heart,
    PlusSquare,
    User,
} from "lucide-react";

export default function Sidebar() {

    const pathname = usePathname();
    const [hasNotifications, setHasNotifications] = useState(false);

    const links = [
        { name: "Home", icon: <Home size={24} />, href: "/home" },
        { name: "Search", icon: <Search size={24} />, href: "/search" },
        { name: "Reels", icon: <Clapperboard size={24} />, href: "/reels" },
        { name: "Messages", icon: <Send size={24} />, href: "/messages" },
        { name: "Notifications", icon: <Heart size={24} />, href: "/notifications" },
        { name: "Create", icon: <PlusSquare size={24} />, href: "/create" },
        { name: "Profile", icon: <User size={24} />, href: "/profile" },
    ];
    useEffect(() => {
        const checkNotif = async () => {
            try {
                const res = await fetch("/api/notification/dot");
                const data = await res.json();
                if (res.ok && data.count > 0) {
                    setHasNotifications(true);
                } else {
                    setHasNotifications(false);
                }
            } catch {
                console.log("notif fetch failed");
            }
        };

        checkNotif();
    }, []);

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-black text-white border-r border-neutral-800 flex flex-col py-6">
            <div className="px-6 mb-8">
                <h1 className="text-2xl font-semibold font-sans">Instagram</h1>
            </div>

            <nav className="flex flex-col gap-4 px-3">
                {links.map((link) => {
                    const active = pathname === link.href;
                    const isNotif = link.name === "Notifications";

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`relative flex items-center gap-4 px-4 py-2 rounded-lg hover:bg-neutral-900 transition ${active ? "font-semibold" : "font-normal"
                                }`}
                        >
                            <div
                                className={`${active ? "text-white" : "text-neutral-400"} transition relative`}
                            >
                                {link.icon}

                                {isNotif && hasNotifications && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600"></span>
                                )}
                            </div>

                            <span
                                className={`${active ? "text-white" : "text-neutral-400"} text-[15px]`}
                            >
                                {link.name}
                            </span>
                        </Link>
                    );
                })}

            </nav>
        </aside>
    );
}
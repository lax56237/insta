"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserResult {
    username: string;
    profilePic: string;
    email: string
}

export default function Search() {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [showResults, setShowResults] = useState<boolean>(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const fetchUsers = async () => {
            try {
                const res = await fetch(`/api/searchingUser/searchUser?q=${query}`);
                const data = await res.json();
                setResults(data.users || []);
                setShowResults(true);
            } catch (err) {
                console.error(err);
            }
        };

        const delay = setTimeout(fetchUsers, 300); // debounce
        return () => clearTimeout(delay);
    }, [query]);


    const handleUserClick = (username: string) => {
        router.push(`/searchedProfile?username=${username}`);
    };
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    return (
        <div className="bg-black text-white min-h-screen px-6 py-6 flex flex-col items-center">
            <h1 className="text-2xl font-semibold mb-6 w-full max-w-md">Search</h1>

            <div ref={searchRef} className="relative w-full max-w-md">
                <input
                    type="text"
                    placeholder="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setShowResults(true)}
                    className="w-full bg-neutral-900 text-white placeholder-neutral-500 px-4 py-2 rounded-xl outline-none pr-10 focus:ring-1 focus:ring-neutral-700"
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}

                {showResults && results.length > 0 && (
                    <div
                        className="absolute left-0 w-full mt-2 bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 animate-fadeIn overflow-hidden z-50"
                    >
                        {results.map((user, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setQuery(user.username);
                                    setShowResults(false);
                                    handleUserClick(user.username);
                                }}
                                className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-neutral-800 transition"
                            >
                                <img
                                    src={user.profilePic || "/default-avatar.png"}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="text-sm font-medium">{user.username}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-10 text-neutral-500 text-sm">
                <p>Type a username to search</p>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.15s ease-in-out;
                }
            `}</style>
        </div>
    );
}

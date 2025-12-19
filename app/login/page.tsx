"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Please fill all fields");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username: email, password }),
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Login failed");
                return;
            }
            alert("login successfully");
            const check = await fetch("/api/auth/checkProfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const result = await check.json();

            if (result.exists) {
                router.push("/home");
            } else {
                router.push("/createProfile");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleSignupRedirect = () => {
        router.push("/signup");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="w-full max-w-sm p-8 rounded-2xl bg-neutral-900 shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-6">Login</h1>

                <div className="flex flex-col space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-lg bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-lg bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <button
                        onClick={handleSignupRedirect}
                        className="w-full py-3 rounded-lg border border-gray-600 hover:bg-gray-800 transition"
                    >
                        Signup
                    </button>
                </div>
            </div>
        </div>
    );
}

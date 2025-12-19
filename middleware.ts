import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    // Only protect defined app paths
    if (
        !pathname.startsWith("/home") &&
        !pathname.startsWith("/search") &&
        !pathname.startsWith("/reels") &&
        !pathname.startsWith("/profile") &&
        !pathname.startsWith("/notifications") &&
        !pathname.startsWith("/create") &&
        !pathname.startsWith("/messages")
    ) {
        //allow other non secure pathes
        return NextResponse.next();
    }
    const access = req.cookies.get("access_token")?.value;
    const refresh = req.cookies.get("refresh_token")?.value;
    
    if (access) {
        const decoded = verifyToken(access);
        if (decoded) return NextResponse.next();
    }

    // Try refreshing if access expired but refresh exists
    if (refresh) {
        try {
            const refreshReq = new Request(`${req.nextUrl.origin}/api/auth/refresh`, {
                method: "POST",
                headers: {
                    Cookie: req.headers.get("cookie") || "",
                    "Content-Type": "application/json",
                },
            });

            const response = await fetch(refreshReq);

            if (response.ok) {
                const setCookieHeaders = response.headers.get("set-cookie");
                if (setCookieHeaders) {
                    const res = NextResponse.next();
                    // Forward the Set-Cookie header verbatim to avoid parsing issues
                    res.headers.set("set-cookie", setCookieHeaders);
                    return res;
                }
                return NextResponse.next();
            }
        } catch (error) {
            console.error("Refresh failed:", error);
        }
    }

    // No valid tokens found - redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        "/home/:path*",
        "/search/:path*",
        "/reels/:path*",
        "/profile/:path*",
        "/notifications/:path*",
        "/create/:path*",
        "/createProfile/:path*",
        "/messages/:path*",
    ],
};

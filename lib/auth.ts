import jwt, { JwtPayload } from "jsonwebtoken";

type TokenPayload = JwtPayload & { userId: string };

function getSecret(kind: "access" | "refresh"): string {

    const secret = kind === "access" ? process.env.ACCESS_SECRET : process.env.REFRESH_SECRET;
    if (!secret || secret.trim().length === 0) {
        throw new Error(`Missing ${kind.toUpperCase()}_SECRET environment variable`);
    }
    return secret;
}

export function createTokens(userId: string) {

    const accessSecret = getSecret("access");
    const refreshSecret = getSecret("refresh");
    const accessToken = jwt.sign({ userId }, accessSecret, {
        expiresIn: "24h",
        algorithm: "HS256",
    });
    const refreshToken = jwt.sign({ userId }, refreshSecret, {
        expiresIn: "90d",
        algorithm: "HS256",
    });
    return { accessToken, refreshToken };
}

export function verifyToken(token: string, isRefresh = false): TokenPayload | null {
    if (!token || typeof token !== "string") return null;
    try {
        const secret = getSecret(isRefresh ? "refresh" : "access");
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as TokenPayload;
        if (!decoded || typeof decoded !== "object" || !decoded.userId) return null;
        return decoded;
    } catch {
        return null;
    }
}
// src/lib/auth.ts

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const TOKEN_NAME = "auth_token";

const secretKey = process.env.JWT_SECRET || "dev-secret";
const secret = new TextEncoder().encode(secretKey);

/**
 * Creates a signed JWT token for a user.
 */
export async function createUserToken(userId: number) {
    return await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);
}

/**
 * Read the authenticated user from the JWT cookie.
 * Works in Next.js 16 because we await cookies().
 */
export async function getCurrentUser() {
    // ⬅ FIXED: cookies() now returns a Promise in Next.js 16
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId;

        if (!userId || typeof userId !== "number") return null;

        return await prisma.user.findUnique({
            where: { id: userId },
        });
    } catch (err) {
        console.error("JWT verify error:", err);
        return null;
    }
}

/**
 * Set the auth cookie in a route handler
 */
export function setAuthCookie(res: any, token: string) {
    if (!res?.cookies) return;

    res.cookies.set(TOKEN_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
    });
}

/**
 * Clear auth cookie (logout)
 */
export function clearAuthCookie(res: any) {
    if (!res?.cookies) return;

    res.cookies.set(TOKEN_NAME, "", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0),
    });
}

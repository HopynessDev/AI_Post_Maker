import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUserToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 400 }
            );
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 400 }
            );
        }

        const token = await createUserToken(user.id);
        const res = NextResponse.json(
            { user: { id: user.id, email: user.email } },
            { status: 200 }
        );

        setAuthCookie(res, token);

        return res;
    } catch (err) {
        console.error("Login error", err);
        return NextResponse.json(
            { message: "Failed to login" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    // simple logout endpoint later if you want
    const res = NextResponse.json({ message: "Logged out" }, { status: 200 });
    clearAuthCookie(res);
    return res;
}

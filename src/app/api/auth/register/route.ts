import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUserToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { message: "Email and password (min 6 chars) are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const token = await createUserToken(user.id);
    const res = NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 201 }
    );

    setAuthCookie(res, token);

    return res;
  } catch (err) {
    console.error("Register error", err);
    return NextResponse.json(
      { message: "Failed to register" },
      { status: 500 }
    );
  }
}

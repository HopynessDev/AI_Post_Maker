// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/products  -> list all products
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    console.error("GET /api/products error", err);
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products -> create a new product with a Shopify URL
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { message: "A valid URL is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: { url, userId: user.id },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error", err);
    return NextResponse.json(
      { message: "Failed to create product" },
      { status: 500 }
    );
  }
}

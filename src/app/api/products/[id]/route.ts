// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteParams = {
    params: {
        id: string;
    };
};

export async function DELETE(_req: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            );
        }

        const productId = Number(params.id);
        if (Number.isNaN(productId)) {
            return NextResponse.json(
                { message: "A valid product id is required" },
                { status: 400 }
            );
        }

        const existing = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!existing || existing.userId !== user.id) {
            return NextResponse.json(
                { message: "Product not found" },
                { status: 404 }
            );
        }

        await prisma.product.delete({
            where: { id: productId },
        });

        return NextResponse.json(
            { message: "Product deleted successfully" },
            { status: 200 }
        );
    } catch (err) {
        console.error("DELETE /api/products/[id] error", err);
        return NextResponse.json(
            { message: "Failed to delete product" },
            { status: 500 }
        );
    }
}

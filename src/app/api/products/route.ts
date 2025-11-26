import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function DELETE(_req: Request, { params }: RouteParams) {
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid product id" },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/products/[id] error:", err);

    // Optional: handle "not found" specifically
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

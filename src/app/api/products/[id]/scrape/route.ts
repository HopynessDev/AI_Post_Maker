// src/app/api/products/[id]/scrape/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Next.js (latest app router) gives params as a Promise in dynamic API routes
type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, context: Context) {
  try {
    // Unwrap params (this fixes the "params is a Promise" error)
    const { id } = await context.params;
    const productId = Number(id);

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product id" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Build the Shopify JSON URL
    // Example: https://store.com/products/foo -> https://store.com/products/foo.json
    const cleanUrl = product.url.split("?")[0];
    const jsonUrl = cleanUrl.endsWith(".json") ? cleanUrl : `${cleanUrl}.json`;

    const res = await fetch(jsonUrl);

    if (!res.ok) {
      console.error("Shopify JSON fetch failed:", await res.text());
      return NextResponse.json(
        { message: "Could not fetch Shopify product JSON" },
        { status: 400 }
      );
    }

    const data = await res.json();

    // Many Shopify stores return { product: { ... } }, some just return the product
    const shopifyProduct = (data as any).product ?? data;

    // Basic fields
    const title: string | undefined = shopifyProduct.title;
    const description: string | undefined =
      shopifyProduct.body_html || shopifyProduct.description || "";
    const price: string | undefined =
      shopifyProduct.variants?.[0]?.price?.toString();
    const imageUrl: string | undefined =
      shopifyProduct.image?.src || shopifyProduct.images?.[0]?.src;

    // Extra fields
    const vendor: string | undefined = shopifyProduct.vendor;
    const productType: string | undefined = shopifyProduct.product_type;

    // Variants as a simplified array, later stored as a JSON string
    const variantsArray =
      shopifyProduct.variants?.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        available: v.available,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      })) ?? null;

    // Options (like Size, Color, etc.), also stored as JSON string
    const optionsObj = shopifyProduct.options ?? null;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description,
        price,
        imageUrl,
        vendor,
        productType,
        variants: variantsArray ? JSON.stringify(variantsArray) : null,
        options: optionsObj ? JSON.stringify(optionsObj) : null,
      },
    });

    return NextResponse.json(
      {
        message: "Product scraped successfully",
        product: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to scrape product" },
      { status: 500 }
    );
  }
}

// src/app/api/products/[id]/generate-posts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: Context) {
  try {
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
    let style = "default";
    try {
      const body = await req.json();
      if (body && typeof body.style === "string") {
        style = body.style;
      }
    } catch {
      // no body is fine, keep default style
    }

    let styleInstructions = "";
    switch (style) {
      case "review":
        styleInstructions =
          "Focus on a personal review tone, like the user has actually tried the product and is sharing pros, cons, and honest thoughts.";
        break;
      case "question":
        styleInstructions =
          "Focus on asking questions, seeking advice, and starting discussion. Make the user sound curious and open to replies.";
        break;
      case "story":
        styleInstructions =
          "Use a storytelling tone, where the user explains their situation, context, or journey and how this product fits into it.";
        break;
      default:
        styleInstructions =
          "Use a mix of light review and discussion tone that feels natural for Reddit.";
        break;
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { message: "GEMINI_API_KEY is not set on the server" },
        { status: 500 }
      );
    }

    const {
      title,
      description,
      price,
      vendor,
      productType,
      url,
      variants,
      options,
    } = product;

    const cleanDescription = (description || "").replace(/<[^>]+>/g, "");

    let parsedVariants: unknown = null;
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch {
        parsedVariants = null;
      }
    }

    let parsedOptions: unknown = null;
    if (options) {
      try {
        parsedOptions = JSON.parse(options);
      } catch {
        parsedOptions = null;
      }
    }

    const prompt = `
You are an expert Reddit marketer.

Write 3 different Reddit post ideas promoting this product in a natural, non-spammy way.

Reddit post style preference:
${style} → ${styleInstructions}

Return ONLY valid JSON in this exact format:

{
  "posts": [
    { "title": "string", "body": "string", "subreddit": "string" },
    { "title": "string", "body": "string", "subreddit": "string" },
    { "title": "string", "body": "string", "subreddit": "string" }
  ]
}

Product info (use this to make the posts specific and helpful):

- Title: ${title ?? "N/A"}
- Vendor / Brand: ${vendor ?? "N/A"}
- Type: ${productType ?? "N/A"}
- Price: ${price ?? "N/A"}
- URL: ${url}

Description:
${cleanDescription || "N/A"}

Variants (JSON):
${parsedVariants ? JSON.stringify(parsedVariants, null, 2) : "N/A"}

Options (JSON):
${parsedOptions ? JSON.stringify(parsedOptions, null, 2) : "N/A"}

Make the posts sound like a real Reddit user in that style.
Avoid being too salesy. Vary the angle between posts.
    `.trim();


    // 👉 This is the key line: correct model + correct endpoint
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      console.error("Gemini API error:", text);
      return NextResponse.json(
        { message: "Failed to generate posts from Gemini" },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();

    // Gemini returns candidates[].content.parts[].text
    const raw =
      geminiData.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text ?? "")
        .join("\n") ?? "";

    // Strip Markdown code fences like ```json ... ```
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      // Remove first line (``` or ```json)
      const firstNewline = cleaned.indexOf("\n");
      if (firstNewline !== -1) {
        cleaned = cleaned.slice(firstNewline + 1);
      }
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, cleaned.lastIndexOf("```")).trim();
    }

    let parsed: any = null;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse Gemini JSON:", err, raw);
      return NextResponse.json(
        {
          message:
            "Gemini did not return valid JSON. Check server logs for details.",
        },
        { status: 500 }
      );
    }

    const posts = Array.isArray(parsed.posts) ? parsed.posts : [];

    return NextResponse.json(
      {
        message: "Reddit posts generated successfully",
        posts,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(
      "POST /api/products/[id]/generate-posts (Gemini) error",
      err
    );
    return NextResponse.json(
      { message: "Failed to generate Reddit posts" },
      { status: 500 }
    );
  }
}

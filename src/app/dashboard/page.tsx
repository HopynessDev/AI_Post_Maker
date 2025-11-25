"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  url: string;
  createdAt: string;
  title?: string | null;
  description?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  vendor?: string | null;
  productType?: string | null;
  variants?: string | null; // JSON string from DB
  options?: string | null;  // JSON string from DB
};

type GeneratedPost = {
  title: string;
  body: string;
  subreddit?: string;
};

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [generatedPostsByProduct, setGeneratedPostsByProduct] = useState<
    Record<number, GeneratedPost[]>
  >({});
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [postStyle, setPostStyle] = useState("default");

  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) return;
      const data = await res.json();
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      setMessage("Product saved!");
      setUrl("");
      loadProducts();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  }

  async function handleScrape(id: number) {
    setMessage("");

    try {
      const res = await fetch(`/api/products/${id}/scrape`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to scrape product");
        return;
      }

      setMessage("Product scraped!");
      loadProducts();
    } catch (err) {
      console.error(err);
      setMessage("Failed to scrape product");
    }
  }

  async function handleDelete(id: number) {
    setMessage("");

    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to delete product");
        return;
      }

      setMessage("Product deleted!");
      setProducts((prev) => prev.filter((p) => p.id !== id));

      // Also remove any generated posts for that product
      setGeneratedPostsByProduct((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete product");
    }
  }

  async function handleGeneratePosts(id: number) {
    setMessage("");
    setGeneratingFor(id);

    try {
      const res = await fetch(`/api/products/${id}/generate-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: postStyle }),
      });


      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to generate Reddit posts");
        setGeneratingFor(null);
        return;
      }

      setGeneratedPostsByProduct((prev) => ({
        ...prev,
        [id]: data.posts || [],
      }));

      setMessage("Reddit posts generated!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to generate Reddit posts");
    } finally {
      setGeneratingFor(null);
    }
  }

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-sm text-gray-600 mb-4">
        Add a Shopify product URL, scrape its data, and generate Reddit posts.
      </p>

      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Reddit post style:</span>
        <select
          value={postStyle}
          onChange={(e) => setPostStyle(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-black text-white"
        >
          <option value="default" className="bg-black text-white">Default mix</option>
          <option value="review" className="bg-black text-white">Personal review</option>
          <option value="question" className="bg-black text-white">Question / discussion</option>
          <option value="story" className="bg-black text-white">Story / experience</option>
        </select>

      </div>

      <p className="text-sm text-gray-600 mb-4">
        Add a Shopify product URL, scrape its data, and generate Reddit posts.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 border rounded p-4">
        <label className="block">
          <span className="font-medium">Shopify product URL</span>
          <input
            type="url"
            required
            className="mt-1 w-full border rounded p-2"
            placeholder="https://yourstore.com/products/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save product
        </button>
      </form>

      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Saved products</h2>

        {products.length === 0 && (
          <p className="text-sm text-gray-600">
            No products yet. Add your first Shopify URL above.
          </p>
        )}

        <ul className="space-y-4">
          {products.map((p) => {
            // Parse variants
            let parsedVariants: any[] = [];
            if (p.variants) {
              try {
                const v = JSON.parse(p.variants);
                if (Array.isArray(v)) parsedVariants = v;
              } catch {
                parsedVariants = [];
              }
            }

            // Parse options
            let parsedOptions: any[] = [];
            if (p.options) {
              try {
                const o = JSON.parse(p.options);
                if (Array.isArray(o)) parsedOptions = o;
              } catch {
                parsedOptions = [];
              }
            }

            const posts = generatedPostsByProduct[p.id] || [];

            return (
              <li
                key={p.id}
                className="border rounded p-3 text-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="font-medium break-all">{p.url}</div>
                    <div className="text-xs text-gray-500">
                      Saved at: {new Date(p.createdAt).toLocaleString()}
                    </div>

                    {p.title && (
                      <div className="mt-2">
                        <div className="font-semibold">Title:</div>
                        <div>{p.title}</div>
                      </div>
                    )}

                    {p.vendor && (
                      <div className="mt-1">
                        <span className="font-semibold">Vendor:</span>{" "}
                        {p.vendor}
                      </div>
                    )}

                    {p.productType && (
                      <div className="mt-1">
                        <span className="font-semibold">Type:</span>{" "}
                        {p.productType}
                      </div>
                    )}

                    {p.price && (
                      <div className="mt-1">
                        <span className="font-semibold">Price:</span>{" "}
                        <span>{p.price}</span>
                      </div>
                    )}

                    {p.description && (
                      <div className="mt-2">
                        <div className="font-semibold">Description:</div>
                        <div className="line-clamp-3">
                          {p.description.replace(/<[^>]+>/g, "")}
                        </div>
                      </div>
                    )}

                    {parsedVariants.length > 0 && (
                      <div className="mt-2">
                        <div className="font-semibold">Variants:</div>
                        <ul className="list-disc ml-4 text-xs">
                          {parsedVariants.map((v, i) => (
                            <li key={v.id ?? i}>
                              {v.title} — {v.price}
                              {v.sku ? ` (SKU: ${v.sku})` : ""}
                              {v.available === false ? " (Out of stock)" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedOptions.length > 0 && (
                      <div className="mt-2">
                        <div className="font-semibold">Options:</div>
                        <ul className="list-disc ml-4 text-xs">
                          {parsedOptions.map((o, i) => (
                            <li key={i}>
                              {o.name}:{" "}
                              {Array.isArray(o.values)
                                ? o.values.join(", ")
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.title || "Product image"}
                      className="w-24 h-24 object-cover rounded border"
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleScrape(p.id)}
                    className="bg-gray-800 text-white px-3 py-1 rounded text-xs"
                  >
                    Scrape from Shopify
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => handleGeneratePosts(p.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                    disabled={generatingFor === p.id}
                  >
                    {generatingFor === p.id
                      ? "Generating..."
                      : "Generate Reddit posts"}
                  </button>
                </div>

                {posts.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <div className="font-semibold mb-1 text-sm">
                      Generated Reddit posts:
                    </div>
                    <div className="space-y-3">
                      {posts.map((post, i) => (
                        <div
                          key={i}
                          className="rounded p-3 bg-blue-900 text-white text-xs space-y-2 shadow-sm"
                        >
                          <div className="font-semibold text-sm">{post.title}</div>

                          {post.subreddit && (
                            <div className="text-[11px] text-blue-200">
                              Suggested subreddit: r/{post.subreddit}
                            </div>
                          )}

                          <pre className="whitespace-pre-wrap text-[11px]">
                            {post.body}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

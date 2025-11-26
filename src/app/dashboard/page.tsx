"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  price?: string | null;
  vendor?: string | null;
  productType?: string | null;
  createdAt?: string;
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("");
  const [postStyle, setPostStyle] = useState("default");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [generateId, setGenerateId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load products on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        // Handle both { products: [...] } and plain array just in case
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to load products", err);
        setProducts([]);
      }
    }
    load();
  }, []);

  // Add product (via modal)
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setLoadingAdd(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok) {
        const newProduct: Product = data.product || data;
        setProducts((prev) => [newProduct, ...prev]);
        setUrl("");
        setIsAddModalOpen(false);
      } else {
        alert(data.message || data.error || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setLoadingAdd(false);
    }
  }

  // Scrape product
  async function handleScrape(id: number) {
    try {
      const res = await fetch(`/api/products/${id}/scrape`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        const updated: Product = data.product || data;
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );
      } else {
        alert(data.message || data.error || "Scrape failed");
      }
    } catch (err) {
      console.error(err);
      alert("Scrape error");
    }
  }

  // Delete product
  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || data.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Delete error");
    }
  }

  // Generate Reddit posts
  async function handleGeneratePosts(id: number) {
    setGenerateId(id);
    try {
      const res = await fetch(`/api/products/${id}/generate-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: postStyle }),
      });

      const data = await res.json();

      if (res.ok) {
        // You probably already show these somewhere in the UI
        console.log("Generated posts:", data);
        alert("Reddit posts generated successfully!");
      } else {
        alert(data.message || data.error || "Generation failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating posts");
    } finally {
      setGenerateId(null);
    }
  }

  return (
    <div className="min-h-screen">
      {/* NAVBAR */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-sm font-bold text-white shadow-md">
              AI
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">
                AI Post Maker
              </div>
              <div className="text-[11px] text-slate-500">
                Shopify → Reddit content engine
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              + Add product
            </button>
            <a
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
            >
              Log out
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        {/* LEFT COLUMN: style selector */}
        <section className="w-full lg:w-[340px] shrink-0 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-2 text-slate-900">
              Reddit post style
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Choose the tone Gemini should use when generating posts.
            </p>

            <select
              value={postStyle}
              onChange={(e) => setPostStyle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-black px-3 py-3 text-sm text-white"
            >
              <option className="bg-black text-white" value="default">
                Default mix
              </option>
              <option className="bg-black text-white" value="review">
                Personal review
              </option>
              <option className="bg-black text-white" value="question">
                Question / discussion
              </option>
              <option className="bg-black text-white" value="story">
                Story / experience
              </option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900">
              How the workflow works
            </div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click &quot;Add product&quot; to paste a Shopify URL.</li>
              <li>Scrape the product once it&apos;s added.</li>
              <li>Generate Reddit posts using the scraped data.</li>
            </ol>
          </div>
        </section>

        {/* RIGHT COLUMN: products list */}
        <section className="flex-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Your products</h2>

          {products.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              You don&apos;t have any products yet.
              <br />
              Click <span className="font-semibold">“Add product”</span> in the
              top right to get started.
            </div>
          )}

          {products.map((p) => {
            const scraped = Boolean(p.title || p.description);

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4"
              >
                {/* Top row: title + URL */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900">
                    {p.title || "Untitled product"}
                  </h3>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                  >
                    {p.url}
                  </a>
                </div>

                {/* Middle: image + description */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {p.imageUrl && (
                    <div className="shrink-0">
                      <img
                        src={p.imageUrl}
                        alt={p.title || "Product image"}
                        className="h-32 w-32 rounded-xl border border-slate-200 object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-slate-700">
                    {p.description && (
                      <p className="leading-relaxed line-clamp-4">
                        {p.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {p.vendor && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          Vendor: {p.vendor}
                        </span>
                      )}
                      {p.productType && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          Type: {p.productType}
                        </span>
                      )}
                      {p.price && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          Price: {p.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom row: actions */}
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  {/* Left: primary action — scrape OR generate */}
                  <div className="flex items-center gap-3">
                    {!scraped ? (
                      <button
                        onClick={() => handleScrape(p.id)}
                        className="rounded-lg bg-blue-600 px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base font-semibold text-white shadow-sm hover:bg-blue-500 transition"
                      >
                        Scrape from Shopify
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGeneratePosts(p.id)}
                        disabled={generateId === p.id}
                        className="rounded-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base font-semibold text-white shadow-sm hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 disabled:opacity-60 transition"
                      >
                        {generateId === p.id
                          ? "Generating Reddit posts..."
                          : "Generate Reddit posts"}
                      </button>
                    )}
                  </div>

                  {/* Right: delete */}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition"
                  >
                    Delete product
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Add Shopify product
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Paste a product URL from your Shopify store. We&apos;ll use it
                  to scrape the title, description, images, and more.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Shopify product URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://yourstore.com/products/awesome-product"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAdd}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
                >
                  {loadingAdd ? "Adding..." : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

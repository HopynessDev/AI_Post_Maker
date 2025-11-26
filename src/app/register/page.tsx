"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [postStyle, setPostStyle] = useState("default");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [generateId, setGenerateId] = useState<number | null>(null);

  // Load products on mount
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data || []);
    }
    load();
  }, []);

  // Add product URL
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
        setProducts([data, ...products]);
        setUrl("");
      } else {
        alert(data.error || "Failed to add product");
      }
    } catch (err) {
      alert("Error adding product");
    } finally {
      setLoadingAdd(false);
    }
  }

  // Scrape product
  async function handleScrape(id: number) {
    try {
      const res = await fetch(`/api/products/${id}/scrape`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setProducts((p) =>
          p.map((prod) => (prod.id === id ? { ...prod, ...data } : prod))
        );
      } else {
        alert(data.error || "Scrape failed");
      }
    } catch (err) {
      alert("Scrape error");
    }
  }

  // Delete product
  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id));
    } else {
      alert("Delete failed");
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
        alert("Posts generated! Scroll down to view output in console.");
        console.log("Generated posts:", data);
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (e) {
      alert("Error generating posts");
    } finally {
      setGenerateId(null);
    }
  }

  return (
    <div className="min-h-screen">
      {/* NAVBAR */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 text-xs font-bold text-slate-950 shadow-md">
              AI
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                AI Post Maker
              </div>
              <div className="text-[11px] text-slate-400">
                Shopify → Reddit content engine
              </div>
            </div>
          </div>

          <a
            href="/login"
            className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-300 hover:border-cyan-400 hover:text-cyan-200 transition"
          >
            Log out
          </a>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">

        {/* LEFT COLUMN */}
        <section className="w-full lg:w-[340px] shrink-0 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
            <h2 className="text-sm font-semibold mb-3 text-slate-200">
              Add Shopify Product
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <input
                type="url"
                placeholder="https://yourstore.com/products/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              />

              <button
                type="submit"
                disabled={loadingAdd}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 disabled:opacity-60"
              >
                {loadingAdd ? "Adding..." : "Add Product"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
            <h2 className="text-sm font-semibold mb-2 text-slate-200">
              Post Style
            </h2>

            <select
              value={postStyle}
              onChange={(e) => setPostStyle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm text-white"
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
        </section>

        {/* RIGHT COLUMN */}
        <section className="flex-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Your Products</h2>

          {products.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
              No products yet. Paste a Shopify URL on the left to get started.
            </div>
          )}

          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg shadow-black/30 backdrop-blur space-y-4"
            >
              <div className="flex justify-between">
                <h3 className="text-md font-semibold text-slate-100">
                  {p.title || "Untitled Product"}
                </h3>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-300 text-xs hover:text-red-400"
                >
                  Delete
                </button>
              </div>

              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt="Product"
                  className="w-32 h-32 object-cover rounded-lg border border-slate-800"
                />
              )}

              <p className="text-sm text-slate-300">{p.description}</p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleScrape(p.id)}
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                >
                  Scrape Product
                </button>

                <button
                  onClick={() => handleGeneratePosts(p.id)}
                  disabled={generateId === p.id}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 disabled:opacity-60"
                >
                  {generateId === p.id ? "Generating..." : "Generate Reddit Posts"}
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || data.error || "Failed to login");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left side: branding / hero */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            AI Shopify → Reddit content engine
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
            Welcome back to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              AI Post Maker
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-md">
            Log in to manage your Shopify products, scrape product details, and
            instantly generate Reddit-ready posts powered by Gemini.
          </p>

          <div className="hidden lg:flex gap-3 text-xs text-slate-400">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
              <div className="text-slate-200 font-medium text-xs">
                Smart Reddit tones
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Switch between review, question, and story styles with a single
                dropdown.
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
              <div className="text-slate-200 font-medium text-xs">
                Shopify-native scraping
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Paste a product URL, we do the rest: titles, variants, and
                descriptions.
              </div>
            </div>
          </div>
        </div>

        {/* Right side: card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.8)] backdrop-blur">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Log in</h2>
            <p className="text-xs text-slate-400 mt-1">
              Use the email and password you registered with.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-300">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-300">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-md px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-400 text-center">
            Don&apos;t have an account yet?{" "}
            <a
              href="/register"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-xl font-semibold mb-4 text-slate-900 text-center">
          Create your account
        </h1>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-slate-300 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-slate-300 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg py-3 font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <div className="text-xs text-center text-slate-500 mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-cyan-600 font-medium hover:underline">
              Log in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to login");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Failed to login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="border border-gray-700 rounded p-6 w-full max-w-sm bg-gray-900">
        <h1 className="text-xl font-bold mb-4">Log in</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-700 rounded px-2 py-1 bg-black text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border border-gray-700 rounded px-2 py-1 bg-black text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message && <p className="text-sm text-red-400">{message}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-semibold"
          >
            Log in
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-300">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-blue-400 underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get("next") ?? "/");
    } else {
      setError("Wrong password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
      <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-sm" style={{ border: "1px solid #E2D9CC" }}>
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(30,58,74,0.5)" }}>Property Finance</div>
        <h1 className="font-display text-2xl font-medium mb-6" style={{ color: "#1E3A4A" }}>Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "#F5F0E8", border: "1px solid #E2D9CC", color: "#1E3A4A" }}
          />
          {error && <p className="text-sm" style={{ color: "#D4684A" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: "#1E3A4A", color: "#F5F0E8" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

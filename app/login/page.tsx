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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f4f7f4" }}>
      <div className="bg-white border border-[#d4e0d4] rounded-xl p-8 w-full max-w-sm shadow-sm">
        <div className="text-xs uppercase tracking-widest text-[#8faa8f] mb-2">Property Finance</div>
        <h1 className="font-display text-2xl font-medium text-[#2d3b2d] mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full bg-[#f4f7f4] border border-[#d4e0d4] rounded-lg px-3 py-2 text-sm text-[#2d3b2d] outline-none focus:border-[#3d5c3d]"
          />
          {error && <p className="text-sm text-[#8b4a4a]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3d5c3d] text-[#f4f7f4] rounded-lg py-2 text-sm font-medium disabled:opacity-50"
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

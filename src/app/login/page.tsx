"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { useApp } from "@/components/Providers";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, refreshSettings } = useApp();
  const [email, setEmail] = useState("admin@aesthetic.shop");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(token);
      await refreshUser();
      await refreshSettings();
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-2xl">
            ✨
          </div>
          <h1 className="text-2xl font-bold">Aesthetic-Broadcast Pro</h1>
          <p className="mt-1 text-sm text-gray-500">
            WhatsApp marketing for aesthetic shops
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-xs text-gray-400">
            Default seed login: admin@aesthetic.shop
          </p>
        </form>
      </div>
    </div>
  );
}

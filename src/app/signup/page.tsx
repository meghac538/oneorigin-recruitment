"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, password }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Signup failed.");
      }
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
      <main className="mx-auto flex w-full max-w-lg flex-col items-center justify-center px-6 py-24">
        <div className="w-full rounded-[32px] border border-[#e5e7eb] bg-white px-8 py-10 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.4em] text-[#4b5563]">
            OneOrigin
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Create account</h1>
          <p className="mt-2 text-sm text-[#4b5563]">
            Set up your hiring workspace in minutes.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="text-sm font-semibold text-[#0a0a0a]">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                placeholder="Megha Patel"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#0a0a0a]">
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                placeholder="OneOrigin"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#0a0a0a]">
              Work email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                placeholder="you@company.com"
                type="email"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#0a0a0a]">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                type="password"
                minLength={8}
                required
              />
            </label>
            {error && (
              <div className="rounded-2xl bg-[#a7dfff]/30 px-4 py-3 text-sm text-[#0a0a0a]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-[#4b5563]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0a0a0a]">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

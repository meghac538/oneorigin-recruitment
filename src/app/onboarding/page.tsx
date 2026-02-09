"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  user: { name?: string | null; company?: string | null } | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as MeResponse;
      if (!data.user) {
        router.push("/login");
        return;
      }
      setName(data.user.name ?? "");
      setCompany(data.user.company ?? "");
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save.");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
        <main className="mx-auto flex w-full max-w-lg items-center justify-center px-6 py-24">
          <div className="rounded-[32px] border border-[#e5e7eb] bg-white px-8 py-10 text-sm text-[#4b5563] shadow-[var(--shadow)]">
            Loading…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
      <main className="mx-auto flex w-full max-w-lg flex-col items-center justify-center px-6 py-24">
        <div className="w-full rounded-[32px] border border-[#e5e7eb] bg-white px-8 py-10 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.4em] text-[#4b5563]">
            OneOrigin
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Finish onboarding</h1>
          <p className="mt-2 text-sm text-[#4b5563]">
            Add your hiring profile to personalize reports.
          </p>
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <label className="text-sm font-semibold text-[#0a0a0a]">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#0a0a0a]">
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
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
              disabled={saving}
              className="w-full rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

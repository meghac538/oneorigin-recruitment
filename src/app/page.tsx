"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InterviewForm = {
  role: string;
  level: string;
  name: string;
  email: string;
  mode: string;
};

const ROLE_OPTIONS = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-stack Engineer",
  "Data Engineer",
  "ML Engineer",
  "Platform Engineer",
];

const LEVEL_OPTIONS = ["Mid-level", "Senior", "Staff"];

const MODE_OPTIONS = [
  {
    id: "build",
    name: "Build & ship",
    duration: "2 hours",
    summary:
      "Deliver a production-ready feature with tests, AI collaboration, and deployment notes.",
  },
  {
    id: "debug",
    name: "Debug & refactor",
    duration: "90 minutes",
    summary:
      "Fix regressions in a legacy service, improve reliability, and explain tradeoffs.",
  },
  {
    id: "design",
    name: "Design & align",
    duration: "60 minutes",
    summary:
      "Architect a system, align with stakeholders, and present decisions.",
  },
];

const TASK_TEMPLATES: Record<string, string[]> = {
  build: [
    "Implement a feature flag dashboard for ops to enable/disable critical features across regions.",
    "Ship a real-time collaboration widget with live cursor positions and permission controls.",
    "Add audit logging and export workflow to a billing system with strict compliance rules.",
  ],
  debug: [
    "Investigate an intermittent timeout in the payments pipeline and ship a safe fix.",
    "Reduce a 30% regression in search latency after a recent cache migration.",
    "Harden a flaky CI pipeline and refactor the failing integration tests.",
  ],
  design: [
    "Design a multi-tenant API gateway that supports rate limits and audit trails.",
    "Propose an event-driven architecture for syncing customer data across services.",
    "Plan a migration from a monolith to modular services with staged rollouts.",
  ],
};

const AI_PROMPTS = [
  "Draft clarifying questions for the PM.",
  "Suggest risks and edge cases to verify.",
  "Outline a testing plan with coverage priorities.",
];

export default function Home() {
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [form, setForm] = useState<InterviewForm>({
    role: ROLE_OPTIONS[2],
    level: LEVEL_OPTIONS[1],
    name: "",
    email: "",
    mode: MODE_OPTIONS[0].id,
  });
  const [generated, setGenerated] = useState(false);
  const [generationId, setGenerationId] = useState(0);
  const [shareLink, setShareLink] = useState("");
  const [candidateLink, setCandidateLink] = useState("");
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const recruiterLabel = useMemo(() => {
    if (!user) return "";
    const raw = user.name?.trim() || user.email;
    if (!raw) return "";
    if (user.name) {
      return raw.split(/\s+/)[0] ?? raw;
    }
    const emailPrefix = raw.split("@")[0] ?? raw;
    return emailPrefix.split(/[._-]/)[0] ?? emailPrefix;
  }, [user]);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as {
          user: { email: string; name?: string | null } | null;
        };
        setUser(data.user);
      } catch {
        setUser(null);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  const selectedMode = useMemo(
    () => MODE_OPTIONS.find((mode) => mode.id === form.mode),
    [form.mode]
  );

  const task = useMemo(() => {
    const list = TASK_TEMPLATES[form.mode] ?? [];
    if (!list.length) return "";
    const seeded = Math.abs(Math.sin(generationId + 1) * 10000);
    const index = Math.floor(seeded) % list.length;
    return list[index] ?? "";
  }, [form.mode, generationId]);

  const shareLinkValue = useMemo(() => {
    if (!generated) return "";
    return shareLink;
  }, [generated, shareLink]);
  const candidateLinkValue = useMemo(() => {
    if (!generated) return "/candidate";
    return candidateLink;
  }, [generated, candidateLink]);

  function handleChange<K extends keyof InterviewForm>(
    key: K,
    value: InterviewForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatorError(null);
    setCreating(true);
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: form.role,
          level: form.level,
          mode: form.mode,
          candidateName: form.name,
          candidateEmail: form.email,
        }),
      });
      const data = (await response.json()) as { token?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate link.");
      }
      if (!data.token) {
        throw new Error("Missing interview token.");
      }
      const token = data.token;
      setShareLink(`/interview/${token}`);
      setCandidateLink(`/candidate?t=${token}`);
      setGenerated(true);
      setGenerationId((prev) => prev + 1);
    } catch (err) {
      setCreatorError(
        err instanceof Error ? err.message : "Unable to generate link."
      );
    } finally {
      setCreating(false);
    }
  }
  return (
    <div className="min-h-screen text-[#0a0a0a]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-[var(--shadow)]">
            <Image
              src="/OneOrigin-logo.png"
              alt="OneOrigin logo"
              width={36}
              height={36}
              priority
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">
              OneOrigin
            </p>
            <p className="text-lg font-semibold">Interviews</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#4b5563] lg:flex">
          <a className="transition hover:text-[#0a0a0a]" href="#how">
            How it works
          </a>
          <a className="transition hover:text-[#0a0a0a]" href="#modes">
            Interview modes
          </a>
          <a className="transition hover:text-[#0a0a0a]" href="#create">
            Interview creator
          </a>
          <a className="transition hover:text-[#0a0a0a]" href="#reports">
            Reports
          </a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="max-w-[180px] truncate text-sm font-semibold text-[#0a0a0a]">
                Hi {recruiterLabel}!
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-[#0a0a0a] px-5 py-2 text-sm font-semibold"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-[#0a0a0a] px-5 py-2 text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#3ab8ff] px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:translate-y-[-2px]"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="relative overflow-hidden rounded-[32px] border border-[#e5e7eb] bg-[#f7fbff] px-8 py-16 shadow-[var(--shadow)] animate-[fadeUp_0.9s_ease-out]">
          <div className="absolute right-[-80px] top-[-100px] h-64 w-64 rounded-full bg-[#3ab8ff]/20 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-100px] h-56 w-56 rounded-full bg-[#38bdf8]/20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#ffffff]">
                Stop memory tests
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Hire engineers who can actually do the job, not just pass
                interviews.
              </h1>
              <p className="max-w-xl text-lg text-[#4b5563]">
                AI changed how software is built. OneOrigin simulates real
                engineering work with open-ended tasks, AI teammates, and
                live collaboration so you can see how candidates think, build,
                and communicate.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <a
                    href="#create"
                    className="rounded-full bg-[#3ab8ff] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:translate-y-[-2px]"
                  >
                    Generate an interview
                  </a>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-[#3ab8ff] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:translate-y-[-2px]"
                  >
                    Sign in to generate
                  </Link>
                )}
                {user && (
                  <Link
                    href="/reports"
                    className="rounded-full border border-[#0a0a0a] px-6 py-3 text-sm font-semibold text-[#0a0a0a]"
                  >
                    View reports
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[#4b5563]">
                <span>✓ Open-ended tasks</span>
                <span>✓ AI collaboration allowed</span>
                <span>✓ Clear performance report</span>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-[#e5e7eb] bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4b5563]">
                  Live workspace
                </p>
                <span
                  className="rounded-full bg-[#a7dfff]/30 px-3 py-1 text-xs font-semibold"
                  style={{ animation: "floaty 6s ease-in-out infinite" }}
                >
                  AI teammate active
                </span>
              </div>
              <div className="space-y-3 text-sm text-[#4b5563]">
                <p className="rounded-2xl bg-[#ffffff] px-4 py-3">
                  Candidate clarifies requirements with PM.
                </p>
                <p className="rounded-2xl bg-[#ffffff] px-4 py-3">
                  AI pair suggests edge cases and tests.
                </p>
                <p className="rounded-2xl bg-[#ffffff] px-4 py-3">
                  Candidate ships code + walkthrough video.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-[#e5e7eb] px-4 py-4">
                <p className="text-sm font-semibold">Performance snapshot</p>
                <div className="mt-3 grid gap-3 text-xs text-[#4b5563]">
                  <div className="flex items-center justify-between">
                    <span>Problem framing</span>
                    <span className="font-semibold text-[#0a0a0a]">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI collaboration</span>
                    <span className="font-semibold text-[#0a0a0a]">Strong</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery quality</span>
                    <span className="font-semibold text-[#0a0a0a]">High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mt-20 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-[#4b5563]">
              How it works
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              A comprehensive 5-step interview process that evaluates the
              complete candidate.
            </h2>
            <p className="text-lg text-[#4b5563]">
              Each segment is designed to surface reasoning, communication, and
              AI collaboration—not just code output.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                step: "01",
                title: "Ice Breaker",
                body: "Warm, conversational intro to understand context.",
              },
              {
                step: "02",
                title: "Case Study",
                body: "Real-world problem scenario grounded in the role.",
              },
              {
                step: "03",
                title: "PM Discussion",
                body: "Clarify requirements with an AI PM avatar.",
              },
              {
                step: "04",
                title: "Coding + Copilot",
                body: "Build a POC with AI assistance and reasoning notes.",
              },
              {
                step: "05",
                title: "Presentation",
                body: "Present to AI PM & EM with tradeoffs and next steps.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] p-6 shadow-[var(--shadow)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4b5563]">
                  {item.step}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-[#4b5563]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="modes" className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-[#4b5563]">
                Interview modes
              </p>
              <h2 className="text-3xl font-semibold md:text-4xl">
                Choose the experience that matches the role.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {MODE_OPTIONS.map((mode) => (
              <div
                key={mode.name}
                className="rounded-3xl border border-[#e5e7eb] bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4b5563]">
                    {mode.duration}
                  </p>
                  <span className="text-2xl">★</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{mode.name}</h3>
                <p className="mt-3 text-sm text-[#4b5563]">{mode.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="create" className="mt-20">
          <div className="rounded-[32px] border border-[#e5e7eb] bg-white p-8 shadow-[var(--shadow)]">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[#4b5563]">
                  Interview creator
                </p>
                <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                  Generate interview in minutes.
                </h2>
                <p className="mt-4 text-lg text-[#4b5563]">
                  Pick the role, candidate, and mode. OneOrigin generates an open-ended task,
                  AI teammate guidance, and a shareable interview link.
                </p>
                <div className="mt-6 rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] p-5 text-sm text-[#4b5563]">
                  <p className="font-semibold text-[#0a0a0a]">What gets generated</p>
                  <ul className="mt-3 space-y-2">
                    <li>Customized task brief + success criteria</li>
                    <li>AI teammate prompts and collaboration rules</li>
                    <li>Shareable interview link with time window</li>
                  </ul>
                </div>
              </div>

              {user ? (
                <form
                  onSubmit={handleGenerate}
                  className="space-y-5 rounded-3xl border border-[#e5e7eb] bg-[#ffffff] p-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold text-[#0a0a0a]">
                      Role
                      <select
                        value={form.role}
                        onChange={(event) => handleChange("role", event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-[#0a0a0a]">
                      Level
                      <select
                        value={form.level}
                        onChange={(event) => handleChange("level", event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm"
                      >
                        {LEVEL_OPTIONS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold text-[#0a0a0a]">
                      Candidate name
                      <input
                        value={form.name}
                        onChange={(event) => handleChange("name", event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm"
                        placeholder="Jordan Lee"
                        required
                      />
                    </label>
                    <label className="text-sm font-semibold text-[#0a0a0a]">
                      Candidate email
                      <input
                        value={form.email}
                        onChange={(event) => handleChange("email", event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm"
                        placeholder="jordan@company.com"
                        type="email"
                        required
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">Interview mode</p>
                    <div className="mt-3 grid gap-3">
                      {MODE_OPTIONS.map((mode) => (
                        <label
                          key={mode.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                            form.mode === mode.id
                              ? "border-[#0a0a0a] bg-white"
                              : "border-[#e5e7eb] bg-[#f7fbff]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="mode"
                            value={mode.id}
                            checked={form.mode === mode.id}
                            onChange={() => handleChange("mode", mode.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-semibold text-[#0a0a0a]">{mode.name}</p>
                            <p className="text-xs text-[#4b5563]">{mode.summary}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full rounded-full bg-[#3ab8ff] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:translate-y-[-2px] disabled:opacity-60"
                  >
                    {creating ? "Generating…" : "Generate interview"}
                  </button>
                  {creatorError && (
                    <div className="rounded-2xl bg-[#a7dfff]/30 px-4 py-3 text-sm text-[#0a0a0a]">
                      {creatorError}
                    </div>
                  )}
                </form>
              ) : (
                <div className="rounded-3xl border border-[#e5e7eb] bg-[#ffffff] p-6">
                  <p className="text-sm font-semibold text-[#0a0a0a]">
                    Sign in to create interview links
                  </p>
                  <p className="mt-2 text-sm text-[#4b5563]">
                    You’ll be able to generate candidate links and access reports
                    tied to your hiring team.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/login"
                      className="rounded-full bg-[#0a0a0a] px-5 py-2 text-sm font-semibold text-[#ffffff]"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-full border border-[#0a0a0a] px-5 py-2 text-sm font-semibold"
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-[#e5e7eb] bg-[#0a0a0a] p-6 text-[#ffffff]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#a7dfff]">
                  Generated task
                </p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {generated ? task : "Your task brief will appear here."}
                </h3>
                <p className="mt-4 text-sm text-[#94a3b8]">
                  {generated
                    ? `Role: ${form.level} ${form.role} · Mode: ${selectedMode?.name}`
                    : "Fill in the form and generate to see a real prompt."}
                </p>
                <div className="mt-6 rounded-2xl bg-[#0f172a] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#a7dfff]">
                    AI teammate prompts
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#cbd5e1]">
                    {AI_PROMPTS.map((prompt) => (
                      <li key={prompt}>• {prompt}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                  Share link
                </p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {generated ? "Interview ready to send." : "Awaiting generation."}
                </h3>
                <p className="mt-3 text-sm text-[#4b5563]">
                  {generated
                    ? "Send the link below to the candidate to open the live workspace."
                    : "Generate the interview to create a shareable link."}
                </p>
                <div className="mt-4 rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-4 py-4 text-sm text-[#0a0a0a]">
                  {generated ? shareLinkValue : "oneorigin.ai/interview/…"}
                </div>
                <a
                  href={candidateLinkValue}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-[#ffffff]"
                >
                  Open candidate workspace
                </a>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#4b5563]">
                  <span>✓ Time window: 72 hours</span>
                  <span>✓ AI collaboration allowed</span>
                  <span>✓ Auto-generated rubric</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="reports" className="mt-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-[#e5e7eb] bg-[#0a0a0a] p-8 text-[#ffffff]">
            <p className="text-xs uppercase tracking-[0.4em] text-[#a7dfff]">
              Performance report
            </p>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
              See how candidates think, not just what they ship.
            </h2>
            <p className="mt-4 text-lg text-[#94a3b8]">
              We analyze their work session, AI interactions, and debrief to
              surface how they frame problems, communicate, and make tradeoffs.
            </p>
            <Link
              href="/reports"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#a7dfff] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition hover:translate-y-[-2px] md:w-auto"
            >
              Open reports dashboard
            </Link>
            <div className="mt-8 grid gap-4">
              {[
                "Reasoning trails with decision pivots",
                "Collaboration markers and AI usage patterns",
                "Engineering maturity rubric with evidence",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#0f172a] px-4 py-3">
                  <p className="text-sm text-[#cbd5e1]">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">
                Candidate debrief
              </p>
              <h3 className="mt-4 text-2xl font-semibold">
                “I liked being able to work how I actually work.”
              </h3>
              <p className="mt-3 text-sm text-[#4b5563]">
                Candidates finish by explaining their solution and what they
                would do with more time. You learn how they communicate under
                pressure and how they partner with AI.
              </p>
            </div>
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-[#4b5563]">
                Results
              </p>
              <div className="mt-4 grid gap-4 text-sm text-[#4b5563]">
                <div className="flex items-center justify-between">
                  <span>Time to hire</span>
                  <span className="text-lg font-semibold text-[#0a0a0a]">-42%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Interview prep time</span>
                  <span className="text-lg font-semibold text-[#0a0a0a]">-60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Team confidence</span>
                  <span className="text-lg font-semibold text-[#0a0a0a]">+2.1x</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[32px] border border-[#e5e7eb] bg-[#f7fbff] px-8 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-[#4b5563]">
                Create in minutes
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Build a interview in three steps.
              </h2>
              <div className="mt-6 space-y-4 text-sm text-[#4b5563]">
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-[#a7dfff]/30 px-3 py-1 text-xs font-semibold">
                    01
                  </span>
                  <div>
                    <p className="font-semibold text-[#0a0a0a]">Choose the role</p>
                    <p>Frontend, backend, full-stack, data, ML, or platform.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-[#a7dfff]/30 px-3 py-1 text-xs font-semibold">
                    02
                  </span>
                  <div>
                    <p className="font-semibold text-[#0a0a0a]">Add candidate details</p>
                    <p>Invite your hiring panel and assign evaluation rubric.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-[#a7dfff]/30 px-3 py-1 text-xs font-semibold">
                    03
                  </span>
                  <div>
                    <p className="font-semibold text-[#0a0a0a]">Select interview mode</p>
                    <p>We generate a project with constraints.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#4b5563]">
                Hiring manager view
              </p>
              <div className="mt-5 space-y-3 text-sm text-[#4b5563]">
                <div className="rounded-2xl border border-[#e5e7eb] px-4 py-3">
                  Role: Senior Full-stack (TypeScript, React, Node)
                </div>
                <div className="rounded-2xl border border-[#e5e7eb] px-4 py-3">
                  Mode: Build & ship + AI pair
                </div>
                <div className="rounded-2xl border border-[#e5e7eb] px-4 py-3">
                  Panel: Eng manager, Staff eng, Product
                </div>
              </div>
              <a
                href="#create"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-center text-sm font-semibold text-[#ffffff] transition hover:translate-y-[-2px]"
              >
                Share interview link
              </a>
            </div>
          </div>
        </section>


        <section className="mt-20 rounded-[32px] border border-[#e5e7eb] bg-[#0a0a0a] px-8 py-14 text-[#ffffff]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-[#a7dfff]">
                Ready to hire smarter?
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Fewer hires. Faster hiring. Better teams.
              </h2>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e5e7eb] bg-[#ffffff]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-[#4b5563]">
          <p>© 2026 OneOrigin. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="transition hover:text-[#0a0a0a]" href="#">
              Privacy
            </a>
            <a className="transition hover:text-[#0a0a0a]" href="#">
              Terms
            </a>
            <a className="transition hover:text-[#0a0a0a]" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

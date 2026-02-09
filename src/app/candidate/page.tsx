"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Message = {
  id: string;
  sender: "candidate" | "ai" | "system";
  text: string;
  time: string;
};

type QAItem = {
  question: string;
  answer?: string;
};

type ProctoringEvent = {
  type: "tab_hidden" | "window_blur";
  time: string;
};

const SOLUTION_PROMPTS: Record<string, { title: string; hint: string }> = {
  build: {
    title: "Solution plan + implementation notes",
    hint: "Cover architecture, data model, key flows, tests, and deployment notes.",
  },
  debug: {
    title: "Root-cause analysis + fix plan",
    hint: "Describe how you would reproduce, confirm cause, fix, and harden reliability.",
  },
  design: {
    title: "System design proposal",
    hint: "Capture components, data flow, tradeoffs, and stakeholder alignment.",
  },
};

const TOTAL_FOLLOW_UPS = 3;
const DEFAULT_TIMEBOX_MINUTES = 90;
const ROUND_LABELS: Record<string, string> = {
  ice: "Ice Breaker",
  case: "Case Study",
  pm: "PM Discussion",
  code: "Coding + Copilot",
  present: "Presentation",
};

const STEP_ORDER = ["ice", "case", "pm", "code", "present"] as const;

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CandidateWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("t") ?? "";
  const [role, setRole] = useState(params.get("role") ?? "Full-stack Engineer");
  const [level, setLevel] = useState(params.get("level") ?? "Senior");
  const [name, setName] = useState(params.get("name") ?? "Candidate");
  const [mode, setMode] = useState(params.get("mode") ?? "build");
  const [linkLoading, setLinkLoading] = useState(Boolean(token));
  const [rounds, setRounds] = useState<string[]>([...STEP_ORDER]);
  const [roundIndex, setRoundIndex] = useState(0);

  const taskBrief = useMemo(() => {
    const roleLower = role.toLowerCase();
    const round = rounds[roundIndex] ?? "ice";
    const isIce = round === "ice";
    const isCase = round === "case";
    const isPm = round === "pm";
    const isCode = round === "code";
    if (isIce) {
      return "Share your background and what kinds of problems you enjoy solving. Also note how you typically collaborate with AI.";
    }
    if (mode === "debug") {
      if (roleLower.includes("ml")) {
        return isCase
          ? "Debug a model training job that intermittently fails due to data drift. Identify root cause, validate with logs, and propose fixes."
          : isPm
          ? "Describe a recent ML project you shipped end-to-end and the tradeoffs you made with stakeholders."
          : isCode
          ? "Outline a minimal diagnostic script or POC (with AI) to validate your hypothesis and confirm the regression."
          : "Present your findings, reliability hardening, and how you would communicate risk to PM/EM.";
      }
      if (roleLower.includes("data")) {
        return isCase
          ? "Investigate a pipeline latency regression after a schema change. Trace root cause, fix the job, and add reliability monitoring."
          : isPm
          ? "Walk through a data project that impacted business metrics. How did you align with stakeholders?"
          : isCode
          ? "Outline a minimal diagnostic query or POC (with AI) to validate the regression and confirm the fix."
          : "Present your findings, reliability safeguards, and the preventive actions you recommend.";
      }
      return isCase
        ? "Investigate a timeout regression in the payments pipeline. Identify root cause, propose fixes, and ship a safe patch with reliability safeguards and tests."
        : isPm
        ? "Describe a recent cross-functional project you led and how you managed scope while addressing reliability risks."
        : isCode
        ? "Outline a minimal fix plan or POC you would implement with AI assistance, including validation steps."
        : "Present your findings, reliability improvements, and how you would communicate impact.";
    }
    if (mode === "design") {
      if (roleLower.includes("ml")) {
        return isCase
          ? "Design an ML inference service that supports feature versioning, monitoring, and safe rollouts. Prepare a proposal for stakeholders."
          : isPm
          ? "Describe an ML project where requirements changed mid-flight. How did you re-align stakeholders and priorities?"
          : isCode
          ? "Sketch a POC plan (interfaces, metrics, rollout) and how you would align on it."
          : "Present your design tradeoffs and stakeholder alignment plan to AI PM/EM.";
      }
      if (roleLower.includes("data")) {
        return isCase
          ? "Design a data ingestion platform with schema evolution, data quality checks, and incremental backfills."
          : isPm
          ? "Describe a data project where product goals conflicted with data constraints. How did you align stakeholders?"
          : isCode
          ? "Outline a minimal POC plan with validation checks and alignment steps."
          : "Present your design decisions, stakeholder alignment, and risk mitigations.";
      }
      return isCase
        ? "Design a multi-tenant API gateway that supports rate limits, audit logs, and gradual rollouts. Prepare a proposal for stakeholders."
        : isPm
        ? "Describe a project where you aligned multiple teams on a shared roadmap and design decisions."
        : isCode
        ? "Outline a minimal POC plan with rollout strategy and alignment steps."
        : "Present your proposal, tradeoffs, and stakeholder alignment plan to AI PM/EM.";
    }
    if (roleLower.includes("ml")) {
      return isCase
        ? "Build a feature store pipeline with online/offline consistency, backfills, and monitoring. Ship with tests and deployment notes."
        : isPm
        ? "Describe a project where you partnered with PMs to define ML success metrics and deployment criteria."
        : isCode
        ? "Outline a POC build plan with AI assistance, validation steps, and deployment notes."
        : "Present your approach, deployment plan, and how you'd communicate risks.";
    }
    if (roleLower.includes("data")) {
      return isCase
        ? "Build a batch + streaming ETL workflow with data quality checks and lineage tracking. Ship with tests and deployment notes."
        : isPm
        ? "Explain how you scope data work when product asks for immediate insights and how you align on delivery."
        : isCode
        ? "Outline a POC build plan with AI assistance, validation steps, and deployment notes."
        : "Present your approach, deployment plan, and quality safeguards.";
    }
    return isCase
      ? "Build a feature flag dashboard for ops teams. Include role-based access, region toggles, and audit trails. Ship with tests and deployment notes."
      : isPm
      ? "Tell us about a project where you balanced stakeholder priorities and aligned on delivery."
      : isCode
      ? "Outline a POC build plan with AI assistance, validation steps, and deployment notes."
      : "Present your approach, deployment plan, and how you would align stakeholders.";
  }, [mode, role, rounds, roundIndex]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "sys-1",
      sender: "system",
      text: `Welcome ${name}. This interview simulates real work. Use AI freely and explain your decisions.`,
      time: nowLabel(),
    },
    {
      id: "ai-1",
      sender: "ai",
      text: "Share your response in this chat (plan, reasoning, or answers). You can also ask questions here.",
      time: nowLabel(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);
  const [proctoringWarning, setProctoringWarning] = useState<string | null>(null);
  const [qaByRound, setQaByRound] = useState<Record<string, QAItem[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [solutionByRound, setSolutionByRound] = useState<Record<string, string>>(
    {}
  );
  const [candidateMsgsByRound, setCandidateMsgsByRound] = useState<Record<string, number>>(
    {}
  );
  const [aiInjectedByRound, setAiInjectedByRound] = useState<Record<string, boolean>>(
    {}
  );
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMEBOX_MINUTES * 60);
  const [timerRunning] = useState(true);
  const [showTranscript] = useState(false);

  const totalQuestions = TOTAL_FOLLOW_UPS;
  const currentRound = rounds[roundIndex] ?? "ice";
  const qaItems = qaByRound[currentRound] ?? [];
  const solution = solutionByRound[currentRound] ?? "";
  const answeredCount = qaItems.filter((item) => item.answer?.trim()).length;
  const askedCount = qaItems.length;
  const currentSolutionComplete = solution.trim().length >= 50;
  const stepsRequiringSolution = ["case", "code", "present"];
  const stepsRequiringChat = ["ice", "pm"];
  const currentChatCount = candidateMsgsByRound[currentRound] ?? 0;
  const currentStepComplete = stepsRequiringSolution.includes(currentRound)
    ? currentSolutionComplete
    : stepsRequiringChat.includes(currentRound)
    ? currentChatCount > 0
    : true;
  const completedRounds = rounds.filter((round) => {
    if (stepsRequiringSolution.includes(round)) {
      return (solutionByRound[round] ?? "").trim().length >= 50;
    }
    if (stepsRequiringChat.includes(round)) {
      return (candidateMsgsByRound[round] ?? 0) > 0;
    }
    return true;
  }).length;
  const allRoundsComplete = rounds.every((round) => {
    if (!stepsRequiringSolution.includes(round)) return true;
    return (solutionByRound[round] ?? "").trim().length >= 50;
  });
  const isLastRound = roundIndex === rounds.length - 1;
  const canSubmit =
    Boolean(token) &&
    (isLastRound ? allRoundsComplete && currentStepComplete : currentStepComplete);
  const submitHint = stepsRequiringSolution.includes(currentRound)
    ? !currentSolutionComplete
      ? "Add a fuller solution (50+ chars) to complete this step."
      : isLastRound && !allRoundsComplete
      ? "Complete all required steps to enable final submission."
      : "Ready to continue."
    : stepsRequiringChat.includes(currentRound) && currentChatCount === 0
    ? "Send at least one message in this step to continue."
    : isLastRound && !allRoundsComplete
    ? "Complete all required steps to enable final submission."
    : "Ready to continue.";

  useEffect(() => {
    setQaByRound({});
    setSolutionByRound({});
    setRoundIndex(0);
    setCandidateMsgsByRound({});
    setAiInjectedByRound({});
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let lastEventAt = 0;
    const recordEvent = (type: ProctoringEvent["type"]) => {
      const now = Date.now();
      if (now - lastEventAt < 1000) return;
      lastEventAt = now;
      setTabSwitches((prev) => {
        const next = prev + 1;
        setProctoringWarning(
          `Warning: leaving this tab is recorded. Tab switches: ${next}.`
        );
        return next;
      });
      setProctoringEvents((prev) => [...prev, { type, time: nowLabel() }]);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        recordEvent("tab_hidden");
      }
    };
    const handleBlur = () => {
      if (document.visibilityState === "visible") {
        recordEvent("window_blur");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (mode === "build") {
      setTimerSeconds(2 * 60 * 60);
      return;
    }
    if (mode === "debug") {
      setTimerSeconds(90 * 60);
      return;
    }
    setTimerSeconds(60 * 60);
  }, [mode]);

  useEffect(() => {
    if (!token) {
      setError("Invalid interview link.");
      setLinkLoading(false);
      return;
    }
    if (typeof window !== "undefined") {
      const submitted = window.localStorage.getItem(`oo_submitted_${token}`);
      if (submitted) {
        router.replace("/candidate/thanks");
        return;
      }
    }
    async function loadLink() {
      try {
        const response = await fetch(`/api/links/${token}`);
        const data = (await response.json()) as {
          error?: string;
          candidate: string;
          role: string;
          level: string;
          mode: string;
          rounds: string[];
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Invalid interview link.");
        }
        setName(data.candidate);
        setRole(data.role);
        setLevel(data.level);
        setMode(data.mode);
        setRounds(data.rounds?.length ? data.rounds : [...STEP_ORDER]);
        setRoundIndex(0);
        setQaByRound({});
        setSolutionByRound({});
        setCandidateMsgsByRound({});
        setAiInjectedByRound({});
        setLinkLoading(false);
      } catch {
        setError("Invalid or expired interview link.");
        setLinkLoading(false);
      }
    }
    loadLink();
  }, [token, router]);

  if (linkLoading) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
        <main className="mx-auto flex w-full max-w-3xl items-center justify-center px-6 py-24">
          <div className="rounded-[32px] border border-[#e5e7eb] bg-[#f7fbff] px-8 py-10 text-sm text-[#4b5563] shadow-[var(--shadow)]">
            Loading interview workspace…
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
        <main className="mx-auto flex w-full max-w-3xl items-center justify-center px-6 py-24">
          <div className="rounded-[32px] border border-[#e5e7eb] bg-[#f7fbff] px-8 py-10 text-sm text-[#0a0a0a] shadow-[var(--shadow)]">
            {error}
          </div>
        </main>
      </div>
    );
  }

  function pushMessage(sender: Message["sender"], text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `${sender}-${Date.now()}`, sender, text, time: nowLabel() },
    ]);
  }

  function addFollowUp(question: string) {
    const cleaned = question.trim();
    if (!cleaned) return;
    pushMessage("ai", `Follow-up: ${cleaned}`);
    setQaByRound((prev) => ({
      ...prev,
      [currentRound]: [...(prev[currentRound] ?? []), { question: cleaned }],
    }));
  }

  function assignAnswer(answer: string) {
    setQaByRound((prev) => {
      const updated = [...(prev[currentRound] ?? [])];
      const nextIndex = updated.findIndex((item) => !item.answer);
      if (nextIndex >= 0) {
        updated[nextIndex] = { ...updated[nextIndex], answer };
      }
      return { ...prev, [currentRound]: updated };
    });
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const userText = input.trim();
    if (!userText) return;
    pushMessage("candidate", userText);
    setCandidateMsgsByRound((prev) => ({
      ...prev,
      [currentRound]: (prev[currentRound] ?? 0) + 1,
    }));
    const hadPending = qaItems.some((item) => !item.answer);
    if (hadPending) {
      assignAnswer(userText);
    }
    setError(null);
    setInput("");
    setTyping(true);
    try {
      const isSubstantive = userText.replace(/\s+/g, " ").trim().length >= 60;
      const nextAskedCount = qaItems.length;
      const nextAnsweredCount = hadPending ? answeredCount + 1 : answeredCount;
      const needFollowUp =
        isSubstantive &&
        nextAskedCount < totalQuestions && nextAskedCount === nextAnsweredCount;
      const shouldInject =
        ["case", "code"].includes(currentRound) && !aiInjectedByRound[currentRound];
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat({
              id: "pending",
              sender: "candidate",
              text: userText,
              time: nowLabel(),
            })
            .map((message) => ({
              role:
                message.sender === "candidate"
                  ? "user"
                  : message.sender === "ai"
                  ? "assistant"
                  : "system",
              content: message.text,
            })),
          context: {
            role,
            level,
            mode,
            round: currentRound,
            taskBrief,
            followUpCount: nextAskedCount,
            totalFollowUps: totalQuestions,
            needFollowUp,
            injectSubtleFlaw: shouldInject,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to reach the AI teammate.");
      }
      const data = (await response.json()) as { text?: string; followUp?: string };
      const replyText = data.text?.trim() || "I'm ready when you are.";
      const mainClean = replyText.trim();
      if (mainClean) {
        pushMessage("ai", mainClean);
      }
      if (data.followUp) {
        addFollowUp(data.followUp);
      }
      if (shouldInject) {
        setAiInjectedByRound((prev) => ({ ...prev, [currentRound]: true }));
      }
    } catch {
      setError("AI teammate is unavailable. Try again in a moment.");
    } finally {
      setTyping(false);
    }
  }

  function handleStepAdvance() {
    if (!canSubmit || submitting) return;
    if (!isLastRound) {
      setRoundIndex((prev) => Math.min(prev + 1, rounds.length - 1));
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    if (!isLastRound) {
      setRoundIndex((prev) => Math.min(prev + 1, rounds.length - 1));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const solutionPayload = rounds
        .map(
          (round) =>
            `${ROUND_LABELS[round] ?? round}\n${solutionByRound[round] ?? ""}`
        )
        .join("\n\n");
      const qaFlattened = rounds.flatMap((round) => {
        const items = qaByRound[round] ?? [];
        return items.map((item) => ({
          question: `${ROUND_LABELS[round] ?? round}: ${item.question}`,
          answer: item.answer ?? "",
        }));
      });
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate: name,
          role,
          level,
          mode,
          solution: solutionPayload,
          questions: qaFlattened.map((item) => item.question),
          answers: qaFlattened.map((item) => item.answer),
          linkToken: token,
          transcript: messages.map((message) => ({
            sender: message.sender,
            text: message.text,
          })),
          proctoring: {
            tabSwitches,
            events: proctoringEvents,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit interview.");
      }
      await response.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`oo_submitted_${token}`, "true");
      }
      router.replace("/candidate/thanks");
    } catch {
      setError("Unable to submit for review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatTimer(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ].filter(Boolean);
    return parts.join(":");
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
            OneOrigin Workspace
          </p>
          <h1 className="text-2xl font-semibold">Candidate Session</h1>
          <p className="mt-1 text-xs text-[#4b5563]">
            {ROUND_LABELS[currentRound] ?? "Interview Round"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[#0a0a0a] px-4 py-2 text-xs font-semibold">
            Time left {formatTimer(timerSeconds)}
          </div>
          <div className="rounded-full border border-[#0a0a0a] px-4 py-2 text-xs font-semibold">
            Live · AI teammate enabled
          </div>
          <div className="rounded-full bg-[#0a0a0a] px-4 py-2 text-xs font-semibold text-[#ffffff]">
            Progress {completedRounds}/{rounds.length}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-[#e5e7eb] bg-white p-6 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                Task brief
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{taskBrief}</h2>
              <p className="mt-3 text-sm text-[#4b5563]">
                Role: {level} {role} · Mode: {mode}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f7fbff] px-4 py-3 text-xs text-[#4b5563]">
              Timebox: {mode === "build" ? "2 hours" : mode === "debug" ? "90 minutes" : "60 minutes"}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#e5e7eb] bg-[#ffffff] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
              Round checklist
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#4b5563]">
              <li>Clarify requirements for this round.</li>
              <li>Explain tradeoffs and document assumptions.</li>
              <li>Show your reasoning steps and debugging approach.</li>
              <li>Describe how you used AI (prompts, validations, or iterations).</li>
              <li>Provide a concise round-specific response.</li>
            </ul>
            {stepsRequiringChat.includes(currentRound) && (
              <p className="mt-3 text-xs text-[#4b5563]">
                For this round, submit your response in the chat.
              </p>
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#475569]">
            Proctoring notice: leaving this tab or app window is recorded and shown in the report.
          </div>
          {proctoringWarning && (
            <div className="mt-4 rounded-2xl border border-[#facc15] bg-[#fef9c3] px-4 py-3 text-xs text-[#854d0e]">
              {proctoringWarning}
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
              Collaboration space
            </p>
            <div className="mt-3 flex min-h-[320px] flex-col gap-3 rounded-3xl border border-[#e5e7eb] bg-white p-4">
              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                      message.sender === "candidate"
                        ? "ml-auto bg-[#0a0a0a] text-[#ffffff]"
                        : message.sender === "ai"
                        ? "bg-[#f7fbff] text-[#0a0a0a]"
                        : "bg-[#a7dfff]/30 text-[#0a0a0a]"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[#4b5563]">
                      {message.sender}
                    </p>
                    <p className="mt-1">{message.text}</p>
                    <p className="mt-2 text-xs text-[#4b5563]">{message.time}</p>
                  </div>
                ))}
                {typing && (
                  <div className="max-w-[70%] rounded-2xl bg-[#f7fbff] px-4 py-3 text-sm text-[#4b5563]">
                    AI teammate is typing…
                  </div>
                )}
                {error && (
                  <div className="max-w-[70%] rounded-2xl bg-[#a7dfff]/30 px-4 py-3 text-sm text-[#0a0a0a]">
                    {error}
                  </div>
                )}
              </div>
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="flex-1 rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                  placeholder="Ask for help or share your plan…"
                />
                <button
                  type="submit"
                  disabled={typing}
                  className="rounded-2xl bg-[#3ab8ff] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {showTranscript && (
            <div className="rounded-[28px] border border-[#e5e7eb] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                Transcript
              </p>
              <div className="mt-3 max-h-[220px] space-y-3 overflow-y-auto text-xs text-[#4b5563]">
                {messages.map((message) => (
                  <div key={message.id}>
                    <span className="font-semibold uppercase tracking-[0.2em]">
                      {message.sender}
                    </span>{" "}
                    — {message.text}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-[28px] border border-[#e5e7eb] bg-[#0a0a0a] p-6 text-[#ffffff]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#a7dfff]">
              Follow-up sequence
            </p>
            <h3 className="mt-3 text-xl font-semibold">
              AI teammate follow-ups
            </h3>
            <p className="mt-2 text-sm text-[#94a3b8]">
              We ask 3 targeted questions to probe reasoning and tradeoffs.
            </p>
            <div className="mt-4 rounded-2xl bg-[#0f172a] px-4 py-3 text-sm text-[#cbd5e1]">
              Next question:
              <span className="mt-2 block text-[#a7dfff]">
                {qaItems.find((item) => !item.answer)?.question ??
                  (askedCount >= totalQuestions
                    ? "All follow-ups delivered."
                    : "Awaiting next follow-up.")}
              </span>
            </div>
            <div className="mt-4 text-xs text-[#94a3b8]">
              Follow-ups: {Math.min(askedCount, totalQuestions)}/{totalQuestions} · Answered:{" "}
              {Math.min(answeredCount, totalQuestions)}/{totalQuestions}
            </div>
          </div>
          {["case", "code", "present"].includes(currentRound) && (
            <div className="rounded-[28px] border border-[#e5e7eb] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                Solution panel
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[#0a0a0a]">
                {SOLUTION_PROMPTS[mode]?.title ?? "Solution notes"}
              </h3>
              <p className="mt-2 text-sm text-[#4b5563]">
                {SOLUTION_PROMPTS[mode]?.hint ?? "Capture your solution clearly."}
              </p>
              <textarea
                value={solution}
                onChange={(event) =>
                  setSolutionByRound((prev) => ({
                    ...prev,
                    [currentRound]: event.target.value,
                  }))
                }
                className="mt-4 min-h-[160px] w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm"
                placeholder="Write your response here. Include reasoning steps, assumptions, and how you used AI."
              />
              <p className="mt-2 text-xs text-[#4b5563]">
                {solution.trim().length}/50+ characters
              </p>
            </div>
          )}
          <div className="rounded-[28px] border border-[#e5e7eb] bg-white p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
              Submission checklist
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[#4b5563]">
              <li>✔ Document assumptions and open questions</li>
              <li>✔ Share code or design notes</li>
              <li>✔ Record a 3–5 minute walkthrough</li>
            </ul>
            <p className="mt-4 text-xs text-[#4b5563]">{submitHint}</p>
            <button
              onClick={handleStepAdvance}
              disabled={!canSubmit || submitting}
              className="mt-6 w-full rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-[#ffffff] disabled:opacity-50"
            >
              {submitting
                ? "Submitting…"
                : isLastRound
                ? "Submit for review"
                : "Complete step & continue"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Score = {
  label: string;
  score: number;
  note: string;
};

type Report = {
  id: string;
  candidate: string;
  role: string;
  mode: string;
  status: "complete" | "in-review";
  summary: string;
  overall: number;
  scores: Score[];
  notes: string[];
  highlights: string[];
  createdAt?: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const [activeId, setActiveId] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [query, setQuery] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("/api/reports");
        if (!response.ok) {
          throw new Error("Failed to load reports.");
        }
        const data = (await response.json()) as { reports: Report[] };
        setReports(data.reports ?? []);
        const nextActive = reportId ?? data.reports?.[0]?.id ?? "";
        setActiveId(nextActive);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [reportId]);

  const active = useMemo(
    () => reports.find((report) => report.id === activeId) ?? reports[0],
    [activeId, reports]
  );

  async function handleAddNote() {
    if (!active || !noteInput.trim()) return;
    setSavingNote(true);
    setNoteError(null);
    try {
      const response = await fetch(`/api/reports/${active.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteInput.trim() }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save note.");
      }
      const data = (await response.json()) as { notes: string[] };
      setReports((prev) =>
        prev.map((report) =>
          report.id === active.id ? { ...report, notes: data.notes } : report
        )
      );
      setNoteInput("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  }

  function handleExport() {
    if (!active) return;
    const payload = {
      candidate: active.candidate,
      role: active.role,
      mode: active.mode,
      summary: active.summary,
      overall: active.overall,
      scores: active.scores,
      notes: active.notes,
      highlights: active.highlights,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.candidate.replace(/\s+/g, "_")}_report.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExportPdf() {
    if (!active) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const margin = 14;
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Candidate Report: ${active.candidate}`, margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Role: ${active.role}`, margin, y);
    y += 6;
    doc.text(`Mode: ${active.mode}`, margin, y);
    y += 6;
    doc.text(`Overall Score: ${active.overall}`, margin, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(active.summary, 180);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 6 + 2;

    doc.setFont("helvetica", "bold");
    doc.text("Score Breakdown", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    active.scores.forEach((score) => {
      const line = `${score.label}: ${score.score} — ${score.note}`;
      const lines = doc.splitTextToSize(line, 180);
      doc.text(lines, margin, y);
      y += lines.length * 6;
    });
    y += 2;

    doc.setFont("helvetica", "bold");
    doc.text("Highlights", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    active.highlights.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, 180);
      doc.text(lines, margin, y);
      y += lines.length * 6;
    });
    y += 2;

    doc.setFont("helvetica", "bold");
    doc.text("Reviewer Notes", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    if (active.notes.length === 0) {
      doc.text("No notes yet.", margin, y);
    } else {
      active.notes.forEach((note) => {
        const lines = doc.splitTextToSize(`• ${note}`, 180);
        doc.text(lines, margin, y);
        y += lines.length * 6;
      });
    }

    doc.save(`${active.candidate.replace(/\s+/g, "_")}_report.pdf`);
  }

  const roles = useMemo(() => {
    const unique = new Set(reports.map((report) => report.role));
    return ["all", ...Array.from(unique)];
  }, [reports]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredReports = reports.filter((report) => {
      const matchesRole = roleFilter === "all" || report.role === roleFilter;
      const matchesQuery =
        !normalizedQuery ||
        report.candidate.toLowerCase().includes(normalizedQuery) ||
        report.role.toLowerCase().includes(normalizedQuery) ||
        report.mode.toLowerCase().includes(normalizedQuery);
      return matchesRole && matchesQuery;
    });
    return filteredReports.sort((a, b) => {
      const aDate = new Date(a.createdAt ?? 0).getTime();
      const bDate = new Date(b.createdAt ?? 0).getTime();
      return sortOrder === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [reports, roleFilter, query, sortOrder]);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
            OneOrigin Reports
          </p>
          <h1 className="text-3xl font-semibold">Candidate Scorecards</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="rounded-full border border-[#0a0a0a] px-4 py-2 text-xs font-semibold"
          >
            Back to home
          </a>
          <div className="rounded-full border border-[#0a0a0a] px-4 py-2 text-xs font-semibold">
            Live reports · {reports.length} candidates
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="rounded-[24px] border border-[#e5e7eb] bg-[#f7fbff] px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4b5563]">
              Role
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="mt-2 block rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === "all" ? "All roles" : role}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4b5563]">
              Sort
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "newest" | "oldest")
                }
                className="mt-2 block rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <label className="flex-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#4b5563]">
              Search
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-2 text-sm"
                placeholder="Search candidate, role, or mode"
              />
            </label>
          </div>
        </div>
      </section>

      <main className="mx-auto mt-6 grid w-full max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2">
          {loading && (
            <div className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] px-5 py-4 text-sm text-[#4b5563]">
              Loading reports…
            </div>
          )}
          {!loading && reports.length === 0 && (
            <div className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] px-5 py-4 text-sm text-[#4b5563]">
              No reports yet. Submit a candidate interview to see a scorecard.
            </div>
          )}
          {filtered.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveId(report.id)}
              className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                active?.id === report.id
                  ? "border-[#0a0a0a] bg-white shadow-[var(--shadow)]"
                  : "border-[#e5e7eb] bg-[#f7fbff]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{report.candidate}</p>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.3em] ${
                    report.status === "complete"
                      ? "bg-[#0a0a0a] text-[#ffffff]"
                      : "bg-[#a7dfff]/30 text-[#0a0a0a]"
                  }`}
                >
                  {report.status === "complete" ? "Complete" : "In review"}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#4b5563]">
                {report.role} · {report.mode}
              </p>
              {report.createdAt && (
                <p className="mt-1 text-xs text-[#4b5563]">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              )}
              <p className="mt-3 text-xs text-[#4b5563]">{report.summary}</p>
            </button>
          ))}
        </aside>

        {active && (
          <section className="min-w-0 rounded-[32px] border border-[#e5e7eb] bg-white p-6 shadow-[var(--shadow)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                  Scorecard
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {active.candidate}
                </h2>
                <p className="mt-2 text-sm text-[#4b5563]">
                  {active.role} · {active.mode}
                </p>
              </div>
              <div className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                  Overall score
                </p>
                <p className="mt-2 text-4xl font-semibold">{active.overall}</p>
                <p className="text-xs text-[#4b5563]">Out of 100</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {active.scores.map((score) => (
                <div
                  key={score.label}
                  className="rounded-3xl border border-[#e5e7eb] bg-[#ffffff] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{score.label}</p>
                    <span className="text-lg font-semibold">{score.score}</span>
                  </div>
                  <p className="mt-3 text-xs text-[#4b5563]">{score.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-[#e5e7eb] bg-[#0a0a0a] p-5 text-[#ffffff]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#a7dfff]">
                  Highlights
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[#cbd5e1]">
                  {active.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                  Reviewer notes
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[#4b5563]">
                  {active.notes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="cursor-pointer rounded-full border border-[#0a0a0a] px-6 py-3 text-sm font-semibold transition hover:bg-[#0a0a0a] hover:text-[#ffffff]"
              >
                Export JSON
              </button>
              <button
                onClick={handleExportPdf}
                className="cursor-pointer rounded-full border border-[#0a0a0a] px-6 py-3 text-sm font-semibold transition hover:bg-[#0a0a0a] hover:text-[#ffffff]"
              >
                Export PDF
              </button>
            </div>

            <div className="mt-6 rounded-3xl border border-[#e5e7eb] bg-[#f7fbff] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4b5563]">
                Add reviewer note
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                  className="flex-1 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm"
                  placeholder="Add a short note for the hiring team…"
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteInput.trim()}
                  className="rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingNote ? "Saving…" : "Save note"}
                </button>
              </div>
              {noteError && (
                <div className="mt-3 rounded-2xl bg-[#a7dfff] px-4 py-3 text-sm text-[#0a0a0a]">
                  {noteError}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

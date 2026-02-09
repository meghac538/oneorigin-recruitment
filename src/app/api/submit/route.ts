import OpenAI from "openai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SubmissionPayload = {
  candidate: string;
  role: string;
  level: string;
  mode: string;
  solution: string;
  questions: string[];
  answers: string[];
  linkToken?: string;
  transcript?: Array<{ sender: string; text: string }>;
  proctoring?: {
    tabSwitches: number;
    events: Array<{ type: string; time: string }>;
  };
};

type Evaluation = {
  overall: number;
  summary: string;
  scores: Array<{ label: string; score: number; note: string }>;
  notes: string[];
  highlights: string[];
  status: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fallbackEvaluation(payload: SubmissionPayload): Evaluation {
  const avgLength =
    payload.answers.reduce((sum, answer) => sum + answer.length, 0) /
    Math.max(payload.answers.length, 1);
  const depthScore = clampScore(60 + Math.min(avgLength / 6, 30));
  return {
    overall: clampScore((depthScore + 80) / 2),
    summary:
      "Auto-evaluated response set. Review for reasoning depth and tradeoffs.",
    scores: [
      {
        label: "Reasoning depth",
        score: clampScore(depthScore - 4),
        note: "Look for clarity on reasoning steps and assumptions.",
      },
      {
        label: "Debugging approach",
        score: clampScore(depthScore - 2),
        note: "Check whether they outline diagnostics and validation.",
      },
      {
        label: "AI collaboration",
        score: clampScore(depthScore - 6),
        note: "Assess how AI was used to refine reasoning and checks.",
      },
      {
        label: "Communication",
        score: clampScore(depthScore - 8),
        note: "Evaluate how clearly tradeoffs and decisions are explained.",
      },
    ],
    notes: ["Fallback evaluation used due to AI unavailability."],
    highlights: [
      `${payload.answers.length} follow-up responses captured`,
    ],
    status: "complete",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmissionPayload;
    const {
      candidate,
      role,
      level,
      mode,
      solution,
      questions,
      answers,
      linkToken,
      transcript,
      proctoring,
    } = body;

    if (!candidate || !role || !level || !mode || !solution) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!linkToken) {
      return NextResponse.json(
        { error: "Missing interview link." },
        { status: 400 }
      );
    }

    const link = await prisma.interviewLink.findUnique({
      where: { token: linkToken },
      include: { submissions: true },
    });
    if (!link) {
      return NextResponse.json(
        { error: "Invalid interview link." },
        { status: 400 }
      );
    }
    if (!link.isActive) {
      return NextResponse.json({ error: "Link is inactive." }, { status: 403 });
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link expired." }, { status: 403 });
    }
    if (link.submissions.length >= link.maxSubmissions) {
      return NextResponse.json({ error: "Link already used." }, { status: 403 });
    }

    const submission = await prisma.interviewSubmission.create({
      data: {
        candidate,
        role,
        level,
        mode,
        solution,
        questions,
        answers,
        linkId: link.id,
      },
    });

    let evaluation: Evaluation | null = null;

    const proctoringSummary = `Proctoring: ${proctoring?.tabSwitches ?? 0} tab/window switches.`;

    if (process.env.OPENAI_API_KEY) {
      const prompt = [
        "You are an engineering interview evaluator focused on reasoning and AI collaboration.",
        "Score how the candidate reasons, debugs, and collaborates with AI—not code correctness alone.",
        "Return JSON only with keys: overall, summary, scores, notes, highlights, status.",
        "overall: 0-100 integer.",
        "scores: 4 objects with label, score(0-100), note.",
        "Use these labels: Reasoning depth, Debugging approach, AI collaboration, Communication.",
        "notes: array of 2-4 short bullets that cite evidence from responses.",
        "highlights: array of 2-4 short bullets highlighting strong behaviors.",
        `Role: ${level} ${role}`,
        `Mode: ${mode}`,
        proctoringSummary,
        "Candidate solution:",
        solution,
        "Transcript (candidate + AI):",
        (transcript ?? [])
          .map((item) => `${item.sender}: ${item.text}`)
          .join("\n"),
        "Questions and answers:",
        questions
          .map((question, index) => `Q${index + 1}: ${question}\nA${index + 1}: ${answers[index] ?? ""}`)
          .join("\n\n"),
      ].join("\n");

      try {
        const response = await client.responses.create({
          model: process.env.OPENAI_MODEL ?? "gpt-5",
          input: prompt,
        });
        const text = response.output_text ?? "";
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Evaluation;
          evaluation = {
            overall: clampScore(parsed.overall),
            summary: parsed.summary ?? "",
            scores: Array.isArray(parsed.scores) ? parsed.scores : [],
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
            status: parsed.status ?? "complete",
          };
        }
      } catch {
        evaluation = null;
      }
    }

    if (!evaluation) {
      evaluation = fallbackEvaluation(body);
    }

    const proctoringNote =
      proctoring?.tabSwitches && proctoring.tabSwitches > 0
        ? `Proctoring: ${proctoring.tabSwitches} tab/window switches detected.`
        : "Proctoring: No tab/window switches detected.";

    const report = await prisma.report.create({
      data: {
        submissionId: submission.id,
        overall: evaluation.overall,
        summary: evaluation.summary,
        scores: evaluation.scores,
        notes: [...evaluation.notes, proctoringNote],
        highlights: evaluation.highlights,
        status: evaluation.status,
      },
    });

    if (link.submissions.length + 1 >= link.maxSubmissions) {
      await prisma.interviewLink.update({
        where: { id: link.id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ reportId: report.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit interview." },
      { status: 500 }
    );
  }
}

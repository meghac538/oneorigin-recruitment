import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
  context?: {
    role?: string;
    level?: string;
    mode?: string;
    taskBrief?: string;
    round?: string;
    followUpCount?: number;
    totalFollowUps?: number;
    needFollowUp?: boolean;
    injectSubtleFlaw?: boolean;
  };
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ChatRequest;
    const { messages, context } = body;

    const systemPrompt = [
      "You are an AI assistant in a real-world engineering interview workspace.",
      "Primary goal: assess reasoning, AI prompting, and collaboration—not code output.",
      "Never provide a full solution, final answer, or end-to-end implementation.",
      "Instead: ask clarifying questions, surface ambiguities, propose tradeoffs, and suggest what to validate.",
      "Encourage the candidate to explain reasoning, debugging steps, and how they use AI.",
      "Probe how they would prompt, verify, and iterate with AI.",
      "Only assist when the candidate explicitly asks for help; otherwise, ask a clarifying question or request their plan.",
      "If asked directly for a solution, refuse briefly and redirect with reasoning prompts and a small hint.",
      "Keep the discussion anchored to the task scope and role expectations; tailor depth to level.",
      "If the candidate is off-topic, acknowledge briefly and steer back.",
      "Only ask a follow-up after the candidate provides a substantive response (not a greeting).",
      "Avoid multi-part follow-ups in the ice breaker; keep them concise and directly tied to what the candidate shared.",
      "When generating a follow-up question, it must be specific to the role and task.",
      "Avoid generic questions; mention role-relevant concerns (data pipelines, infra, UX, reliability, etc.).",
      "Keep replies concise and question-forward (3–6 sentences).",
      `Role: ${context?.level ?? ""} ${context?.role ?? ""}`.trim(),
      context?.round ? `Round: ${context.round}` : "",
      context?.mode ? `Mode: ${context.mode}` : "",
      context?.taskBrief ? `Task: ${context.taskBrief}` : "",
      context?.needFollowUp
        ? `Ask exactly one follow-up question focused on reasoning/debugging/AI collaboration. This is follow-up #${(context.followUpCount ?? 0) + 1} of ${context.totalFollowUps ?? 3}.`
        : "Do not add follow-up questions unless explicitly asked.",
      context?.injectSubtleFlaw
        ? "Include one subtle but plausible flawed assumption in your reply. Do not label it as wrong."
        : "",
      "Return JSON only with keys: reply, followUp.",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5",
      input: [{ role: "system", content: systemPrompt }, ...(messages ?? [])],
    });

    const text = response.output_text ?? "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
        reply?: string;
        followUp?: string;
      };
      return NextResponse.json({
        text: parsed.reply ?? "",
        followUp: parsed.followUp?.trim() || undefined,
      });
    }

    return NextResponse.json({ text: text ?? "" });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}

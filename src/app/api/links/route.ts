import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    role?: string;
    level?: string;
    mode?: string;
    candidateName?: string;
    candidateEmail?: string;
  };

  if (
    !body.role ||
    !body.level ||
    !body.mode ||
    !body.candidateName ||
    !body.candidateEmail
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const rounds = ["ice", "case", "pm", "code", "present"];

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const link = await prisma.interviewLink.create({
    data: {
      token,
      userId: user.id,
      role: body.role,
      level: body.level,
      mode: body.mode,
      candidateName: body.candidateName,
      candidateEmail: body.candidateEmail,
      rounds,
      expiresAt,
      isActive: true,
      maxSubmissions: 1,
    },
  });

  return NextResponse.json({ token: link.token });
}

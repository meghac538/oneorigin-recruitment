import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const resolved = await params;
  const token = resolved?.token?.toString();
  if (!token) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  const link = await prisma.interviewLink.findUnique({
    where: { token },
    include: { submissions: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
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

  return NextResponse.json({
    candidate: link.candidateName,
    role: link.role,
    level: link.level,
    mode: link.mode,
    rounds: Array.isArray(link.rounds) ? link.rounds : [],
  });
}

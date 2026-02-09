import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await (await import("@/lib/auth")).getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const reports = await prisma.report.findMany({
      include: {
        submission: {
          include: { link: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const payload = reports
      .filter((report) => report.submission.link?.userId === user.id)
      .map((report) => ({
      id: report.id,
      candidate: report.submission.candidate,
      role: `${report.submission.level} ${report.submission.role}`,
      mode: report.submission.mode,
      status: report.status,
      summary: report.summary,
      overall: report.overall,
      scores: Array.isArray(report.scores) ? report.scores : [],
      notes: Array.isArray(report.notes) ? report.notes : [],
      highlights: Array.isArray(report.highlights) ? report.highlights : [],
      createdAt: report.createdAt,
    }));

    return NextResponse.json({ reports: payload });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reports." },
      { status: 500 }
    );
  }
}

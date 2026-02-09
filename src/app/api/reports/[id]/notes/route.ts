import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { note?: string };
  const note = body.note?.trim();
  if (!note) {
    return NextResponse.json({ error: "Note is required." }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: { submission: { include: { link: true } } },
  });
  if (!report || report.submission.link?.userId !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const existingNotes = Array.isArray(report.notes) ? report.notes : [];
  const updatedNotes = [note, ...existingNotes];
  const updated = await prisma.report.update({
    where: { id },
    data: { notes: updatedNotes },
  });

  return NextResponse.json({
    notes: Array.isArray(updated.notes) ? updated.notes : [],
  });
}

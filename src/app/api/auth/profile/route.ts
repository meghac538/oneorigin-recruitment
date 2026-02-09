import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
  };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}

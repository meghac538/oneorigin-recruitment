import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      company?: string;
    };
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Account already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: body.name?.trim() || null,
        company: body.company?.trim() || null,
      },
    });

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const token = crypto.randomUUID();
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to register." },
      { status: 500 }
    );
  }
}

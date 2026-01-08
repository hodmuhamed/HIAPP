import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import {
  getSessionCookieName,
  getSessionCookieOptions,
  signSessionToken,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  try {
    const token = await signSessionToken({
      sub: user.id,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Failed to sign session token", error);
    return NextResponse.json(
      { error: "Authentication unavailable." },
      { status: 500 },
    );
  }
}

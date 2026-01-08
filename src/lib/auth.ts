import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import prisma from "./db";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "TEAM_LEAD" | "WORKER";
};

const DEFAULT_COOKIE_NAME = "humperia_session";

const getCookieName = () => process.env.COOKIE_NAME ?? DEFAULT_COOKIE_NAME;

const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
};

export const signSessionToken = async (payload: {
  sub: string;
  role: SessionUser["role"];
  fullName: string;
}): Promise<string> => {
  return new SignJWT({ role: payload.role, fullName: payload.fullName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCookieName())?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.sub;
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  } catch {
    return null;
  }
};

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

export const getSessionCookieName = () => getCookieName();

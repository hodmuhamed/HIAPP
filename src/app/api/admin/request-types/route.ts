import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const requestTypeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  visibilityPolicy: z.enum([
    "ADMIN_ONLY",
    "DIRECT_PARTICIPANTS",
    "ADMIN_AND_HANDLERS",
    "TEAM_PUBLIC",
  ]),
  requiresRecipient: z.boolean().default(false),
  requiresAssignment: z.boolean().default(false),
});

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const types = await prisma.requestType.findMany({
    include: {
      assignees: {
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const slug = toSlug(parsed.data.slug) || toSlug(parsed.data.name);

  const slugExists = await prisma.requestType.findUnique({ where: { slug } });
  if (slugExists) {
    return NextResponse.json({ error: "Slug already in use." }, { status: 400 });
  }

  const created = await prisma.requestType.create({
    data: {
      name: parsed.data.name,
      slug,
      visibilityPolicy: parsed.data.visibilityPolicy,
      requiresRecipient: parsed.data.requiresRecipient,
      requiresAssignment: parsed.data.requiresAssignment,
    },
    include: {
      assignees: {
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
      },
    },
  });

  return NextResponse.json(created, { status: 201 });
}

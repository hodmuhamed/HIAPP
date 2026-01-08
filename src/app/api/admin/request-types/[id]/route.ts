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
  requiresRecipient: z.boolean(),
  requiresAssignment: z.boolean(),
});

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Ctx<P extends Record<string, string>> = { params: Promise<P> };

export async function PATCH(req: NextRequest, ctx: Ctx<{ id: string }>) {
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

  const { id } = await ctx.params;
  const slug = toSlug(parsed.data.slug) || toSlug(parsed.data.name);

  const duplicate = await prisma.requestType.findFirst({
    where: { slug, NOT: { id } },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ error: "Slug already in use." }, { status: 400 });
  }

  const updated = await prisma.requestType.update({
    where: { id },
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

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx<{ id: string }>) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.requestType.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasRequests = await prisma.request.count({ where: { typeId: id } });
  if (hasRequests > 0) {
    return NextResponse.json(
      { error: "Request type has existing requests and cannot be deleted." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.requestTypeAssignee.deleteMany({ where: { typeId: id } }),
    prisma.requestType.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canAccessRequest } from "@/lib/request-access";

const statusSchema = z.object({
  status: z.enum([
    "NEW",
    "IN_PROGRESS",
    "WAITING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "DONE",
  ]),
  note: z.string().optional(),
});

type Ctx<P extends Record<string, string>> = { params: Promise<P> };

export async function POST(req: NextRequest, ctx: Ctx<{ id: string }>) {
  const { id } = await ctx.params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const requestItem = await prisma.request.findUnique({
    where: { id },
    include: {
      type: { include: { assignees: { select: { userId: true } } } },
    },
  });

  if (!requestItem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    select: { teamId: true },
  });

  if (
    !canAccessRequest({
      user,
      teamId: membership?.teamId ?? null,
      request: requestItem,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    user.role === "WORKER" &&
    requestItem.createdById !== user.id &&
    requestItem.assignedToId !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.request.update({
    where: { id: requestItem.id },
    data: { status: parsed.data.status },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: requestItem.id,
      actorId: user.id,
      fromStatus: requestItem.status,
      toStatus: parsed.data.status,
      note: parsed.data.note,
    },
  });

  return NextResponse.json(updated);
}

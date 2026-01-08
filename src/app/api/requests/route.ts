import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { buildRequestAccessWhere } from "@/lib/request-access";

const requestCreateSchema = z.object({
  typeId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]),
  recipientId: z.string().min(1).optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    select: { teamId: true },
  });

  const requests = await prisma.request.findMany({
    where: buildRequestAccessWhere(user, membership?.teamId ?? null),
    include: {
      type: true,
      createdBy: { select: { id: true, fullName: true } },
      assignedTo: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { typeId, title, description, priority, recipientId } = parsed.data;

  const type = await prisma.requestType.findUnique({
    where: { id: typeId },
  });

  if (!type) {
    return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
  }

  if (type.requiresRecipient && !recipientId) {
    return NextResponse.json({ error: "Recipient required." }, { status: 400 });
  }

  let recipientUserId: string | null = recipientId ?? null;
  if (recipientId) {
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isActive: true },
    });

    if (!recipient || !recipient.isActive) {
      return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
    }
  }

  let assignedToId: string | null = null;
  if (type.requiresAssignment) {
    const primaryAssignee = await prisma.requestTypeAssignee.findFirst({
      where: { typeId: type.id, isPrimary: true },
    });
    const fallbackAssignee =
      primaryAssignee ??
      (await prisma.requestTypeAssignee.findFirst({ where: { typeId: type.id } }));
    assignedToId = fallbackAssignee?.userId ?? null;
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    select: { teamId: true },
  });

  const created = await prisma.request.create({
    data: {
      typeId: type.id,
      title,
      description,
      priority,
      createdById: user.id,
      assignedToId,
      recipientId: recipientUserId,
      teamId: membership?.teamId ?? null,
    },
    include: {
      type: true,
      createdBy: { select: { id: true, fullName: true } },
      assignedTo: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}

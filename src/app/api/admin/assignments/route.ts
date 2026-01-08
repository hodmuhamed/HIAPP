import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const assignmentSchema = z.object({
  typeId: z.string().min(1),
  userId: z.string().min(1),
  isPrimary: z.boolean(),
});

export async function GET() {
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
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { typeId, userId, isPrimary } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existingUser) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.requestTypeAssignee.updateMany({
        where: { typeId },
        data: { isPrimary: false },
      });
    }

    return tx.requestTypeAssignee.upsert({
      where: {
        typeId_userId: {
          typeId,
          userId,
        },
      },
      update: { isPrimary },
      create: { typeId, userId, isPrimary },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  });

  return NextResponse.json(result, { status: 201 });
}

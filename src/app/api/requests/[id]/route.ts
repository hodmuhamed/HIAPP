import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canAccessRequest } from "@/lib/request-access";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const requestItem = await prisma.request.findUnique({
    where: { id },
    include: {
      type: { include: { assignees: { select: { userId: true } } } },
      createdBy: { select: { id: true, fullName: true } },
      assignedTo: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
      comments: {
        include: { author: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
      history: {
        include: { actor: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
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

  return NextResponse.json(requestItem);
}

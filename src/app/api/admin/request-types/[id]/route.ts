import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const requestTypeSchema = z.object({
  name: z.string().min(1),
  visibilityPolicy: z.enum([
    "ADMIN_ONLY",
    "DIRECT_PARTICIPANTS",
    "ADMIN_AND_HANDLERS",
    "TEAM_PUBLIC",
  ]),
  requiresRecipient: z.boolean(),
  requiresAssignment: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const updated = await prisma.requestType.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

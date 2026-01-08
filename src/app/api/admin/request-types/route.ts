import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const types = await prisma.requestType.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(types);
}

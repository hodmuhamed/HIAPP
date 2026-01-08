import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function GET(_req: NextRequest) {
  const types = await prisma.requestType.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(types);
}

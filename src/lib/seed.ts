import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.requestHistory.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const [adminPassword, leadPassword, workerPassword] = await Promise.all([
    bcrypt.hash("Admin!ChangeMe123", 12),
    bcrypt.hash("Lead!ChangeMe123", 12),
    bcrypt.hash("Worker!ChangeMe123", 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: "admin@humperia.app",
      passwordHash: adminPassword,
      fullName: "Admin User",
      role: "ADMIN",
      isActive: true,
    },
  });

  const lead = await prisma.user.create({
    data: {
      email: "lead@humperia.app",
      passwordHash: leadPassword,
      fullName: "Team Lead",
      role: "TEAM_LEAD",
      isActive: true,
    },
  });

  const worker1 = await prisma.user.create({
    data: {
      email: "worker1@humperia.app",
      passwordHash: workerPassword,
      fullName: "Worker One",
      role: "WORKER",
      isActive: true,
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      email: "worker2@humperia.app",
      passwordHash: workerPassword,
      fullName: "Worker Two",
      role: "WORKER",
      isActive: true,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "Operations",
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { userId: lead.id, teamId: team.id },
      { userId: worker1.id, teamId: team.id },
      { userId: worker2.id, teamId: team.id },
    ],
  });

  const requestOne = await prisma.request.create({
    data: {
      title: "Prepare weekly maintenance plan",
      description: "Compile the maintenance checklist for next week.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdById: admin.id,
      assignedToId: lead.id,
      teamId: team.id,
    },
  });

  const requestTwo = await prisma.request.create({
    data: {
      title: "Replace lobby light fixtures",
      description: "Swap all flickering lobby lights with LED fixtures.",
      status: "WAITING_APPROVAL",
      priority: "NORMAL",
      createdById: lead.id,
      assignedToId: worker1.id,
      teamId: team.id,
    },
  });

  await prisma.requestComment.create({
    data: {
      requestId: requestOne.id,
      authorId: lead.id,
      body: "Drafted the checklist; awaiting approval before distribution.",
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: requestOne.id,
      actorId: admin.id,
      fromStatus: "NEW",
      toStatus: "IN_PROGRESS",
      note: "Initial review completed.",
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: requestTwo.id,
      actorId: lead.id,
      fromStatus: "NEW",
      toStatus: "WAITING_APPROVAL",
      note: "Awaiting approval from admin.",
    },
  });
}

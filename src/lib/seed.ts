import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.requestHistory.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.requestTypeAssignee.deleteMany();
  await prisma.requestType.deleteMany();
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

  const kolegaType = await prisma.requestType.create({
    data: {
      name: "Kolega -> kolega",
      slug: "kolega",
      visibilityPolicy: "DIRECT_PARTICIPANTS",
      requiresRecipient: true,
    },
  });

  const nabavkaType = await prisma.requestType.create({
    data: {
      name: "Nabavka",
      slug: "nabavka",
      visibilityPolicy: "ADMIN_AND_HANDLERS",
      requiresAssignment: true,
    },
  });

  const hrType = await prisma.requestType.create({
    data: {
      name: "HR (povjerljivo)",
      slug: "hr",
      visibilityPolicy: "ADMIN_ONLY",
    },
  });

  await prisma.requestTypeAssignee.create({
    data: {
      typeId: nabavkaType.id,
      userId: lead.id,
      isPrimary: true,
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
      typeId: nabavkaType.id,
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
      typeId: kolegaType.id,
      title: "Replace lobby light fixtures",
      description: "Swap all flickering lobby lights with LED fixtures.",
      status: "WAITING_APPROVAL",
      priority: "NORMAL",
      createdById: lead.id,
      assignedToId: worker1.id,
      recipientId: worker2.id,
      teamId: team.id,
    },
  });

  await prisma.request.create({
    data: {
      typeId: hrType.id,
      title: "HR onboarding update",
      description: "Confidential onboarding request for a new hire.",
      status: "NEW",
      priority: "LOW",
      createdById: admin.id,
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

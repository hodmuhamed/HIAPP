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

  const vacationType = await prisma.requestType.create({
    data: {
      name: "Godišnji odmor",
      slug: "godisnji-odmor",
      visibilityPolicy: "ADMIN_ONLY",
      requiresRecipient: false,
      requiresAssignment: false,
    },
  });

  const raiseType = await prisma.requestType.create({
    data: {
      name: "Povišica / plata",
      slug: "povisica-plata",
      visibilityPolicy: "ADMIN_ONLY",
      requiresRecipient: false,
      requiresAssignment: false,
    },
  });

  const procurementType = await prisma.requestType.create({
    data: {
      name: "Nabavka materijala",
      slug: "nabavka-materijala",
      visibilityPolicy: "ADMIN_AND_HANDLERS",
      requiresAssignment: true,
    },
  });

  const restockType = await prisma.requestType.create({
    data: {
      name: "Dopuna lagera (skladište)",
      slug: "dopuna-lagera-skladiste",
      visibilityPolicy: "ADMIN_AND_HANDLERS",
      requiresAssignment: true,
    },
  });

  const generalType = await prisma.requestType.create({
    data: {
      name: "Opšti zahtjev / poruka",
      slug: "opsti-zahtjev-poruka",
      visibilityPolicy: "TEAM_PUBLIC",
      requiresRecipient: false,
      requiresAssignment: false,
    },
  });

  await prisma.requestTypeAssignee.createMany({
    data: [
      { typeId: procurementType.id, userId: lead.id, isPrimary: true },
      { typeId: procurementType.id, userId: worker1.id, isPrimary: false },
      { typeId: restockType.id, userId: lead.id, isPrimary: true },
      { typeId: restockType.id, userId: worker2.id, isPrimary: false },
    ],
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
      typeId: procurementType.id,
      title: "Nabavka alata za servis",
      description: "Kupiti set bitova i zamjenski alat za terenski tim.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdById: admin.id,
      assignedToId: lead.id,
      teamId: team.id,
    },
  });

  const requestTwo = await prisma.request.create({
    data: {
      typeId: restockType.id,
      title: "Dopuna lagera - kablovi",
      description: "Narudžba kablova za nadzor i standardne konektore.",
      status: "WAITING_APPROVAL",
      priority: "NORMAL",
      createdById: lead.id,
      assignedToId: worker2.id,
      teamId: team.id,
    },
  });

  const requestThree = await prisma.request.create({
    data: {
      typeId: vacationType.id,
      title: "Godišnji odmor - juli",
      description: "Zahtjev za godišnji od 10 dana u julu.",
      status: "WAITING_APPROVAL",
      priority: "NORMAL",
      createdById: worker2.id,
      recipientId: admin.id,
      teamId: team.id,
    },
  });

  const requestFour = await prisma.request.create({
    data: {
      typeId: raiseType.id,
      title: "Ažuriranje koeficijenta",
      description: "Review trenutne obaveze i razmotriti povišicu.",
      status: "NEW",
      priority: "LOW",
      createdById: worker1.id,
      teamId: team.id,
    },
  });

  const requestFive = await prisma.request.create({
    data: {
      typeId: generalType.id,
      title: "Opšti info kanal",
      description: "Objava za cijeli tim - novi raspored smjena.",
      status: "NEW",
      priority: "NORMAL",
      createdById: lead.id,
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

  await prisma.requestHistory.create({
    data: {
      requestId: requestThree.id,
      actorId: worker2.id,
      fromStatus: "NEW",
      toStatus: "WAITING_APPROVAL",
      note: "Planirano usklađivanje sa timom.",
    },
  });

  await prisma.requestHistory.create({
    data: {
      requestId: requestFive.id,
      actorId: lead.id,
      fromStatus: "NEW",
      toStatus: "NEW",
      note: "Obavijest poslana timu.",
    },
  });
}

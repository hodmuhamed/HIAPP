import type { Prisma } from "@prisma/client";

import type { SessionUser } from "./auth";

export const buildRequestAccessWhere = (
  user: SessionUser,
  teamId: string | null,
): Prisma.RequestWhereInput => {
  if (user.role === "ADMIN") {
    return {};
  }

  const or: Prisma.RequestWhereInput[] = [{ createdById: user.id }];

  or.push({
    type: { visibilityPolicy: "ADMIN_ONLY" },
    OR: [{ recipientId: user.id }, { assignedToId: user.id }],
  });

  or.push({
    type: { visibilityPolicy: "DIRECT_PARTICIPANTS" },
    OR: [{ recipientId: user.id }, { assignedToId: user.id }],
  });

  or.push({
    type: {
      visibilityPolicy: "ADMIN_AND_HANDLERS",
      assignees: { some: { userId: user.id } },
    },
  });

  or.push({
    type: { visibilityPolicy: "ADMIN_AND_HANDLERS" },
    OR: [{ assignedToId: user.id }, { recipientId: user.id }],
  });

  if (teamId) {
    or.push({
      type: { visibilityPolicy: "TEAM_PUBLIC" },
      teamId,
    });
  }

  return { OR: or };
};

export const canAccessRequest = (params: {
  user: SessionUser;
  teamId: string | null;
  request: {
    createdById: string;
    recipientId: string | null;
    assignedToId: string | null;
    teamId: string | null;
    type: {
      visibilityPolicy:
        | "ADMIN_ONLY"
        | "DIRECT_PARTICIPANTS"
        | "ADMIN_AND_HANDLERS"
        | "TEAM_PUBLIC";
      assignees: { userId: string }[];
    };
  };
}): boolean => {
  const { user, teamId, request } = params;

  if (user.role === "ADMIN") {
    return true;
  }

  const isCreator = request.createdById === user.id;
  const isRecipient = request.recipientId === user.id;
  const isAssigned = request.assignedToId === user.id;
  const isTypeAssignee = request.type.assignees.some(
    (assignee) => assignee.userId === user.id,
  );
  const isSameTeam = Boolean(teamId && request.teamId && request.teamId === teamId);

  if (isCreator) {
    return true;
  }

  switch (request.type.visibilityPolicy) {
    case "ADMIN_ONLY":
      return isRecipient || isAssigned;
    case "DIRECT_PARTICIPANTS":
      return isRecipient || isAssigned;
    case "ADMIN_AND_HANDLERS":
      return isRecipient || isAssigned || isTypeAssignee;
    case "TEAM_PUBLIC":
      return isSameTeam || isRecipient || isAssigned;
    default:
      return false;
  }
};

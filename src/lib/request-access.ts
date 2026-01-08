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
    type: { visibilityPolicy: "DIRECT_PARTICIPANTS" },
    recipientId: user.id,
  });

  or.push({
    type: { visibilityPolicy: "ADMIN_AND_HANDLERS" },
    assignedToId: user.id,
  });

  or.push({
    type: {
      visibilityPolicy: "ADMIN_AND_HANDLERS",
      assignees: { some: { userId: user.id } },
    },
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

  if (request.createdById === user.id) {
    return true;
  }

  switch (request.type.visibilityPolicy) {
    case "DIRECT_PARTICIPANTS":
      return request.recipientId === user.id;
    case "ADMIN_ONLY":
      return false;
    case "ADMIN_AND_HANDLERS":
      return (
        request.assignedToId === user.id ||
        request.type.assignees.some((assignee) => assignee.userId === user.id)
      );
    case "TEAM_PUBLIC":
      return Boolean(teamId && request.teamId === teamId);
    default:
      return false;
  }
};

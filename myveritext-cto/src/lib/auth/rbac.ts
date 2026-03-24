import { getPrisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export type RequestContext = {
  userId: string;
  organizationId: string;
  role: UserRole;
};

export async function getRequestContext(request: Request): Promise<RequestContext | null> {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;

  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };
}

export async function canAccessMatter(userId: string, matterId: string) {
  const prisma = getPrisma();

  const membership = await prisma.matterMembership.findUnique({
    where: {
      matterId_userId: {
        matterId,
        userId,
      },
    },
  });

  return Boolean(membership);
}

export function isElevatedRole(role: UserRole) {
  return role === "ADMIN" || role === "ATTORNEY";
}

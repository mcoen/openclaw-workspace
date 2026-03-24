import { getPrisma } from "@/lib/prisma";
import type { Prisma, AuditAction } from "@prisma/client";

type LogAuditEventArgs = {
  organizationId: string;
  matterId?: string;
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logAuditEvent(args: LogAuditEventArgs) {
  const prisma = getPrisma();

  await prisma.auditEvent.create({
    data: {
      organizationId: args.organizationId,
      matterId: args.matterId,
      actorUserId: args.actorUserId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      metadataJson: args.metadata,
    },
  });
}

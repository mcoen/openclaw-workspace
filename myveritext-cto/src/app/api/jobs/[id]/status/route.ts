import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { updateJobStatusSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";
import { canAccessMatter, getRequestContext, isElevatedRole } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();
  if (!isElevatedRole(context.role)) return forbidden("Insufficient role for scheduling changes");

  const { id } = await params;
  const payload = await request.json();
  const parsed = updateJobStatusSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.job.findUnique({
    where: { id },
    include: { matter: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const hasMatterAccess = await canAccessMatter(context.userId, existing.matterId);
  if (!hasMatterAccess) return forbidden("No access to this matter");

  const job = await prisma.job.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await logAuditEvent({
    organizationId: existing.matter.organizationId,
    matterId: existing.matterId,
    actorUserId: context.userId,
    action: "UPDATE",
    entityType: "Job",
    entityId: id,
    metadata: { fromStatus: existing.status, toStatus: job.status },
  });

  return NextResponse.json({ data: job });
}

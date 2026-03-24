import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { createJobSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";
import { canAccessMatter, getRequestContext, isElevatedRole } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";

export async function GET(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();

  const jobs = await prisma.job.findMany({
    where: { matter: { organizationId: context.organizationId } },
    orderBy: { scheduledStart: "asc" },
    include: { matter: true },
    take: 100,
  });

  return NextResponse.json({ data: jobs });
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();

  const payload = await request.json();
  const parsed = createJobSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hasMatterAccess = await canAccessMatter(context.userId, parsed.data.matterId);
  if (!hasMatterAccess) return forbidden("No access to this matter");
  if (!isElevatedRole(context.role)) return forbidden("Insufficient role for scheduling changes");

  const job = await prisma.job.create({
    data: {
      ...parsed.data,
      scheduledStart: new Date(parsed.data.scheduledStart),
      scheduledEnd: parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : undefined,
      status: "SCHEDULED",
    },
    include: { matter: true },
  });

  await logAuditEvent({
    organizationId: job.matter.organizationId,
    matterId: job.matterId,
    actorUserId: context.userId,
    action: "CREATE",
    entityType: "Job",
    entityId: job.id,
    metadata: { scheduledStart: job.scheduledStart.toISOString(), status: job.status },
  });

  return NextResponse.json({ data: job }, { status: 201 });
}

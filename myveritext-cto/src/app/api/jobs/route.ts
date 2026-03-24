import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { createJobSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const prisma = getPrisma();

  const jobs = await prisma.job.findMany({
    orderBy: { scheduledStart: "asc" },
    include: { matter: true },
    take: 100,
  });

  return NextResponse.json({ data: jobs });
}

export async function POST(request: Request) {
  const prisma = getPrisma();

  const payload = await request.json();
  const parsed = createJobSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

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
    action: "CREATE",
    entityType: "Job",
    entityId: job.id,
    metadata: { scheduledStart: job.scheduledStart.toISOString(), status: job.status },
  });

  return NextResponse.json({ data: job }, { status: 201 });
}

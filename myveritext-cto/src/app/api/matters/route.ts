import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { createMatterSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";
import { getRequestContext } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";

export async function GET(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();

  const matters = await prisma.matter.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { createdAt: "desc" },
    include: { jobs: true },
    take: 100,
  });

  return NextResponse.json({ data: matters });
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();
  if (context.role !== "ADMIN" && context.role !== "ATTORNEY") return forbidden();

  const payload = await request.json();
  const parsed = createMatterSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.organizationId !== context.organizationId) {
    return forbidden("Cannot create matter outside your organization");
  }

  const matter = await prisma.matter.create({
    data: parsed.data,
  });

  await logAuditEvent({
    organizationId: matter.organizationId,
    matterId: matter.id,
    actorUserId: context.userId,
    action: "CREATE",
    entityType: "Matter",
    entityId: matter.id,
    metadata: { referenceNumber: matter.referenceNumber, title: matter.title },
  });

  return NextResponse.json({ data: matter }, { status: 201 });
}

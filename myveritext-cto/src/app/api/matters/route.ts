import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { createMatterSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const prisma = getPrisma();

  const matters = await prisma.matter.findMany({
    orderBy: { createdAt: "desc" },
    include: { jobs: true },
    take: 100,
  });

  return NextResponse.json({ data: matters });
}

export async function POST(request: Request) {
  const prisma = getPrisma();

  const payload = await request.json();
  const parsed = createMatterSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matter = await prisma.matter.create({
    data: parsed.data,
  });

  await logAuditEvent({
    organizationId: matter.organizationId,
    matterId: matter.id,
    action: "CREATE",
    entityType: "Matter",
    entityId: matter.id,
    metadata: { referenceNumber: matter.referenceNumber, title: matter.title },
  });

  return NextResponse.json({ data: matter }, { status: 201 });
}

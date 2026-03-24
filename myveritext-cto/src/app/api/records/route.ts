import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { canAccessMatter, getRequestContext, isElevatedRole } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";

const createRecordSchema = z.object({
  matterId: z.string().min(1),
  type: z.enum(["TRANSCRIPT", "EXHIBIT"]),
  title: z.string().min(2),
  storagePath: z.string().min(2),
  originalFileName: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().positive().optional(),
});

export async function GET(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();

  const records = await prisma.record.findMany({
    where: { matter: { organizationId: context.organizationId } },
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: records });
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();
  if (!isElevatedRole(context.role)) return forbidden("Insufficient role for record upload");

  const payload = await request.json();
  const parsed = createRecordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hasMatterAccess = await canAccessMatter(context.userId, parsed.data.matterId);
  if (!hasMatterAccess) return forbidden("No access to this matter");

  const record = await prisma.record.create({
    data: {
      ...parsed.data,
      uploadedById: context.userId,
      status: "READY",
      sizeBytes: parsed.data.sizeBytes ? BigInt(parsed.data.sizeBytes) : undefined,
    },
  });

  await logAuditEvent({
    organizationId: context.organizationId,
    matterId: record.matterId,
    actorUserId: context.userId,
    action: "CREATE",
    entityType: "Record",
    entityId: record.id,
    metadata: { type: record.type, title: record.title, storagePath: record.storagePath },
  });

  return NextResponse.json(
    {
      data: {
        ...record,
        sizeBytes: record.sizeBytes ? record.sizeBytes.toString() : null,
      },
    },
    { status: 201 },
  );
}

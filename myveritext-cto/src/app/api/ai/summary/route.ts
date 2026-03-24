import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { canAccessMatter, getRequestContext } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";
import { logAuditEvent } from "@/lib/audit";

const summaryRequestSchema = z.object({
  matterId: z.string().min(1),
  prompt: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const prisma = getPrisma();
  const context = await getRequestContext(request);
  if (!context) return unauthorized();

  const payload = await request.json();
  const parsed = summaryRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hasMatterAccess = await canAccessMatter(context.userId, parsed.data.matterId);
  if (!hasMatterAccess) return forbidden("No access to this matter");

  const matter = await prisma.matter.findUnique({
    where: { id: parsed.data.matterId },
    include: {
      jobs: { orderBy: { scheduledStart: "desc" }, take: 3 },
      records: { where: { type: "TRANSCRIPT" }, orderBy: { uploadedAt: "desc" }, take: 5 },
    },
  });

  if (!matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const summary = `Matter ${matter.referenceNumber} (${matter.title}) has ${matter.jobs.length} recent proceedings and ${matter.records.length} transcript records indexed. Primary recommendation: review most recent transcript package and validate exhibit references before next scheduled event.`;

  const citations = matter.records.slice(0, 3).map((r, idx) => ({
    sourceType: "record",
    sourceId: r.id,
    label: `${r.title} (${r.originalFileName})`,
    excerpt: `Referenced transcript source #${idx + 1} for summary support.`,
  }));

  await logAuditEvent({
    organizationId: context.organizationId,
    matterId: matter.id,
    actorUserId: context.userId,
    action: "SUMMARIZE",
    entityType: "Matter",
    entityId: matter.id,
    metadata: { prompt: parsed.data.prompt ?? null, citationCount: citations.length },
  });

  return NextResponse.json({
    data: {
      matterId: matter.id,
      summary,
      citations,
      confidence: "medium",
      generatedAt: new Date().toISOString(),
      mode: "demo-scaffold",
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getRequestContext, canAccessMatter } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";

const searchQuerySchema = z.object({
  q: z.string().min(2),
  matterId: z.string().optional(),
});

export async function GET(request: Request) {
  const context = await getRequestContext(request);
  if (!context) return unauthorized();

  const url = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    matterId: url.searchParams.get("matterId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prisma = getPrisma();

  if (parsed.data.matterId) {
    const hasAccess = await canAccessMatter(context.userId, parsed.data.matterId);
    if (!hasAccess) return forbidden("No access to this matter");
  }

  const [matters, records] = await Promise.all([
    prisma.matter.findMany({
      where: {
        organizationId: context.organizationId,
        ...(parsed.data.matterId ? { id: parsed.data.matterId } : {}),
        OR: [
          { title: { contains: parsed.data.q, mode: "insensitive" } },
          { referenceNumber: { contains: parsed.data.q, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.record.findMany({
      where: {
        matter: { organizationId: context.organizationId },
        ...(parsed.data.matterId ? { matterId: parsed.data.matterId } : {}),
        OR: [
          { title: { contains: parsed.data.q, mode: "insensitive" } },
          { originalFileName: { contains: parsed.data.q, mode: "insensitive" } },
        ],
      },
      take: 30,
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    data: {
      query: parsed.data.q,
      strategy: "keyword-now-vector-next",
      matters,
      records: records.map((r) => ({ ...r, sizeBytes: r.sizeBytes ? r.sizeBytes.toString() : null })),
    },
  });
}

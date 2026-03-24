import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getRequestContext, canAccessMatter, isElevatedRole } from "@/lib/auth/rbac";
import { unauthorized, forbidden } from "@/lib/http";

const uploadRequestSchema = z.object({
  matterId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().optional(),
  type: z.enum(["TRANSCRIPT", "EXHIBIT"]),
});

export async function POST(request: Request) {
  const context = await getRequestContext(request);
  if (!context) return unauthorized();
  if (!isElevatedRole(context.role)) return forbidden("Insufficient role for uploads");

  const payload = await request.json();
  const parsed = uploadRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hasMatterAccess = await canAccessMatter(context.userId, parsed.data.matterId);
  if (!hasMatterAccess) return forbidden("No access to this matter");

  const objectKey = `org-${context.organizationId}/matter-${parsed.data.matterId}/${Date.now()}-${randomUUID()}-${parsed.data.fileName}`;

  // Demo scaffold: return a shape compatible with future GCS signed-url integration.
  return NextResponse.json({
    data: {
      provider: "gcs",
      method: "PUT",
      uploadUrl: `https://storage.googleapis.com/myveritext-cto-files/${objectKey}`,
      objectKey,
      expiresInSeconds: 900,
      headers: {
        "Content-Type": parsed.data.mimeType,
      },
    },
  });
}

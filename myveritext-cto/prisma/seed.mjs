import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "org_demo_veritext" },
    update: { name: "Veritext Demo Org" },
    create: { id: "org_demo_veritext", name: "Veritext Demo Org" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@veritext-demo.local" },
    update: { displayName: "Demo Admin", role: "ADMIN", organizationId: org.id },
    create: {
      email: "admin@veritext-demo.local",
      displayName: "Demo Admin",
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  const matter = await prisma.matter.upsert({
    where: {
      organizationId_referenceNumber: {
        organizationId: org.id,
        referenceNumber: "VTX-2026-001",
      },
    },
    update: {
      title: "Acme Holdings v. Northstar Logistics",
      venue: "NY Supreme Court",
      caseType: "Commercial Litigation",
    },
    create: {
      organizationId: org.id,
      referenceNumber: "VTX-2026-001",
      title: "Acme Holdings v. Northstar Logistics",
      venue: "NY Supreme Court",
      caseType: "Commercial Litigation",
    },
  });

  await prisma.matterMembership.upsert({
    where: {
      matterId_userId: {
        matterId: matter.id,
        userId: admin.id,
      },
    },
    update: { role: "ADMIN" },
    create: { matterId: matter.id, userId: admin.id, role: "ADMIN" },
  });

  await prisma.job.create({
    data: {
      matterId: matter.id,
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24),
      location: "Remote - Teams",
      status: "SCHEDULED",
      notes: "Demo seeded proceeding",
    },
  });

  await prisma.record.create({
    data: {
      matterId: matter.id,
      type: "TRANSCRIPT",
      title: "Deposition Transcript - Jane Doe",
      storagePath: "gs://myveritext-cto-files/demo/jane-doe-deposition.pdf",
      originalFileName: "jane-doe-deposition.pdf",
      mimeType: "application/pdf",
      sizeBytes: BigInt(248193),
      status: "READY",
      version: 1,
      uploadedById: admin.id,
    },
  });

  console.log("Seed complete", {
    organizationId: org.id,
    adminUserId: admin.id,
    matterId: matter.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

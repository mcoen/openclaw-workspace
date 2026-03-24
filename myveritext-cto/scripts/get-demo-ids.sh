#!/usr/bin/env bash
set -euo pipefail

# Requires DATABASE_URL in environment.
# Prints IDs needed for smoke tests and demo calls.

if [[ -z "${DATABASE_URL:-}" ]]; then
  >&2 echo "DATABASE_URL is not set."
  >&2 echo "Example: export DATABASE_URL='postgresql://user:pass@host:5432/db?schema=public'"
  exit 1
fi

node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@veritext-demo.local' },
    orderBy: { createdAt: 'asc' }
  });

  const matter = await prisma.matter.findFirst({
    where: { referenceNumber: 'VTX-2026-001' },
    orderBy: { createdAt: 'asc' }
  });

  if (!admin || !matter) {
    console.log('Could not find seeded records. Run: npm run db:seed');
    process.exit(2);
  }

  console.log(`export ADMIN_USER_ID="${admin.id}"`);
  console.log(`export MATTER_ID="${matter.id}"`);
  console.log('echo "IDs loaded"');
}

main().finally(async () => {
  await prisma.$disconnect();
});
NODE

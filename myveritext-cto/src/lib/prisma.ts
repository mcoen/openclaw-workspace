import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma() {
  if (!global.prisma) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set");
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    global.prisma = new PrismaClient({ adapter });
  }

  return global.prisma;
}

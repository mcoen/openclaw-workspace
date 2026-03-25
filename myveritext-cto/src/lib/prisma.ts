import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma() {
  if (!global.prisma) {
    // Prisma 7 runtime in some deploy targets requires an explicit options object.
    global.prisma = new PrismaClient({});
  }

  return global.prisma;
}

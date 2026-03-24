import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma() {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }

  return global.prisma;
}

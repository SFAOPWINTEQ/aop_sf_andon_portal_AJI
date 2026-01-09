import "server-only";
import { PrismaClient } from "@prisma/client";

const createStandardPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  standardPrisma: PrismaClient | undefined;
};

const db = globalForPrisma.standardPrisma ?? createStandardPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.standardPrisma = db;
}

export { db };

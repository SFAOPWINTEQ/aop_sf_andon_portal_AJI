import "server-only";
import { PrismaClient } from "@prisma/client";

import { timezoneExtension } from "./prisma-extension";

const createStandardPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Apply the timezone extension to ensure Date objects stored in DB match Local Time (e.g. UTC+7)
  // Logic: 
  // Write: Date(Local 18:00/UTC 11:00) -> Shift +7 -> Date(UTC 18:00) -> DB stores "18:00"
  // Read: DB "18:00" -> Date(UTC 18:00) -> Shift -7 -> Date(Local 18:00/UTC 11:00) -> UI correct
  return client.$extends(timezoneExtension) as unknown as PrismaClient;
};


const globalForPrisma = globalThis as unknown as {
  standardPrisma: PrismaClient | undefined;
};

const db = globalForPrisma.standardPrisma ?? createStandardPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.standardPrisma = db;
}

export { db };



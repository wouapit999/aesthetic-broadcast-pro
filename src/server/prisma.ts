import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

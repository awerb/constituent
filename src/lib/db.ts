import { PrismaClient } from "@prisma/client";
import { applytTenantMiddleware } from "@/server/middleware/tenant";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Apply tenant middleware to enforce data isolation
applytTenantMiddleware(prisma);

export default prisma;

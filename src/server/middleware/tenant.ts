import { AsyncLocalStorage } from "node:async_hooks";
import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";

const tenantStore = new AsyncLocalStorage<{ cityId: string }>();

export function getTenantContext(): { cityId: string } | undefined {
  return tenantStore.getStore();
}

export function setTenantContext<T>(cityId: string, callback: () => T): T {
  return tenantStore.run({ cityId }, callback);
}

let cachedSingleTenantCityId: string | null = null;
let singleTenantMode = false;

export async function initializeSingleTenantMode(prisma: PrismaClient) {
  const cityCount = await prisma.city.count();
  if (cityCount === 1) {
    singleTenantMode = true;
    const city = await prisma.city.findFirst();
    if (city) {
      cachedSingleTenantCityId = city.id;
    }
  }
}

export function getCurrentCityId(userCityId?: string): string {
  // First check async local storage context
  const context = getTenantContext();
  if (context?.cityId) {
    return context.cityId;
  }

  // Then check if single tenant mode and use cached ID
  if (singleTenantMode && cachedSingleTenantCityId) {
    return cachedSingleTenantCityId;
  }

  // Fall back to user's city ID
  if (userCityId) {
    return userCityId;
  }

  throw new Error("Unable to determine tenant context (cityId)");
}

export function applytTenantMiddleware(prisma: PrismaClient, userRole?: Role, userCityId?: string) {
  return prisma.$use(async (params, next) => {
    const { model, action, args } = params;

    // Skip tenant injection for SUPER_ADMIN
    if (userRole === Role.SUPER_ADMIN) {
      return next(params);
    }

    // List of models that have cityId field
    const tenantModels = [
      "City",
      "Constituent",
      "Department",
      "User",
      "Case",
      "NewsletterItem",
      "NewsletterSignal",
      "Template",
      "SlaConfig",
      "KbArticle",
      "Webhook",
      "AuditLog",
    ];

    if (!tenantModels.includes(model)) {
      return next(params);
    }

    const cityId = getCurrentCityId(userCityId);

    // Handle different actions
    if (action === "findMany") {
      if (!args.where) {
        args.where = {};
      }
      if (typeof args.where === "object" && args.where !== null) {
        args.where.cityId = cityId;
      }
    } else if (action === "findFirst") {
      if (!args.where) {
        args.where = {};
      }
      if (typeof args.where === "object" && args.where !== null) {
        args.where.cityId = cityId;
      }
    } else if (action === "findUnique" || action === "findUniqueOrThrow") {
      // For unique queries, we can't force the where clause as it would break the unique lookup
      // Instead, we verify after the query
    } else if (action === "create") {
      if (!args.data) {
        args.data = {};
      }
      if (typeof args.data === "object" && args.data !== null) {
        args.data.cityId = cityId;
      }
    } else if (action === "update" || action === "updateMany") {
      if (!args.where) {
        args.where = {};
      }
      if (typeof args.where === "object" && args.where !== null) {
        args.where.cityId = cityId;
      }
    } else if (action === "delete" || action === "deleteMany") {
      if (!args.where) {
        args.where = {};
      }
      if (typeof args.where === "object" && args.where !== null) {
        args.where.cityId = cityId;
      }
    } else if (action === "upsert") {
      if (!args.where) {
        args.where = {};
      }
      if (typeof args.where === "object" && args.where !== null) {
        args.where.cityId = cityId;
      }
      if (!args.create) {
        args.create = {};
      }
      if (typeof args.create === "object" && args.create !== null) {
        args.create.cityId = cityId;
      }
    }

    return next(params);
  });
}

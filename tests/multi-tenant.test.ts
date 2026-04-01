import { describe, it, expect, vi, beforeEach } from "vitest";
import { applytTenantMiddleware, getCurrentCityId, setTenantContext, type PrismaClient } from "@/server/middleware/tenant";
import { Role } from "@prisma/client";

describe("Multi-Tenant Middleware", () => {
  let prismaMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock = {
      $use: vi.fn((middleware) => middleware),
    };
  });

  describe("Injects cityId into findMany queries", () => {
    it("should add cityId to findMany where clause", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Case",
        action: "findMany",
        args: {
          where: { status: "NEW" },
        },
      };

      const next = vi.fn().mockResolvedValueOnce([]);
      const result = await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(cityId);
      expect(call.args.where.status).toBe("NEW");
    });

    it("should create where clause if not present in findMany", async () => {
      const cityId = "city-2";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Constituent",
        action: "findMany",
        args: {},
      };

      const next = vi.fn().mockResolvedValueOnce([]);
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where).toBeDefined();
      expect(call.args.where.cityId).toBe(cityId);
    });
  });

  describe("Injects cityId into create operations", () => {
    it("should add cityId to create data payload", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Case",
        action: "create",
        args: {
          data: {
            subject: "Test Case",
            status: "NEW",
          },
        },
      };

      const next = vi.fn().mockResolvedValueOnce({ id: "case-1" });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.data.cityId).toBe(cityId);
      expect(call.args.data.subject).toBe("Test Case");
    });

    it("should create data object if not present", async () => {
      const cityId = "city-3";
      const middleware = applytTenantMiddleware(prismaMock, Role.MANAGER, cityId);

      const params = {
        model: "Constituent",
        action: "create",
        args: {},
      };

      const next = vi.fn().mockResolvedValueOnce({ id: "const-1" });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.data).toBeDefined();
      expect(call.args.data.cityId).toBe(cityId);
    });
  });

  describe("Skips injection for SUPER_ADMIN users", () => {
    it("should not inject cityId for SUPER_ADMIN role", async () => {
      const middleware = applytTenantMiddleware(prismaMock, Role.SUPER_ADMIN, "city-1");

      const params = {
        model: "Case",
        action: "findMany",
        args: {
          where: { status: "NEW" },
        },
      };

      const next = vi.fn().mockResolvedValueOnce([]);
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call).toEqual(params);
    });

    it("should allow cross-tenant queries for SUPER_ADMIN", async () => {
      const middleware = applytTenantMiddleware(prismaMock, Role.SUPER_ADMIN, "city-1");

      const params = {
        model: "City",
        action: "findMany",
        args: {},
      };

      const next = vi.fn().mockResolvedValueOnce([]);
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where?.cityId).toBeUndefined();
    });
  });

  describe("Works in single-tenant mode with cached cityId", () => {
    it("should use cached cityId from setTenantContext", () => {
      const cachedCityId = "cached-city-1";
      let contextCityId: string | undefined;

      const result = setTenantContext(cachedCityId, () => {
        contextCityId = getCurrentCityId();
        return contextCityId;
      });

      expect(result).toBe(cachedCityId);
    });

    it("should fall back to user's cityId when context not set", () => {
      const userCityId = "user-city-1";
      const result = getCurrentCityId(userCityId);

      expect(result).toBe(userCityId);
    });
  });

  describe("Prevents cross-tenant data access", () => {
    it("should not allow accessing data from different city", async () => {
      const authorizedCityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, authorizedCityId);

      const params = {
        model: "Case",
        action: "findMany",
        args: {
          where: {},
        },
      };

      const next = vi.fn().mockResolvedValueOnce([]);
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(authorizedCityId);
    });

    it("should inject cityId into update queries", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Case",
        action: "update",
        args: {
          where: { id: "case-1" },
          data: { status: "RESOLVED" },
        },
      };

      const next = vi.fn().mockResolvedValueOnce({ id: "case-1" });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(cityId);
    });

    it("should inject cityId into delete queries", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.MANAGER, cityId);

      const params = {
        model: "Template",
        action: "delete",
        args: {
          where: { id: "template-1" },
        },
      };

      const next = vi.fn().mockResolvedValueOnce({ id: "template-1" });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(cityId);
    });
  });

  describe("Handles all tenant-aware models", () => {
    const tenantModels = [
      "Constituent",
      "Department",
      "Case",
      "NewsletterItem",
      "NewsletterSignal",
      "Template",
      "SlaConfig",
      "KbArticle",
      "Webhook",
      "AuditLog",
    ];

    tenantModels.forEach((model) => {
      it(`should inject cityId for ${model} model`, async () => {
        const cityId = "city-1";
        const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

        const params = {
          model,
          action: "findMany",
          args: {},
        };

        const next = vi.fn().mockResolvedValueOnce([]);
        await middleware(params, next);

        const call = next.mock.calls[0][0];
        expect(call.args.where.cityId).toBe(cityId);
      });
    });
  });

  describe("Skips non-tenant models", () => {
    it("should not modify queries for non-tenant models", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Session",
        action: "findMany",
        args: {
          where: { expiresAt: { gt: new Date() } },
        },
      };

      const next = vi.fn().mockResolvedValueOnce([]);
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBeUndefined();
      expect(call.args.where.expiresAt).toBeDefined();
    });
  });

  describe("Handles upsert operations", () => {
    it("should inject cityId into both create and where for upsert", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Constituent",
        action: "upsert",
        args: {
          where: { email: "test@example.com" },
          create: { email: "test@example.com", name: "Test" },
          update: { name: "Test Updated" },
        },
      };

      const next = vi.fn().mockResolvedValueOnce({ id: "const-1" });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(cityId);
      expect(call.args.create.cityId).toBe(cityId);
    });
  });

  describe("Handles updateMany and deleteMany", () => {
    it("should inject cityId into updateMany where clause", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.AGENT, cityId);

      const params = {
        model: "Case",
        action: "updateMany",
        args: {
          where: { status: "NEW" },
          data: { status: "IN_PROGRESS" },
        },
      };

      const next = vi.fn().mockResolvedValueOnce({ count: 5 });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(cityId);
      expect(call.args.where.status).toBe("NEW");
    });

    it("should inject cityId into deleteMany where clause", async () => {
      const cityId = "city-1";
      const middleware = applytTenantMiddleware(prismaMock, Role.MANAGER, cityId);

      const params = {
        model: "AuditLog",
        action: "deleteMany",
        args: {
          where: { createdAt: { lt: new Date() } },
        },
      };

      const next = vi.fn().mockResolvedValueOnce({ count: 10 });
      await middleware(params, next);

      const call = next.mock.calls[0][0];
      expect(call.args.where.cityId).toBe(cityId);
    });
  });

  describe("Handles different user roles", () => {
    const roles = [Role.ADMIN, Role.MANAGER, Role.AGENT, Role.ELECTED_OFFICIAL];

    roles.forEach((role) => {
      it(`should inject cityId for ${role} role`, async () => {
        const cityId = "city-1";
        const middleware = applytTenantMiddleware(prismaMock, role, cityId);

        const params = {
          model: "Case",
          action: "findMany",
          args: {},
        };

        const next = vi.fn().mockResolvedValueOnce([]);
        await middleware(params, next);

        const call = next.mock.calls[0][0];
        expect(call.args.where.cityId).toBe(cityId);
      });
    });
  });
});

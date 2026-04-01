import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/cases/[ref]/status/route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    case: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  attachRateLimitHeaders: vi.fn(),
}));

describe("Cases Status API Endpoint", () => {
  const mockCase = {
    referenceNumber: "CR-2024-00001",
    status: "IN_PROGRESS",
    priority: "NORMAL",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    department: {
      name: "Public Works",
      slug: "public-works",
    },
    firstRespondedAt: new Date("2024-01-16"),
    resolvedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Returns case status for valid reference number", () => {
    it("should return case status with valid reference number", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.referenceNumber).toBe("CR-2024-00001");
      expect(data.status).toBe("IN_PROGRESS");
      expect(data.priority).toBe("NORMAL");
      expect(data.department).toBe("Public Works");
    });

    it("should return all relevant case information", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data).toHaveProperty("referenceNumber");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("priority");
      expect(data).toHaveProperty("department");
      expect(data).toHaveProperty("departmentSlug");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("lastUpdatedAt");
      expect(data).toHaveProperty("firstRespondedAt");
      expect(data).toHaveProperty("resolvedAt");
    });
  });

  describe("Returns 404 for unknown reference number", () => {
    it("should return 404 when case not found", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(null);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-99999/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-99999" },
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("case_not_found");
    });
  });

  describe("Does not expose constituent PII", () => {
    it("should not include constituent email in response", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.email).toBeUndefined();
      expect(data.constituentEmail).toBeUndefined();
    });

    it("should not include constituent name in response", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.name).toBeUndefined();
      expect(data.constituentName).toBeUndefined();
    });

    it("should not include constituent phone in response", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.phone).toBeUndefined();
      expect(data.constituentPhone).toBeUndefined();
    });

    it("should not include case messages or internal details", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.messages).toBeUndefined();
      expect(data.description).toBeUndefined();
      expect(data.subject).toBeUndefined();
    });
  });

  describe("Returns 429 when rate limited", () => {
    it("should reject request when rate limit exceeded", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: false,
        limit: 30,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
      });

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("rate_limit_exceeded");
    });
  });

  describe("Validates reference number format", () => {
    it("should reject invalid reference number format", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      const request = new Request(
        "http://localhost/api/v1/cases/INVALID/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "INVALID" },
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("invalid_reference_number");
    });

    it("should accept valid CR-YYYY-NNNNN format", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      expect(response.status).toBe(200);
    });

    it("should reject lowercase cr prefix", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      const request = new Request(
        "http://localhost/api/v1/cases/cr-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "cr-2024-00001" },
      });

      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe("Returns different case statuses", () => {
    const statuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"];

    statuses.forEach((status) => {
      it(`should return case with ${status} status`, async () => {
        const { rateLimit } = await import("@/lib/rate-limit");

        (rateLimit as any).mockResolvedValueOnce({
          success: true,
          limit: 30,
          remaining: 29,
          resetAt: new Date(),
        });

        const caseWithStatus = { ...mockCase, status };
        (prisma.case.findUnique as any).mockResolvedValueOnce(caseWithStatus);

        const request = new Request(
          "http://localhost/api/v1/cases/CR-2024-00001/status",
          {
            method: "GET",
          }
        );

        const response = await GET(request as any, {
          params: { ref: "CR-2024-00001" },
        });

        const data = await response.json();

        expect(data.status).toBe(status);
      });
    });
  });

  describe("Includes timestamp information", () => {
    it("should include createdAt timestamp", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.createdAt).toBeDefined();
      expect(typeof data.createdAt).toBe("string");
    });

    it("should include firstRespondedAt timestamp when available", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.firstRespondedAt).toBeDefined();
    });

    it("should handle null resolvedAt timestamp", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 29,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      const data = await response.json();

      expect(data.resolvedAt).toBeNull();
    });
  });

  describe("Attaches rate limit headers", () => {
    it("should include rate limit headers in response", async () => {
      const { rateLimit, attachRateLimitHeaders } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 30,
        remaining: 25,
        resetAt: new Date(),
      });

      (prisma.case.findUnique as any).mockResolvedValueOnce(mockCase);

      const request = new Request(
        "http://localhost/api/v1/cases/CR-2024-00001/status",
        {
          method: "GET",
        }
      );

      const response = await GET(request as any, {
        params: { ref: "CR-2024-00001" },
      });

      expect(attachRateLimitHeaders).toHaveBeenCalledWith(
        response,
        expect.objectContaining({
          limit: 30,
          remaining: 25,
        })
      );
    });
  });
});

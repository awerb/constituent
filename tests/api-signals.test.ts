import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/signals/route";
import { prisma } from "@/lib/db";
import crypto from "crypto";

vi.mock("@/lib/db", () => ({
  prisma: {
    city: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/queue", () => ({
  signalQueue: {
    add: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  attachRateLimitHeaders: vi.fn(),
}));

describe("Signals API Endpoint", () => {
  const basePayload = {
    citySlug: "test-city",
    constituentEmail: "test@example.com",
    constituentName: "Test User",
    newsletterExternalId: "news-1",
    newsletterTitle: "Test Newsletter",
    newsletterSummary: "Test Summary",
    topicTags: ["public-works"],
    sourceUrl: "https://example.com/news",
    transparentCityDataUrl: "https://transparent.city/data",
    signalType: "FLAG" as const,
  };

  const mockCity = {
    id: "city-1",
    slug: "test-city",
    transparentCityApiKey: "valid-api-key",
    transparentCityWebhookSecret: "webhook-secret",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Returns 401 without API key", () => {
    it("should reject request without X-TC-Api-Key header", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tc-signature": "test-signature",
        },
        body: JSON.stringify(basePayload),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("missing_api_key");
    });
  });

  describe("Returns 401 with invalid API key", () => {
    it("should reject request with invalid API key", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "invalid-key",
          "X-TC-Signature": "test-signature",
        },
        body: JSON.stringify(basePayload),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("invalid_api_key");
    });
  });

  describe("Returns 400 with invalid body", () => {
    it("should reject request with missing required fields", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      const invalidPayload = {
        citySlug: "test-city",
        constituentEmail: "invalid-email",
      };

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-key",
          "X-TC-Signature": "signature",
        },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("validation_error");
    });

    it("should reject request with invalid email format", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      const invalidPayload = {
        ...basePayload,
        constituentEmail: "not-an-email",
      };

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-key",
          "X-TC-Signature": "signature",
        },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("validation_error");
    });

    it("should reject request with invalid signalType", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      const invalidPayload = {
        ...basePayload,
        signalType: "INVALID",
      };

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-key",
          "X-TC-Signature": "signature",
        },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("validation_error");
    });
  });

  describe("Returns 202 with valid signal", () => {
    it("should queue signal and return 202 Accepted", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const { signalQueue } = await import("@/lib/queue");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);

      const secret = "webhook-secret";
      const body = JSON.stringify(basePayload);
      const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      (signalQueue.add as any).mockResolvedValueOnce({ id: "job-1" });

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-api-key",
          "X-TC-Signature": signature,
        },
        body,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.status).toBe("queued");
      expect(data.signalId).toBe("job-1");
    });
  });

  describe("Returns 429 when rate limited", () => {
    it("should reject request when rate limit exceeded", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: false,
        limit: 10,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
      });

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-key",
          "X-TC-Signature": "signature",
        },
        body: JSON.stringify(basePayload),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("rate_limit_exceeded");
    });
  });

  describe("Validates HMAC signature", () => {
    it("should reject request with invalid signature", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);

      const body = JSON.stringify(basePayload);
      const invalidSignature = "invalid-signature-hash";

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-api-key",
          "X-TC-Signature": invalidSignature,
        },
        body,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("invalid_signature");
    });

    it("should accept request with valid HMAC signature", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const { signalQueue } = await import("@/lib/queue");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);
      (signalQueue.add as any).mockResolvedValueOnce({ id: "job-1" });

      const body = JSON.stringify(basePayload);
      const secret = "webhook-secret";
      const validSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-api-key",
          "X-TC-Signature": validSignature,
        },
        body,
      });

      const response = await POST(request as any);

      expect(response.status).toBe(202);
    });
  });

  describe("Handles FLAG signal type", () => {
    it("should queue FLAG signal with correct type", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const { signalQueue } = await import("@/lib/queue");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);
      (signalQueue.add as any).mockResolvedValueOnce({ id: "job-1" });

      const payload = { ...basePayload, signalType: "FLAG" };
      const body = JSON.stringify(payload);
      const secret = "webhook-secret";
      const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-api-key",
          "X-TC-Signature": signature,
        },
        body,
      });

      await POST(request as any);

      expect(signalQueue.add).toHaveBeenCalledWith(
        "process-signal-flag",
        expect.objectContaining({
          signalType: "FLAG",
        }),
        expect.any(Object)
      );
    });
  });

  describe("Handles APPLAUD signal type", () => {
    it("should queue APPLAUD signal with correct type", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const { signalQueue } = await import("@/lib/queue");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);
      (signalQueue.add as any).mockResolvedValueOnce({ id: "job-1" });

      const payload = { ...basePayload, signalType: "APPLAUD" };
      const body = JSON.stringify(payload);
      const secret = "webhook-secret";
      const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-api-key",
          "X-TC-Signature": signature,
        },
        body,
      });

      await POST(request as any);

      expect(signalQueue.add).toHaveBeenCalledWith(
        "process-signal-applaud",
        expect.objectContaining({
          signalType: "APPLAUD",
        }),
        expect.any(Object)
      );
    });
  });

  describe("Handles optional fields", () => {
    it("should accept signal with optional note and noteLanguage", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");
      const { signalQueue } = await import("@/lib/queue");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(mockCity);
      (signalQueue.add as any).mockResolvedValueOnce({ id: "job-1" });

      const payload = {
        ...basePayload,
        note: "This is concerning",
        noteLanguage: "es",
      };
      const body = JSON.stringify(payload);
      const secret = "webhook-secret";
      const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-api-key",
          "X-TC-Signature": signature,
        },
        body,
      });

      const response = await POST(request as any);

      expect(response.status).toBe(202);
    });
  });

  describe("Handles city not found", () => {
    it("should return 404 when city slug not found", async () => {
      const { rateLimit } = await import("@/lib/rate-limit");

      (rateLimit as any).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        resetAt: new Date(),
      });

      (prisma.city.findUnique as any).mockResolvedValueOnce(null);

      const body = JSON.stringify(basePayload);
      const signature = "test-signature";

      const request = new Request("http://localhost/api/v1/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Api-Key": "valid-key",
          "X-TC-Signature": signature,
        },
        body,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("city_not_found");
    });
  });
});

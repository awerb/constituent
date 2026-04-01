import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  rateLimit,
  getClientIp,
  attachRateLimitHeaders,
} from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

vi.mock("@/lib/redis");

describe("Rate Limiter", () => {
  const mockRedis = {
    pipeline: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redis).pipeline.mockReturnValue(mockRedis as any);
  });

  describe("rateLimit - Basic Functionality", () => {
    it("should allow requests within limit", async () => {
      mockRedis.zremrangebyscore = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zadd = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zcard = vi.fn().mockReturnValue(mockRedis);
      mockRedis.expire = vi.fn().mockReturnValue(mockRedis);
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 3], [null]]);

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.success).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should block requests exceeding limit", async () => {
      mockRedis.zremrangebyscore = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zadd = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zcard = vi.fn().mockReturnValue(mockRedis);
      mockRedis.expire = vi.fn().mockReturnValue(mockRedis);
      // Count is 11, limit is 10
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 11], [null]]);

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.success).toBe(false);
    });

    it("should return correct remaining count", async () => {
      mockRedis.zremrangebyscore = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zadd = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zcard = vi.fn().mockReturnValue(mockRedis);
      mockRedis.expire = vi.fn().mockReturnValue(mockRedis);
      // Count is 5, limit is 10
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 5], [null]]);

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.remaining).toBe(5);
    });

    it("should reset remaining to 0 when limit exceeded", async () => {
      mockRedis.zremrangebyscore = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zadd = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zcard = vi.fn().mockReturnValue(mockRedis);
      mockRedis.expire = vi.fn().mockReturnValue(mockRedis);
      // Count is 15, limit is 10
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 15], [null]]);

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.remaining).toBe(0);
    });

    it("should return correct limit", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 3], [null]]);

      const result = await rateLimit("192.168.1.1", 100, 60000);

      expect(result.limit).toBe(100);
    });

    it("should return resetAt date", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 3], [null]]);

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("rateLimit - Multiple IPs", () => {
    it("should track different IPs independently", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValueOnce([[null], [null], [null, 3], [null]])
        .mockResolvedValueOnce([[null], [null], [null, 7], [null]]);

      const result1 = await rateLimit("192.168.1.1", 10, 60000);
      const result2 = await rateLimit("192.168.1.2", 10, 60000);

      expect(result1.remaining).not.toEqual(result2.remaining);
    });

    it("should use correct key format for Redis", async () => {
      mockRedis.zremrangebyscore = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zadd = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zcard = vi.fn().mockReturnValue(mockRedis);
      mockRedis.expire = vi.fn().mockReturnValue(mockRedis);
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 1], [null]]);

      await rateLimit("192.168.1.100", 10, 60000);

      expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
    });
  });

  describe("rateLimit - Sliding Window", () => {
    it("should work with sliding window (not fixed window)", async () => {
      mockRedis.zremrangebyscore = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zadd = vi.fn().mockReturnValue(mockRedis);
      mockRedis.zcard = vi.fn().mockReturnValue(mockRedis);
      mockRedis.expire = vi.fn().mockReturnValue(mockRedis);
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 2], [null]]);

      const result = await rateLimit("192.168.1.1", 5, 1000);

      expect(result.success).toBe(true);
      // Sliding window removes old entries
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
    });
  });

  describe("rateLimit - Concurrent Requests", () => {
    it("should handle concurrent requests correctly", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 3], [null]]);

      const promises = [
        rateLimit("192.168.1.1", 10, 60000),
        rateLimit("192.168.1.1", 10, 60000),
        rateLimit("192.168.1.1", 10, 60000),
      ];

      const results = await Promise.all(promises);

      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe("rateLimit - Fallback to In-Memory", () => {
    it("should fallback to in-memory store when Redis unavailable", async () => {
      vi.mocked(redis).pipeline.mockImplementation(() => {
        throw new Error("Redis connection failed");
      });

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("should allow requests within limit using in-memory store", async () => {
      vi.mocked(redis).pipeline.mockImplementation(() => {
        throw new Error("Redis unavailable");
      });

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should block requests exceeding limit using in-memory store", async () => {
      vi.mocked(redis).pipeline.mockImplementation(() => {
        throw new Error("Redis unavailable");
      });

      const results = await Promise.all([
        ...Array(11).keys(),
      ].map(() => rateLimit("192.168.1.1", 10, 60000)));

      expect(results[10].success).toBe(false);
    });

    it("should track different IPs in in-memory store", async () => {
      vi.mocked(redis).pipeline.mockImplementation(() => {
        throw new Error("Redis unavailable");
      });

      const result1 = await rateLimit("192.168.1.1", 10, 60000);
      const result2 = await rateLimit("192.168.1.2", 10, 60000);

      expect(result1.remaining).not.toEqual(result2.remaining);
    });

    it("should cleanup old entries from in-memory store", async () => {
      vi.mocked(redis).pipeline.mockImplementation(() => {
        throw new Error("Redis unavailable");
      });

      // Call rate limit with past reset time to trigger cleanup
      await rateLimit("192.168.1.1", 10, 1);

      // Wait a bit for window to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await rateLimit("192.168.1.1", 10, 60000);

      expect(result.success).toBe(true);
    });
  });

  describe("getClientIp - IP Extraction", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "203.0.113.1, 198.51.100.1",
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe("203.0.113.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-real-ip": "203.0.113.2",
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe("203.0.113.2");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "203.0.113.1",
          "x-real-ip": "203.0.113.2",
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe("203.0.113.1");
    });

    it("should handle multiple IPs in x-forwarded-for", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "203.0.113.1, 198.51.100.1, 192.0.2.1",
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe("203.0.113.1");
    });

    it("should trim whitespace from extracted IP", () => {
      const request = new Request("http://example.com", {
        headers: {
          "x-forwarded-for": "  203.0.113.1  , 198.51.100.1",
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe("203.0.113.1");
    });

    it("should fallback to 127.0.0.1 for local development", () => {
      const request = new Request("http://example.com", {
        headers: {},
      });

      const ip = getClientIp(request);

      expect(ip).toBe("127.0.0.1");
    });
  });

  describe("attachRateLimitHeaders - Header Attachment", () => {
    it("should attach rate limit headers to response", () => {
      const response = new Response("OK");
      const result = {
        success: true,
        limit: 100,
        remaining: 95,
        resetAt: new Date(Date.now() + 60000),
      };

      attachRateLimitHeaders(response, result);

      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("95");
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
    });

    it("should set correct limit header", () => {
      const response = new Response("OK");
      const result = {
        success: true,
        limit: 500,
        remaining: 450,
        resetAt: new Date(),
      };

      attachRateLimitHeaders(response, result);

      expect(response.headers.get("X-RateLimit-Limit")).toBe("500");
    });

    it("should set correct remaining header", () => {
      const response = new Response("OK");
      const result = {
        success: true,
        limit: 100,
        remaining: 5,
        resetAt: new Date(),
      };

      attachRateLimitHeaders(response, result);

      expect(response.headers.get("X-RateLimit-Remaining")).toBe("5");
    });

    it("should set ISO 8601 reset timestamp", () => {
      const response = new Response("OK");
      const resetTime = new Date("2024-01-15T14:00:00Z");
      const result = {
        success: true,
        limit: 100,
        remaining: 90,
        resetAt: resetTime,
      };

      attachRateLimitHeaders(response, result);

      const resetHeader = response.headers.get("X-RateLimit-Reset");
      expect(resetHeader).toBe(resetTime.toISOString());
    });

    it("should handle zero remaining", () => {
      const response = new Response("OK");
      const result = {
        success: false,
        limit: 10,
        remaining: 0,
        resetAt: new Date(),
      };

      attachRateLimitHeaders(response, result);

      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("Rate Limit Windows", () => {
    it("should work with different window sizes", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 1], [null]]);

      const result1 = await rateLimit("192.168.1.1", 100, 1000);
      const result2 = await rateLimit("192.168.1.2", 100, 3600000);

      expect(result1.resetAt.getTime() - Date.now()).toBeLessThan(2000);
      expect(result2.resetAt.getTime() - Date.now()).toBeGreaterThan(3600000 - 1000);
    });
  });

  describe("Rate Limit Edge Cases", () => {
    it("should handle limit of 1", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValueOnce([[null], [null], [null, 1], [null]])
        .mockResolvedValueOnce([[null], [null], [null, 2], [null]]);

      const result1 = await rateLimit("192.168.1.1", 1, 60000);
      const result2 = await rateLimit("192.168.1.1", 1, 60000);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
    });

    it("should handle large limits", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 1000], [null]]);

      const result = await rateLimit("192.168.1.1", 1000000, 60000);

      expect(result.limit).toBe(1000000);
      expect(result.success).toBe(true);
    });

    it("should handle very short time windows", async () => {
      mockRedis.exec = vi
        .fn()
        .mockResolvedValue([[null], [null], [null, 1], [null]]);

      const result = await rateLimit("192.168.1.1", 10, 100);

      expect(result.resetAt.getTime() - Date.now()).toBeLessThan(200);
    });
  });
});

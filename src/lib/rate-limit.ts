import { redis } from "@/lib/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limiter using sliding window algorithm with Redis
 * Falls back to in-memory Map if Redis is unavailable
 */
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `rate-limit:${ip}`;
  const windowStart = now - windowMs;

  try {
    // Try Redis first
    const pipeline = redis.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, "-inf", windowStart);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Get count in window
    pipeline.zcard(key);

    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000) + 1);

    const results = await pipeline.exec();

    if (!results) throw new Error("Pipeline failed");

    const count = results[2]?.[1] as number;
    const remaining = Math.max(0, limit - count);
    const resetAt = new Date(now + windowMs);

    return {
      success: count <= limit,
      limit,
      remaining,
      resetAt,
    };
  } catch (error) {
    // Fallback to in-memory store
    console.warn("Redis unavailable, using in-memory rate limiter:", error);

    const entry = inMemoryStore.get(key);
    const now = Date.now();

    let count = 0;

    if (entry && entry.resetTime > now) {
      count = entry.count + 1;
    } else {
      count = 1;
    }

    const resetTime = now + windowMs;
    inMemoryStore.set(key, { count, resetTime });

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of inMemoryStore.entries()) {
        if (v.resetTime <= now) {
          inMemoryStore.delete(k);
        }
      }
    }

    const remaining = Math.max(0, limit - count);
    const resetAt = new Date(resetTime);

    return {
      success: count <= limit,
      limit,
      remaining,
      resetAt,
    };
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return "127.0.0.1";
}

/**
 * Attach rate limit headers to response
 */
export function attachRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): void {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());
}

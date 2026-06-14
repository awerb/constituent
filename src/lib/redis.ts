import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Returns the shared ioredis client instance.
 */
export function getRedisClient(): Redis {
  return redis;
}

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("reconnecting", () => {
  console.log("Redis reconnecting");
});

export default redis;

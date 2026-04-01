/**
 * AI Cost Tracker Service
 * Tracks AI usage to help cities control costs
 * Stores usage metrics in Redis with TTL of 35 days
 */

import { getRedisClient } from "@/lib/redis";
import { z } from "zod";

export interface UsageMetrics {
  draftsCount: number;
  estimatedCost: number;
  limitReached: boolean;
  limitRemaining: number;
  resetDate: Date;
}

/**
 * Track an AI draft usage
 */
export async function trackDraft(
  cityId: string,
  provider: "openai" | "anthropic",
  model: string,
  tokensUsed: number
): Promise<void> {
  try {
    const redis = getRedisClient();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Key: AI_USAGE:{cityId}:{YYYY-MM}
    const key = `AI_USAGE:${cityId}:${currentMonth}`;

    // Increment draft counter
    await redis.incr(key);

    // Set TTL to 35 days (ensures data persists through month transition)
    await redis.expire(key, 35 * 24 * 60 * 60);

    // Also log the draft in a history key for analytics
    const historyKey = `AI_USAGE_HISTORY:${cityId}`;
    const logEntry = {
      timestamp: now.toISOString(),
      provider,
      model,
      tokensUsed,
    };

    await redis.lpush(historyKey, JSON.stringify(logEntry));
    // Keep only last 1000 drafts in history
    await redis.ltrim(historyKey, 0, 999);
    await redis.expire(historyKey, 90 * 24 * 60 * 60); // 90 days

    console.log(`[AI Usage] ${cityId}: Tracked ${provider}/${model} draft`);
  } catch (error) {
    console.error("Error tracking AI draft:", error);
    // Don't fail the draft creation if tracking fails
  }
}

/**
 * Get monthly usage for a city
 */
export async function getMonthlyUsage(cityId: string): Promise<UsageMetrics> {
  try {
    const redis = getRedisClient();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const key = `AI_USAGE:${cityId}:${currentMonth}`;

    // Get current count
    const countStr = await redis.get(key);
    const draftsCount = countStr ? parseInt(countStr, 10) : 0;

    // Get monthly limit from environment
    const limitStr = process.env.AI_MONTHLY_DRAFT_LIMIT || "0";
    const monthlyLimit = parseInt(limitStr, 10);

    // Calculate costs and limits
    const costPerDraft = 0.01;
    const estimatedCost = draftsCount * costPerDraft;
    const limitReached = monthlyLimit > 0 && draftsCount >= monthlyLimit;
    const limitRemaining = monthlyLimit > 0 ? Math.max(0, monthlyLimit - draftsCount) : -1;

    // Calculate reset date (first day of next month)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      draftsCount,
      estimatedCost,
      limitReached,
      limitRemaining,
      resetDate,
    };
  } catch (error) {
    console.error("Error getting monthly usage:", error);
    return {
      draftsCount: 0,
      estimatedCost: 0,
      limitReached: false,
      limitRemaining: -1,
      resetDate: new Date(),
    };
  }
}

/**
 * Check if city has exceeded monthly limit
 */
export async function checkLimit(cityId: string): Promise<boolean> {
  try {
    const usage = await getMonthlyUsage(cityId);
    return !usage.limitReached;
  } catch (error) {
    console.error("Error checking AI limit:", error);
    // If we can't check, allow the draft (fail open for safety)
    return true;
  }
}

/**
 * Get usage history for a city (last N entries)
 */
export async function getUsageHistory(cityId: string, limit: number = 100) {
  try {
    const redis = getRedisClient();
    const historyKey = `AI_USAGE_HISTORY:${cityId}`;

    const history = await redis.lrange(historyKey, 0, limit - 1);

    return history.map((entry) => {
      try {
        return JSON.parse(entry);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error("Error getting usage history:", error);
    return [];
  }
}

/**
 * Reset usage counter for a city (for testing or manual adjustment)
 */
export async function resetUsage(cityId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const key = `AI_USAGE:${cityId}:${currentMonth}`;

    await redis.del(key);
    console.log(`[AI Usage] Reset usage for ${cityId}`);
  } catch (error) {
    console.error("Error resetting usage:", error);
  }
}

/**
 * Get usage across all cities (admin only)
 */
export async function getAllCitiesUsage(): Promise<Record<string, UsageMetrics>> {
  try {
    const redis = getRedisClient();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const pattern = `AI_USAGE:*:${currentMonth}`;

    // Note: This uses KEYS which is not ideal for production
    // In production, consider maintaining a separate index
    const keys = await redis.keys(pattern);

    const results: Record<string, UsageMetrics> = {};

    for (const key of keys) {
      // Extract cityId from key format: AI_USAGE:{cityId}:{YYYY-MM}
      const parts = key.split(":");
      if (parts.length === 3) {
        const cityId = parts[1];
        const usage = await getMonthlyUsage(cityId);
        results[cityId] = usage;
      }
    }

    return results;
  } catch (error) {
    console.error("Error getting all cities usage:", error);
    return {};
  }
}

/**
 * Validate a draft request against city limits
 * Returns { allowed: boolean, reason?: string }
 */
export async function validateDraftRequest(cityId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const usage = await getMonthlyUsage(cityId);

    if (usage.limitReached) {
      return {
        allowed: false,
        reason: `Monthly AI draft limit reached (${usage.draftsCount}/${usage.limitRemaining + usage.draftsCount}). Resets on ${usage.resetDate.toLocaleDateString()}.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error validating draft request:", error);
    // Fail open - allow draft if validation fails
    return { allowed: true };
  }
}

/**
 * Get cost summary for billing/reporting
 */
export async function getCostSummary(cityId: string, months: number = 12) {
  try {
    const redis = getRedisClient();
    const results: Array<{
      month: string;
      drafts: number;
      cost: number;
    }> = [];

    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const key = `AI_USAGE:${cityId}:${month}`;

      const countStr = await redis.get(key);
      const drafts = countStr ? parseInt(countStr, 10) : 0;
      const cost = drafts * 0.01;

      results.push({
        month,
        drafts,
        cost,
      });
    }

    // Calculate totals
    const totalDrafts = results.reduce((sum, m) => sum + m.drafts, 0);
    const totalCost = results.reduce((sum, m) => sum + m.cost, 0);
    const avgDraftsPerMonth = totalDrafts / months;
    const avgCostPerMonth = totalCost / months;

    return {
      months: results,
      summary: {
        totalDrafts,
        totalCost,
        avgDraftsPerMonth,
        avgCostPerMonth,
      },
    };
  } catch (error) {
    console.error("Error getting cost summary:", error);
    return {
      months: [],
      summary: {
        totalDrafts: 0,
        totalCost: 0,
        avgDraftsPerMonth: 0,
        avgCostPerMonth: 0,
      },
    };
  }
}

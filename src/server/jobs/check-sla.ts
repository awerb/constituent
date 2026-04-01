import { checkAllSlas } from "@/server/services/sla-monitor";
import { createWorker } from "@/lib/queue";

export interface CheckSlaJobData {
  // SLA check is a scheduled job with minimal data
  cityId?: string; // Optional: check specific city, otherwise all cities
}

/**
 * Worker for SLA check jobs from the slaCheckQueue
 * Runs periodically (every 15 minutes) to check for SLA violations
 * Sends notifications for breaches and warnings
 */
export function createCheckSlaWorker() {
  return createWorker<CheckSlaJobData>(
    "sla-check",
    async (job) => {
      const startTime = Date.now();

      try {
        console.log(
          `[SLA WORKER] Starting SLA check job ${job.id}${job.data.cityId ? ` for city ${job.data.cityId}` : ""}`
        );

        await checkAllSlas(job.data.cityId);

        const duration = Date.now() - startTime;

        console.log(
          `[SLA WORKER] Completed SLA check job ${job.id} in ${duration}ms`
        );

        return {
          success: true,
          jobId: job.id,
          completedAt: new Date().toISOString(),
          durationMs: duration,
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        console.error(
          `[SLA WORKER] Failed to complete SLA check job ${job.id} after ${duration}ms:`,
          error
        );

        // Log detailed error information
        if (error instanceof Error) {
          console.error(
            `[SLA WORKER] Error details: ${error.message}`,
            error.stack
          );
        }

        throw new Error(
          `SLA check failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    {
      settings: {
        lockDuration: 300000, // 5 minute lock for SLA check
        lockRenewTime: 150000, // Renew every 2.5 minutes
      },
    }
  );
}

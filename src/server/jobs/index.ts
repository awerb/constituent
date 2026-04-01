import { slaCheckQueue } from "@/lib/queue";
import { createSendEmailWorker } from "./send-email";
import { createProcessSignalWorker } from "./process-signal";
import { createCheckSlaWorker } from "./check-sla";
import { createDispatchWebhookWorker } from "./dispatch-webhook";
import { createProcessPrivacyWorker } from "./process-privacy";
import { createGenerateReportWorker } from "./generate-report";

/**
 * Start all background job workers
 * Initializes workers for all queues and sets up graceful shutdown
 */
export async function startWorkers(): Promise<void> {
  try {
    console.log("[WORKERS] Starting all background job workers...");

    // Create all workers
    const sendEmailWorker = createSendEmailWorker();
    const processSignalWorker = createProcessSignalWorker();
    const checkSlaWorker = createCheckSlaWorker();
    const dispatchWebhookWorker = createDispatchWebhookWorker();
    const processPrivacyWorker = createProcessPrivacyWorker();
    const generateReportWorker = createGenerateReportWorker();

    console.log("[WORKERS] All workers created successfully");

    // Register the SLA check as a repeatable job (every 15 minutes)
    try {
      // Remove any existing SLA check jobs first
      const existingJobs = await slaCheckQueue.getRepeatableJobs();
      for (const job of existingJobs) {
        if (job.name === "sla-check") {
          await slaCheckQueue.removeRepeatableByKey(job.key);
        }
      }

      // Add new repeatable job for SLA checks every 15 minutes
      await slaCheckQueue.add(
        "sla-check",
        {}, // No specific data needed, checks all cities
        {
          repeat: {
            pattern: "*/15 * * * *", // Every 15 minutes
          },
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      console.log(
        "[WORKERS] Registered SLA check as repeatable job (every 15 minutes)"
      );
    } catch (error) {
      console.error("[WORKERS] Failed to register SLA check repeatable job:", error);
      // Don't throw - workers can still run, just won't have scheduled SLA checks
    }

    // Set up graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[WORKERS] Received ${signal}, initiating graceful shutdown...`);

      try {
        // Stop accepting new jobs
        await Promise.all([
          sendEmailWorker.close(),
          processSignalWorker.close(),
          checkSlaWorker.close(),
          dispatchWebhookWorker.close(),
          processPrivacyWorker.close(),
          generateReportWorker.close(),
        ]);

        console.log("[WORKERS] All workers closed gracefully");
        process.exit(0);
      } catch (error) {
        console.error("[WORKERS] Error during graceful shutdown:", error);
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    console.log("[WORKERS] Graceful shutdown handlers registered");
    console.log("[WORKERS] All background job workers started successfully");

    // Export workers for testing/monitoring
    return {
      sendEmailWorker,
      processSignalWorker,
      checkSlaWorker,
      dispatchWebhookWorker,
      processPrivacyWorker,
      generateReportWorker,
    } as any;
  } catch (error) {
    console.error("[WORKERS] Failed to start workers:", error);
    process.exit(1);
  }
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  try {
    console.log("[WORKERS] Stopping all workers...");
    // Workers will be closed by signal handlers
  } catch (error) {
    console.error("[WORKERS] Error stopping workers:", error);
    throw error;
  }
}

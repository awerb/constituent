import { processSignal, type ProcessSignalInput } from "@/server/services/signal-processor";
import { createWorker } from "@/lib/queue";

/**
 * Worker for processing newsletter signal jobs from the signalQueue
 * Handles FLAG and APPLAUD signals, creates cases, and sends notifications
 */
export function createProcessSignalWorker() {
  return createWorker<ProcessSignalInput>(
    "signal",
    async (job) => {
      try {
        console.log(
          `[SIGNAL WORKER] Processing signal job ${job.id}: ${job.data.signalType}`
        );

        const result = await processSignal(job.data);

        console.log(
          `[SIGNAL WORKER] Successfully processed signal job ${job.id}:`,
          {
            status: result.status,
            signalId: result.signalId,
            caseId: result.caseId,
            referenceNumber: result.referenceNumber,
          }
        );

        return {
          success: true,
          jobId: job.id,
          ...result,
          processedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error(
          `[SIGNAL WORKER] Failed to process signal job ${job.id}:`,
          error
        );

        // Log detailed error information
        if (error instanceof Error) {
          console.error(
            `[SIGNAL WORKER] Error details: ${error.message}`,
            error.stack
          );
        }

        // Include context in error for debugging
        console.error(`[SIGNAL WORKER] Job data:`, {
          signalType: job.data.signalType,
          newsletterExternalId: job.data.newsletterExternalId,
          constituentEmail: job.data.constituentEmail,
        });

        throw new Error(
          `Failed to process ${job.data.signalType} signal: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    {
      settings: {
        lockDuration: 120000, // 120 second lock for complex signal processing
        lockRenewTime: 60000,
      },
    }
  );
}

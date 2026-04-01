import { processWebhookDelivery } from "@/server/services/webhook-dispatcher";
import { createWorker } from "@/lib/queue";

export interface DispatchWebhookJobData {
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  signature: string;
}

/**
 * Worker for webhook delivery jobs from the webhookQueue
 * Handles HTTP delivery to configured webhooks with exponential backoff retries
 * Configures 3 retry attempts with exponential backoff
 */
export function createDispatchWebhookWorker() {
  return createWorker<DispatchWebhookJobData>(
    "webhook",
    async (job) => {
      const { webhookId, event, payload, signature } = job.data;

      try {
        console.log(
          `[WEBHOOK WORKER] Processing webhook delivery job ${job.id} to webhook ${webhookId}`
        );

        await processWebhookDelivery(webhookId, event, payload, signature, job.attemptsMade + 1);

        console.log(
          `[WEBHOOK WORKER] Successfully delivered webhook job ${job.id} for event ${event}`
        );

        return {
          success: true,
          jobId: job.id,
          webhookId,
          event,
          deliveredAt: new Date().toISOString(),
          attempt: job.attemptsMade + 1,
        };
      } catch (error) {
        console.error(
          `[WEBHOOK WORKER] Failed to deliver webhook job ${job.id} (attempt ${job.attemptsMade + 1}):`,
          error
        );

        // Log detailed error information
        if (error instanceof Error) {
          console.error(
            `[WEBHOOK WORKER] Error details: ${error.message}`,
            error.stack
          );
        }

        // Log context for debugging
        console.error(`[WEBHOOK WORKER] Job context:`, {
          webhookId,
          event,
          attempt: job.attemptsMade + 1,
          maxAttempts: 3,
        });

        throw new Error(
          `Failed to deliver webhook to ${webhookId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    {
      settings: {
        lockDuration: 60000, // 60 second lock for webhook delivery
        lockRenewTime: 30000,
      },
    }
  );
}

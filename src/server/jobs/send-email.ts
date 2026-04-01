import { sendEmail } from "@/server/services/email-sender";
import { createWorker } from "@/lib/queue";

export interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Worker for processing email jobs from the emailQueue
 * Handles email sending with error logging and retries
 */
export function createSendEmailWorker() {
  return createWorker<SendEmailJobData>(
    "email",
    async (job) => {
      const { to, subject, html, text, from, replyTo } = job.data;

      try {
        console.log(`[EMAIL WORKER] Processing email job ${job.id} to ${to}`);

        await sendEmail({
          to,
          subject,
          html,
          text,
          from,
          replyTo,
        });

        console.log(
          `[EMAIL WORKER] Successfully sent email job ${job.id} to ${to}`
        );

        return {
          success: true,
          jobId: job.id,
          recipient: to,
          sentAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error(
          `[EMAIL WORKER] Failed to send email job ${job.id} to ${to}:`,
          error
        );

        // Log detailed error information for debugging
        if (error instanceof Error) {
          console.error(
            `[EMAIL WORKER] Error details: ${error.message}`,
            error.stack
          );
        }

        // Rethrow to trigger BullMQ retry mechanism
        throw new Error(
          `Failed to send email to ${to}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    {
      settings: {
        lockDuration: 60000, // 60 second lock for email sending
        lockRenewTime: 30000,
      },
    }
  );
}

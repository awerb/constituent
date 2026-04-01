import { processExportRequest, processDeletionRequest } from "@/server/services/privacy";
import { sendEmail } from "@/server/services/email-sender";
import { emailQueue } from "@/lib/queue";
import { prisma } from "@/lib/db";
import { createWorker } from "@/lib/queue";

export interface ProcessPrivacyJobData {
  constituentId: string;
  requestType: "export" | "deletion";
  requesterEmail?: string;
}

/**
 * Worker for privacy request jobs from the privacyQueue
 * Handles data export (GDPR right to access) and deletion (right to be forgotten) requests
 * Sends confirmation emails to constituents
 */
export function createProcessPrivacyWorker() {
  return createWorker<ProcessPrivacyJobData>(
    "privacy",
    async (job) => {
      const { constituentId, requestType, requesterEmail } = job.data;

      try {
        console.log(
          `[PRIVACY WORKER] Processing ${requestType} request for constituent ${constituentId}`
        );

        if (requestType === "export") {
          return await handleExportRequest(constituentId, requesterEmail, job.id);
        } else if (requestType === "deletion") {
          return await handleDeletionRequest(constituentId, requesterEmail, job.id);
        } else {
          throw new Error(`Unknown privacy request type: ${requestType}`);
        }
      } catch (error) {
        console.error(
          `[PRIVACY WORKER] Failed to process privacy request job ${job.id}:`,
          error
        );

        if (error instanceof Error) {
          console.error(
            `[PRIVACY WORKER] Error details: ${error.message}`,
            error.stack
          );
        }

        console.error(`[PRIVACY WORKER] Job context:`, {
          constituentId,
          requestType,
          jobId: job.id,
        });

        throw new Error(
          `Failed to process ${requestType} request: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    {
      settings: {
        lockDuration: 300000, // 5 minute lock for privacy requests
        lockRenewTime: 150000,
      },
    }
  );
}

/**
 * Handle export request - generates data export and queues email
 */
async function handleExportRequest(
  constituentId: string,
  requesterEmail: string | undefined,
  jobId: string
): Promise<any> {
  try {
    console.log(`[PRIVACY WORKER] Handling export request for ${constituentId}`);

    // Process the export request
    const exportResult = await processExportRequest(constituentId);

    // Get constituent email for sending export
    const constituent = await prisma.constituent.findUniqueOrThrow({
      where: { id: constituentId },
    });

    const emailAddress = requesterEmail || constituent.email;

    console.log(
      `[PRIVACY WORKER] Export completed for ${constituentId}, queueing email to ${emailAddress}`
    );

    // Queue email with export data
    await emailQueue.add(
      "send",
      {
        to: emailAddress,
        subject: "Your Data Export Request - Constituent Response System",
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear Constituent,</p>

  <p>Your data export request has been processed successfully. Please see the attached JSON file containing your complete data export.</p>

  <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <p><strong>Export Date:</strong> ${new Date().toISOString()}</p>
    <p><strong>Export File:</strong> ${exportResult.fileName}</p>
  </div>

  <p>This export includes:</p>
  <ul>
    <li>Your personal information</li>
    <li>All cases and case messages</li>
    <li>Newsletter signals and interactions</li>
    <li>Metadata about your account</li>
  </ul>

  <p>If you have any questions about this export, please contact our support team.</p>

  <p>Sincerely,<br/>
  City Government Constituent Response System</p>
</div>`,
        text: `Your data export request has been processed successfully. The export file is attached. Export Date: ${new Date().toISOString()}`,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      }
    );

    console.log(
      `[PRIVACY WORKER] Export email queued for job ${jobId} to ${emailAddress}`
    );

    return {
      success: true,
      jobId,
      constituentId,
      requestType: "export",
      exportFileName: exportResult.fileName,
      emailQueued: true,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[PRIVACY WORKER] Error handling export request for ${constituentId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle deletion request - anonymizes constituent and queues confirmation email
 */
async function handleDeletionRequest(
  constituentId: string,
  requesterEmail: string | undefined,
  jobId: string
): Promise<any> {
  try {
    console.log(`[PRIVACY WORKER] Handling deletion request for ${constituentId}`);

    // Process the deletion request
    const deletionResult = await processDeletionRequest(constituentId);

    // Get constituent email before full anonymization
    const constituent = await prisma.constituent.findUniqueOrThrow({
      where: { id: constituentId },
    });

    const emailAddress = requesterEmail || constituent.email;

    console.log(
      `[PRIVACY WORKER] Deletion completed for ${constituentId}, queueing confirmation email`
    );

    // Queue confirmation email
    await emailQueue.add(
      "send",
      {
        to: emailAddress,
        subject: "Your Data Deletion Request Confirmed - Constituent Response System",
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear Constituent,</p>

  <p>Your data deletion request has been successfully processed. All personal information associated with your account has been anonymized.</p>

  <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <p><strong>Request Type:</strong> Right to be Forgotten (GDPR/Privacy)</p>
    <p><strong>Processing Date:</strong> ${deletionResult.completedAt.toISOString()}</p>
    <p><strong>Records Anonymized:</strong> ${deletionResult.recordsAnonymized}</p>
  </div>

  <p>What was anonymized:</p>
  <ul>
    <li>Name, email, phone, and address</li>
    <li>All personal messages and communications</li>
    <li>Account metadata</li>
  </ul>

  <p><strong>Note:</strong> Case information is preserved for record-keeping and statistical purposes, but all personally identifiable information has been removed.</p>

  <p>If you have any questions, please contact our privacy team.</p>

  <p>Sincerely,<br/>
  City Government Constituent Response System</p>
</div>`,
        text: `Your data deletion request has been successfully processed. All personal information has been anonymized. Processing Date: ${deletionResult.completedAt.toISOString()}. Records Anonymized: ${deletionResult.recordsAnonymized}`,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      }
    );

    console.log(
      `[PRIVACY WORKER] Deletion confirmation email queued for job ${jobId}`
    );

    return {
      success: true,
      jobId,
      constituentId,
      requestType: "deletion",
      ...deletionResult,
      emailQueued: true,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[PRIVACY WORKER] Error handling deletion request for ${constituentId}:`,
      error
    );
    throw error;
  }
}

import { exportAllData, exportFoia, type ExportOptions } from "@/server/services/export";
import { sendEmail } from "@/server/services/email-sender";
import { emailQueue } from "@/lib/queue";
import { prisma } from "@/lib/db";
import { createWorker } from "@/lib/queue";
import { promises as fs } from "fs";

export interface GenerateReportJobData {
  cityId: string;
  reportType: "full" | "foia";
  filters?: {
    dateStart?: string;
    dateEnd?: string;
    departmentId?: string;
    includeInternalNotes?: boolean;
  };
  requestedById: string; // User ID who requested the report
  recipientEmail?: string; // Optional override for email recipient
}

/**
 * Worker for report generation jobs from the reportQueue
 * Generates CSV/ZIP exports and sends download links via email
 */
export function createGenerateReportWorker() {
  return createWorker<GenerateReportJobData>(
    "report",
    async (job) => {
      const { cityId, reportType, filters, requestedById, recipientEmail } = job.data;

      try {
        console.log(
          `[REPORT WORKER] Generating ${reportType} report for city ${cityId}`
        );

        const zipPath = await generateReportFile(cityId, reportType, filters);

        console.log(
          `[REPORT WORKER] Report generated: ${zipPath}, queueing email notification`
        );

        // Get file size for email
        const fileStats = await fs.stat(zipPath);
        const fileSizeKb = Math.round(fileStats.size / 1024);

        // Get requester info for email
        const requester = await prisma.user.findUniqueOrThrow({
          where: { id: requestedById },
        });

        // Determine recipient email
        const emailAddress = recipientEmail || requester.email;

        // Queue email with download link
        await emailQueue.add(
          "send",
          {
            to: emailAddress,
            subject: `Your ${reportType.toUpperCase()} Report is Ready - ${cityId}`,
            html: buildReportEmailHtml(reportType, cityId, fileSizeKb),
            text: `Your ${reportType.toUpperCase()} report for ${cityId} has been generated and is ready for download. File size: ${fileSizeKb}KB. Download your report from the system.`,
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
          `[REPORT WORKER] Report email queued for job ${job.id} to ${emailAddress}`
        );

        return {
          success: true,
          jobId: job.id,
          cityId,
          reportType,
          zipPath,
          fileSizeKb,
          emailQueued: true,
          requestedBy: requester.email,
          generatedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error(
          `[REPORT WORKER] Failed to generate report job ${job.id}:`,
          error
        );

        if (error instanceof Error) {
          console.error(
            `[REPORT WORKER] Error details: ${error.message}`,
            error.stack
          );
        }

        console.error(`[REPORT WORKER] Job context:`, {
          cityId,
          reportType,
          requestedById,
          jobId: job.id,
        });

        throw new Error(
          `Failed to generate ${reportType} report: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    {
      settings: {
        lockDuration: 600000, // 10 minute lock for report generation (can be long)
        lockRenewTime: 300000, // Renew every 5 minutes
      },
    }
  );
}

/**
 * Generate the actual report file (ZIP)
 */
async function generateReportFile(
  cityId: string,
  reportType: string,
  filters?: GenerateReportJobData["filters"]
): Promise<string> {
  try {
    if (reportType === "full") {
      console.log(`[REPORT WORKER] Generating full export for ${cityId}`);
      return await exportAllData(cityId);
    } else if (reportType === "foia") {
      console.log(`[REPORT WORKER] Generating FOIA export for ${cityId}`);

      const exportOptions: ExportOptions = {};

      if (filters?.dateStart && filters?.dateEnd) {
        exportOptions.dateRange = {
          start: new Date(filters.dateStart),
          end: new Date(filters.dateEnd),
        };
      }

      if (filters?.departmentId) {
        exportOptions.departmentId = filters.departmentId;
      }

      if (filters?.includeInternalNotes !== undefined) {
        exportOptions.includeInternalNotes = filters.includeInternalNotes;
      }

      return await exportFoia(cityId, exportOptions);
    } else {
      throw new Error(`Unknown report type: ${reportType}`);
    }
  } catch (error) {
    console.error(`[REPORT WORKER] Error generating report file:`, error);
    throw error;
  }
}

/**
 * Build HTML email content for report notification
 */
function buildReportEmailHtml(
  reportType: string,
  cityId: string,
  fileSizeKb: number
): string {
  const reportTitle = reportType === "full" ? "Full Data Export" : "FOIA Export";

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear Administrator,</p>

  <p>Your requested ${reportTitle} report has been generated and is ready for download.</p>

  <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <p><strong>Report Type:</strong> ${reportTitle}</p>
    <p><strong>City:</strong> ${cityId}</p>
    <p><strong>File Size:</strong> ${fileSizeKb}KB</p>
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
  </div>

  <p>The report file has been prepared as a ZIP archive containing:</p>
  <ul>
    <li>CSV files for each data table</li>
    <li>README with export details and applied filters</li>
    ${
      reportType === "foia"
        ? "<li>Anonymized constituent information (emails redacted)</li>"
        : ""
    }
  </ul>

  <p>To download your report, log in to the system and navigate to the Reports section.</p>

  <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
    <strong>Important:</strong> Report files are temporary and will be automatically deleted after 30 days for security and storage purposes. Please download your report promptly.
  </p>

  <p>If you need any assistance or have questions about your report, please contact system administration.</p>

  <p>Sincerely,<br/>
  City Government Constituent Response System</p>
</div>`;
}

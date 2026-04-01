import { prisma } from "@/lib/db";
import { stringify } from "csv-stringify/sync";
import * as archiver from "archiver";
import { createWriteStream, promises as fs } from "fs";
import { resolve } from "path";

export interface ExportOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  departmentId?: string;
  includeInternalNotes?: boolean;
}

/**
 * Export all data for a city (for backup/migration purposes)
 * Returns path to ZIP file containing CSVs for all tables
 */
export async function exportAllData(cityId: string): Promise<string> {
  try {
    console.log(`Exporting all data for city ${cityId}`);

    const tmpDir = resolve("/tmp", `city-export-${cityId}-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    // Export each table
    await exportTable("cities", async () => {
      return [await prisma.city.findUniqueOrThrow({ where: { id: cityId } })];
    }, tmpDir);

    await exportTable("constituents", async () => {
      return await prisma.constituent.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("departments", async () => {
      return await prisma.department.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("users", async () => {
      return await prisma.user.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("cases", async () => {
      return await prisma.case.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("case_messages", async () => {
      return await prisma.caseMessage.findMany({
        where: {
          case: { cityId },
        },
      });
    }, tmpDir);

    await exportTable("newsletter_items", async () => {
      return await prisma.newsletterItem.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("newsletter_signals", async () => {
      return await prisma.newsletterSignal.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("templates", async () => {
      return await prisma.template.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("sla_configs", async () => {
      return await prisma.slaConfig.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("kb_articles", async () => {
      return await prisma.kbArticle.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("webhooks", async () => {
      return await prisma.webhook.findMany({ where: { cityId } });
    }, tmpDir);

    await exportTable("audit_logs", async () => {
      return await prisma.auditLog.findMany({ where: { cityId } });
    }, tmpDir);

    // Create ZIP archive
    const zipPath = resolve("/tmp", `city-export-${cityId}-${Date.now()}.zip`);
    await createZipArchive(tmpDir, zipPath);

    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true });

    console.log(`Export complete: ${zipPath}`);

    return zipPath;
  } catch (error) {
    console.error("Error exporting all data:", error);
    throw error;
  }
}

/**
 * Export FOIA-compliant data with filters
 * Supports date range, department, and internal notes filtering
 */
export async function exportFoia(
  cityId: string,
  options: ExportOptions
): Promise<string> {
  try {
    console.log(`Exporting FOIA data for city ${cityId}`);

    const tmpDir = resolve("/tmp", `foia-export-${cityId}-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    // Build case query with filters
    const caseWhere: any = {
      cityId,
    };

    if (options.dateRange) {
      caseWhere.createdAt = {
        gte: options.dateRange.start,
        lte: options.dateRange.end,
      };
    }

    if (options.departmentId) {
      caseWhere.departmentId = options.departmentId;
    }

    const cases = await prisma.case.findMany({
      where: caseWhere,
      include: {
        constituent: true,
        messages: true,
        department: true,
      },
    });

    // Export cases
    const caseData = cases.map((c) => ({
      "Reference Number": c.referenceNumber,
      "Constituent Name": c.constituent.name || "[REDACTED]",
      "Constituent Email": "[REDACTED]",
      "Created Date": c.createdAt.toISOString(),
      Subject: c.subject,
      Status: c.status,
      Priority: c.priority,
      Department: c.department.name,
      Description: c.description,
    }));

    await exportTableData("cases", caseData, tmpDir);

    // Export messages (filtering internal notes if requested)
    const messages = await prisma.caseMessage.findMany({
      where: {
        case: caseWhere,
        ...(options.includeInternalNotes === false && {
          isInternalNote: false,
        }),
      },
      include: {
        case: true,
      },
    });

    const messageData = messages.map((m) => ({
      "Case Reference": m.case.referenceNumber,
      "Author Type": m.authorType,
      Content: m.content,
      "Created Date": m.createdAt.toISOString(),
      "Is Internal": m.isInternalNote,
      "Public Records Excluded": m.isPublicRecordsExcluded,
    }));

    await exportTableData("messages", messageData, tmpDir);

    // Create README with export details
    const readme = `
# FOIA Export

**City:** ${cityId}
**Export Date:** ${new Date().toISOString()}
**Total Cases:** ${cases.length}
**Total Messages:** ${messages.length}

## Filters Applied

${options.dateRange ? `- **Date Range:** ${options.dateRange.start.toISOString()} to ${options.dateRange.end.toISOString()}` : ""}
${options.departmentId ? `- **Department:** ${options.departmentId}` : ""}
${options.includeInternalNotes === false ? "- **Internal Notes:** Excluded" : ""}

## Data Anonymization

- Constituent email addresses have been redacted for privacy
- Constituent names are retained as part of the public record
    `.trim();

    await fs.writeFile(resolve(tmpDir, "README.md"), readme);

    // Create ZIP archive
    const zipPath = resolve("/tmp", `foia-export-${cityId}-${Date.now()}.zip`);
    await createZipArchive(tmpDir, zipPath);

    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true });

    console.log(`FOIA export complete: ${zipPath}`);

    return zipPath;
  } catch (error) {
    console.error("Error exporting FOIA data:", error);
    throw error;
  }
}

/**
 * Export a single table to CSV
 */
async function exportTable(
  tableName: string,
  fetchFn: () => Promise<any[]>,
  tmpDir: string
): Promise<void> {
  try {
    const data = await fetchFn();

    if (data.length === 0) {
      console.log(`No data to export for table ${tableName}`);
      return;
    }

    await exportTableData(tableName, data, tmpDir);
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
  }
}

/**
 * Export data as CSV
 */
async function exportTableData(
  tableName: string,
  data: any[],
  tmpDir: string
): Promise<void> {
  try {
    const csv = stringify(data, {
      header: true,
      quoted: true,
    });

    const filePath = resolve(tmpDir, `${tableName}.csv`);
    await fs.writeFile(filePath, csv);

    console.log(`Exported ${data.length} records to ${tableName}.csv`);
  } catch (error) {
    console.error(`Error exporting table data for ${tableName}:`, error);
  }
}

/**
 * Create ZIP archive from directory
 */
async function createZipArchive(sourceDir: string, zipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver.default("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      console.log(`ZIP archive created: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", (error) => {
      console.error("Error creating ZIP archive:", error);
      reject(error);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Get export status/list
 */
export async function listExports(): Promise<any[]> {
  try {
    const exportsDir = "/tmp";
    const files = await fs.readdir(exportsDir);

    const exports = files
      .filter((f) => f.startsWith("city-export-") || f.startsWith("foia-export-"))
      .filter((f) => f.endsWith(".zip"));

    const exportList = await Promise.all(
      exports.map(async (file) => {
        const filePath = resolve(exportsDir, file);
        const stat = await fs.stat(filePath);

        return {
          filename: file,
          size: stat.size,
          createdAt: stat.mtime,
          path: filePath,
        };
      })
    );

    return exportList.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error listing exports:", error);
    return [];
  }
}

/**
 * Delete an old export file
 */
export async function deleteExport(filePath: string): Promise<void> {
  try {
    // Validate that path is in temp directory
    if (!filePath.startsWith("/tmp/")) {
      throw new Error("Invalid export file path");
    }

    await fs.unlink(filePath);
    console.log(`Deleted export: ${filePath}`);
  } catch (error) {
    console.error("Error deleting export:", error);
    throw error;
  }
}

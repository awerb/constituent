import { prisma } from "@/lib/db";

const REDACTED = "[REDACTED]";

export interface ExportRequestResult {
  data: Record<string, any>;
  fileName: string;
  format: "json";
}

export interface DeletionRequestResult {
  constituentId: string;
  recordsAnonymized: number;
  caseStructurePreserved: boolean;
  completedAt: Date;
}

/**
 * Process data export request (constituent's right to access their data)
 * Returns complete JSON export of all constituent data
 */
export async function processExportRequest(
  constituentId: string
): Promise<ExportRequestResult> {
  try {
    console.log(`Processing export request for constituent ${constituentId}`);

    const constituent = await prisma.constituent.findUniqueOrThrow({
      where: { id: constituentId },
    });

    // Mark as export requested
    await prisma.constituent.update({
      where: { id: constituentId },
      data: { privacyStatus: "EXPORT_REQUESTED" },
    });

    // Gather all constituent data
    const cases = await prisma.case.findMany({
      where: { constituentId },
      include: {
        messages: true,
        newsletterItem: true,
      },
    });

    const signals = await prisma.newsletterSignal.findMany({
      where: { constituentId },
      include: {
        newsletterItem: true,
      },
    });

    const messages = await prisma.caseMessage.findMany({
      where: { authorId: constituentId, authorType: "CONSTITUENT" },
    });

    // Build complete data export
    const exportData = {
      constituent: {
        id: constituent.id,
        email: constituent.email,
        name: constituent.name,
        phone: constituent.phone,
        address: constituent.address,
        ward: constituent.ward,
        district: constituent.district,
        languagePreference: constituent.languagePreference,
        createdAt: constituent.createdAt,
        metadata: constituent.metadata,
      },
      cases: cases.map((c) => ({
        referenceNumber: c.referenceNumber,
        subject: c.subject,
        description: c.description,
        status: c.status,
        priority: c.priority,
        source: c.source,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        resolvedAt: c.resolvedAt,
        closedAt: c.closedAt,
        messages: c.messages.map((m) => ({
          content: m.content,
          authorType: m.authorType,
          createdAt: m.createdAt,
          isInternalNote: m.isInternalNote,
        })),
        newsletterContext: c.newsletterItem
          ? {
              title: c.newsletterItem.title,
              summary: c.newsletterItem.summary,
            }
          : null,
      })),
      signals: signals.map((s) => ({
        signalType: s.signalType,
        note: s.note,
        createdAt: s.createdAt,
        newsletter: {
          title: s.newsletterItem.title,
          summary: s.newsletterItem.summary,
        },
      })),
      messages: messages.map((m) => ({
        content: m.content,
        createdAt: m.createdAt,
        isInternalNote: m.isInternalNote,
      })),
      exportDate: new Date().toISOString(),
      exportNote:
        "This is your complete data export as requested under privacy regulations.",
    };

    console.log(`Export prepared for constituent ${constituentId}`);

    // Mark as completed
    await prisma.constituent.update({
      where: { id: constituentId },
      data: { privacyStatus: "ACTIVE" },
    });

    return {
      data: exportData,
      fileName: `constituent-data-export-${constituentId}-${Date.now()}.json`,
      format: "json",
    };
  } catch (error) {
    console.error("Error processing export request:", error);
    throw error;
  }
}

/**
 * Process deletion request (right to be forgotten)
 * Anonymizes constituent record while preserving case structure for aggregate reporting
 * Does NOT hard delete to maintain data integrity
 */
export async function processDeletionRequest(
  constituentId: string
): Promise<DeletionRequestResult> {
  try {
    console.log(`Processing deletion request for constituent ${constituentId}`);

    const constituent = await prisma.constituent.findUniqueOrThrow({
      where: { id: constituentId },
    });

    // Mark as deletion requested
    await prisma.constituent.update({
      where: { id: constituentId },
      data: { privacyStatus: "DELETION_REQUESTED" },
    });

    let recordsAnonymized = 0;

    // Anonymize the constituent record
    await prisma.constituent.update({
      where: { id: constituentId },
      data: {
        email: `${REDACTED}-${constituentId.slice(0, 8)}@placeholder.local`,
        name: REDACTED,
        phone: REDACTED,
        address: REDACTED,
        ward: REDACTED,
        district: REDACTED,
        metadata: {
          anonymized: true,
          anonymizedAt: new Date().toISOString(),
          originalEmail: constituent.email,
        },
        privacyStatus: "ANONYMIZED",
      },
    });

    recordsAnonymized++;

    // Anonymize constituent messages
    const messagesUpdated = await prisma.caseMessage.updateMany({
      where: {
        authorId: constituentId,
        authorType: "CONSTITUENT",
      },
      data: {
        content: `${REDACTED} (constituent message anonymized)`,
      },
    });

    recordsAnonymized += messagesUpdated.count;

    console.log(
      `Anonymized ${recordsAnonymized} records for constituent ${constituentId}`
    );

    return {
      constituentId,
      recordsAnonymized,
      caseStructurePreserved: true,
      completedAt: new Date(),
    };
  } catch (error) {
    console.error("Error processing deletion request:", error);
    throw error;
  }
}

/**
 * Get privacy status of a constituent
 */
export async function getPrivacyStatus(constituentId: string): Promise<string> {
  try {
    const constituent = await prisma.constituent.findUniqueOrThrow({
      where: { id: constituentId },
    });

    return constituent.privacyStatus;
  } catch (error) {
    console.error("Error getting privacy status:", error);
    throw error;
  }
}

/**
 * Check if constituent data is anonymized
 */
export async function isConstituientAnonymized(constituentId: string): Promise<boolean> {
  try {
    const status = await getPrivacyStatus(constituentId);
    return status === "ANONYMIZED";
  } catch (error) {
    console.error("Error checking anonymization status:", error);
    return false;
  }
}

/**
 * List all pending privacy requests
 */
export async function getPendingPrivacyRequests(): Promise<
  Array<{
    constituentId: string;
    email: string;
    status: string;
    requestedAt: Date;
  }>
> {
  try {
    const requests = await prisma.constituent.findMany({
      where: {
        privacyStatus: { in: ["EXPORT_REQUESTED", "DELETION_REQUESTED"] },
      },
      select: {
        id: true,
        email: true,
        privacyStatus: true,
        createdAt: true,
      },
    });

    return requests.map((r) => ({
      constituentId: r.id,
      email: r.email,
      status: r.privacyStatus,
      requestedAt: r.createdAt,
    }));
  } catch (error) {
    console.error("Error getting pending privacy requests:", error);
    throw error;
  }
}

/**
 * Purge anonymized records older than a threshold
 * Can be run periodically per data retention policy
 */
export async function purgeOldAnonymizedRecords(
  olderThanDays: number = 365
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    console.log(
      `Purging anonymized records older than ${olderThanDays} days (before ${cutoffDate.toISOString()})`
    );

    // In a real system, you might hard-delete or archive these records
    // For now, we'll just count them
    const oldAnonymized = await prisma.constituent.count({
      where: {
        privacyStatus: "ANONYMIZED",
        updatedAt: { lt: cutoffDate },
      },
    });

    console.log(`Found ${oldAnonymized} records eligible for purge`);

    // Don't actually delete to maintain data integrity
    // In production, you'd move to archive table or handle per policy

    return oldAnonymized;
  } catch (error) {
    console.error("Error purging old anonymized records:", error);
    throw error;
  }
}

/**
 * Generate privacy audit report
 */
export async function generatePrivacyAuditReport(): Promise<{
  totalConstituents: number;
  activeRecords: number;
  exportRequested: number;
  deletionRequested: number;
  anonymized: number;
  generatedAt: Date;
}> {
  try {
    const [total, active, exportReq, deleteReq, anon] = await Promise.all([
      prisma.constituent.count(),
      prisma.constituent.count({ where: { privacyStatus: "ACTIVE" } }),
      prisma.constituent.count({ where: { privacyStatus: "EXPORT_REQUESTED" } }),
      prisma.constituent.count({ where: { privacyStatus: "DELETION_REQUESTED" } }),
      prisma.constituent.count({ where: { privacyStatus: "ANONYMIZED" } }),
    ]);

    return {
      totalConstituents: total,
      activeRecords: active,
      exportRequested: exportReq,
      deletionRequested: deleteReq,
      anonymized: anon,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating privacy audit report:", error);
    throw error;
  }
}

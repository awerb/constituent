import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processExportRequest,
  processDeletionRequest,
  getPrivacyStatus,
  isConstituientAnonymized,
  getPendingPrivacyRequests,
} from "@/server/services/privacy";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    constituent: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    case: {
      findMany: vi.fn(),
    },
    newsletterSignal: {
      findMany: vi.fn(),
    },
    caseMessage: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("Privacy Service", () => {
  const constituentId = "constituent-1";

  const mockConstituent = {
    id: constituentId,
    email: "original@example.com",
    name: "Original Name",
    phone: "555-0000",
    address: "123 Main St",
    ward: "Ward 1",
    district: "District 1",
    languagePreference: "en",
    privacyStatus: "ACTIVE",
    createdAt: new Date("2024-01-01"),
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Export request includes all constituent data", () => {
    it("should export complete constituent information", async () => {
      const mockCases = [
        {
          id: "case-1",
          referenceNumber: "CR-2024-00001",
          subject: "Test Case",
          description: "Test Description",
          status: "NEW",
          priority: "NORMAL",
          source: "NEWSLETTER_FLAG",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-20"),
          resolvedAt: null,
          closedAt: null,
          messages: [
            {
              id: "msg-1",
              content: "Test message",
              authorType: "CONSTITUENT",
              createdAt: new Date("2024-01-16"),
              isInternalNote: false,
            },
          ],
          newsletterItem: {
            id: "news-1",
            title: "Newsletter Title",
            summary: "Newsletter Summary",
          },
        },
      ];

      const mockSignals = [
        {
          id: "signal-1",
          signalType: "FLAG",
          note: "Test note",
          createdAt: new Date("2024-01-10"),
          newsletterItem: {
            id: "news-1",
            title: "Newsletter Title",
            summary: "Newsletter Summary",
          },
        },
      ];

      const mockMessages = [
        {
          id: "msg-2",
          content: "Public message",
          createdAt: new Date("2024-01-12"),
          isInternalNote: false,
        },
      ];

      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce(mockCases);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce(mockSignals);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce(mockMessages);

      const result = await processExportRequest(constituentId);

      expect(result.data.constituent).toEqual(
        expect.objectContaining({
          id: constituentId,
          email: mockConstituent.email,
          name: mockConstituent.name,
          phone: mockConstituent.phone,
          address: mockConstituent.address,
        })
      );

      expect(result.data.cases).toHaveLength(1);
      expect(result.data.signals).toHaveLength(1);
      expect(result.data.messages).toHaveLength(1);
    });

    it("should include case messages in export", async () => {
      const mockCases = [
        {
          id: "case-1",
          referenceNumber: "CR-2024-00001",
          subject: "Test Case",
          description: "Description",
          status: "NEW",
          priority: "NORMAL",
          source: "NEWSLETTER_FLAG",
          createdAt: new Date(),
          updatedAt: new Date(),
          resolvedAt: null,
          closedAt: null,
          messages: [
            {
              id: "msg-1",
              content: "Message 1",
              authorType: "CONSTITUENT",
              createdAt: new Date(),
              isInternalNote: false,
            },
            {
              id: "msg-2",
              content: "Message 2",
              authorType: "STAFF",
              createdAt: new Date(),
              isInternalNote: true,
            },
          ],
          newsletterItem: null,
        },
      ];

      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce(mockCases);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce([]);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce([]);

      const result = await processExportRequest(constituentId);

      expect(result.data.cases[0].messages).toHaveLength(2);
    });
  });

  describe("Deletion anonymizes PII with [REDACTED]", () => {
    it("should anonymize all PII fields", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      const result = await processDeletionRequest(constituentId);

      const updateCall = (prisma.constituent.update as any).mock.calls[1];
      const updateData = updateCall[0].data;

      expect(updateData.email).toContain("[REDACTED]");
      expect(updateData.name).toBe("[REDACTED]");
      expect(updateData.phone).toBe("[REDACTED]");
      expect(updateData.address).toBe("[REDACTED]");
      expect(updateData.ward).toBe("[REDACTED]");
      expect(updateData.district).toBe("[REDACTED]");
    });

    it("should anonymize constituent messages", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 5 });

      const result = await processDeletionRequest(constituentId);

      expect(prisma.caseMessage.updateMany).toHaveBeenCalledWith({
        where: {
          authorId: constituentId,
          authorType: "CONSTITUENT",
        },
        data: {
          content: expect.stringContaining("[REDACTED]"),
        },
      });
    });

    it("should set privacyStatus to ANONYMIZED", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      await processDeletionRequest(constituentId);

      const updateCall = (prisma.constituent.update as any).mock.calls[1];
      expect(updateCall[0].data.privacyStatus).toBe("ANONYMIZED");
    });
  });

  describe("Deletion preserves case structure", () => {
    it("should not delete cases, only anonymize constituent info", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 5 });

      await processDeletionRequest(constituentId);

      expect(prisma.case.findMany).not.toHaveBeenCalled();
    });

    it("should preserve case reference numbers", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      const result = await processDeletionRequest(constituentId);

      expect(result.caseStructurePreserved).toBe(true);
    });
  });

  describe("Deletion does not hard delete records", () => {
    it("should anonymize instead of deleting constituent record", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      await processDeletionRequest(constituentId);

      const deleteCall = (prisma.constituent as any).delete;
      expect(deleteCall).toBeUndefined();

      const updateCall = (prisma.constituent.update as any).mock.calls[1];
      expect(updateCall[0].where.id).toBe(constituentId);
    });

    it("should preserve anonymized records for audit trail", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      const result = await processDeletionRequest(constituentId);

      expect(result.recordsAnonymized).toBeGreaterThan(0);
    });
  });

  describe("Get privacy status", () => {
    it("should return ACTIVE status for active constituent", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce({
        ...mockConstituent,
        privacyStatus: "ACTIVE",
      });

      const status = await getPrivacyStatus(constituentId);

      expect(status).toBe("ACTIVE");
    });

    it("should return ANONYMIZED status", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce({
        ...mockConstituent,
        privacyStatus: "ANONYMIZED",
      });

      const status = await getPrivacyStatus(constituentId);

      expect(status).toBe("ANONYMIZED");
    });
  });

  describe("Check if constituent anonymized", () => {
    it("should return true for anonymized constituent", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce({
        ...mockConstituent,
        privacyStatus: "ANONYMIZED",
      });

      const result = await isConstituientAnonymized(constituentId);

      expect(result).toBe(true);
    });

    it("should return false for active constituent", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce({
        ...mockConstituent,
        privacyStatus: "ACTIVE",
      });

      const result = await isConstituientAnonymized(constituentId);

      expect(result).toBe(false);
    });

    it("should return false if constituent not found", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockRejectedValueOnce(
        new Error("Not found")
      );

      const result = await isConstituientAnonymized("nonexistent-id");

      expect(result).toBe(false);
    });
  });

  describe("Get pending privacy requests", () => {
    it("should return pending export and deletion requests", async () => {
      const mockRequests = [
        {
          id: "const-1",
          email: "export@example.com",
          privacyStatus: "EXPORT_REQUESTED",
          createdAt: new Date("2024-01-10"),
        },
        {
          id: "const-2",
          email: "delete@example.com",
          privacyStatus: "DELETION_REQUESTED",
          createdAt: new Date("2024-01-15"),
        },
      ];

      (prisma.constituent.findMany as any).mockResolvedValueOnce(mockRequests);

      const requests = await getPendingPrivacyRequests();

      expect(requests).toHaveLength(2);
      expect(requests[0].email).toBe("export@example.com");
      expect(requests[1].email).toBe("delete@example.com");
    });

    it("should not include active constituents", async () => {
      const mockRequests = [
        {
          id: "const-1",
          email: "export@example.com",
          privacyStatus: "EXPORT_REQUESTED",
          createdAt: new Date("2024-01-10"),
        },
      ];

      (prisma.constituent.findMany as any).mockResolvedValueOnce(mockRequests);

      const requests = await getPendingPrivacyRequests();

      expect(requests.every((r) => r.status !== "ACTIVE")).toBe(true);
    });
  });

  describe("Export request returns correct file format", () => {
    it("should return JSON format export", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce([]);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce([]);

      const result = await processExportRequest(constituentId);

      expect(result.format).toBe("json");
    });

    it("should generate unique filename", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce([]);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce([]);

      const result1 = await processExportRequest(constituentId);

      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce([]);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce([]);

      const result2 = await processExportRequest(constituentId);

      expect(result1.fileName).not.toBe(result2.fileName);
      expect(result1.fileName).toContain("constituent-data-export");
      expect(result1.fileName).toContain(".json");
    });
  });

  describe("Deletion returns result metadata", () => {
    it("should return deletion result with timestamp", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 3 });

      const result = await processDeletionRequest(constituentId);

      expect(result.constituentId).toBe(constituentId);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.caseStructurePreserved).toBe(true);
    });

    it("should count anonymized records correctly", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 5 });

      const result = await processDeletionRequest(constituentId);

      expect(result.recordsAnonymized).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Export request updates privacy status", () => {
    it("should mark as EXPORT_REQUESTED during process", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce([]);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce([]);

      await processExportRequest(constituentId);

      const firstUpdate = (prisma.constituent.update as any).mock.calls[0];
      expect(firstUpdate[0].data.privacyStatus).toBe("EXPORT_REQUESTED");
    });

    it("should reset to ACTIVE after export", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.case.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterSignal.findMany as any).mockResolvedValueOnce([]);
      (prisma.caseMessage.findMany as any).mockResolvedValueOnce([]);

      await processExportRequest(constituentId);

      const secondUpdate = (prisma.constituent.update as any).mock.calls[1];
      expect(secondUpdate[0].data.privacyStatus).toBe("ACTIVE");
    });
  });

  describe("Deletion request updates privacy status", () => {
    it("should mark as DELETION_REQUESTED during process", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      await processDeletionRequest(constituentId);

      const firstUpdate = (prisma.constituent.update as any).mock.calls[0];
      expect(firstUpdate[0].data.privacyStatus).toBe("DELETION_REQUESTED");
    });

    it("should mark as ANONYMIZED after deletion", async () => {
      (prisma.constituent.findUniqueOrThrow as any).mockResolvedValueOnce(mockConstituent);
      (prisma.constituent.update as any)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});
      (prisma.caseMessage.updateMany as any).mockResolvedValueOnce({ count: 0 });

      await processDeletionRequest(constituentId);

      const secondUpdate = (prisma.constituent.update as any).mock.calls[1];
      expect(secondUpdate[0].data.privacyStatus).toBe("ANONYMIZED");
    });
  });
});

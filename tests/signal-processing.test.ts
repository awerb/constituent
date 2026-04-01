import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processSignal, type ProcessSignalInput, type ProcessSignalResult } from "@/server/services/signal-processor";
import { prisma } from "@/lib/db";

// Mock Prisma client
vi.mock("@/lib/db", () => ({
  prisma: {
    constituent: {
      upsert: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    newsletterItem: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    newsletterSignal: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    case: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    caseMessage: {
      create: vi.fn(),
    },
    slaConfig: {
      findFirst: vi.fn(),
    },
    city: {
      findUniqueOrThrow: vi.fn(),
    },
    department: {
      findUniqueOrThrow: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

// Mock services
vi.mock("@/lib/ref-number", () => ({
  generateReferenceNumber: vi.fn().mockResolvedValue("CR-2024-00001"),
}));

vi.mock("@/lib/sla", () => ({
  calculateSlaDeadline: vi.fn().mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
}));

vi.mock("@/server/services/case-router", () => ({
  routeCase: vi.fn().mockResolvedValue({ departmentId: "dept-1", department: { id: "dept-1", name: "Test Dept" } }),
}));

vi.mock("@/server/services/notifier", () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

describe("Signal Processing Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Creating new constituent when email not found", () => {
    it("should create a new constituent when email does not exist in city", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "new@example.com",
        constituentName: "John Doe",
        newsletterExternalId: "news-1",
        newsletterTitle: "Test Newsletter",
        newsletterSummary: "Test summary",
        topicTags: ["public-works"],
        sourceUrl: "https://example.com/news-1",
        tcDataUrl: "https://transparent.city/data",
        signalType: "FLAG",
        noteLanguage: "en",
      };

      const mockConstituent = {
        id: "constituent-1",
        email: input.constituentEmail,
        name: input.constituentName,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-1",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
        flagCount: 0,
        applaudCount: 0,
      };

      const mockSignal = {
        id: "signal-1",
        newsletterItemId: "newsletter-1",
        constituentId: "constituent-1",
        signalType: "FLAG",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(null);
      (prisma.slaConfig.findFirst as any).mockResolvedValueOnce({
        responseHours: 4,
        businessHoursStart: "09:00",
        businessHoursEnd: "17:00",
        businessDays: ["MON", "TUE", "WED", "THU", "FRI"],
      });
      (prisma.city.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: input.cityId,
        timezone: "America/New_York",
      });
      (prisma.case.create as any).mockResolvedValueOnce({
        id: "case-1",
        referenceNumber: "CR-2024-00001",
      });
      (prisma.departmentFindUniqueOrThrow as any) = vi.fn();
      (prisma.user.findMany as any).mockResolvedValueOnce([]);

      const result = await processSignal(input);

      expect(prisma.constituent.upsert).toHaveBeenCalledWith({
        where: {
          cityId_email: {
            cityId: input.cityId,
            email: input.constituentEmail,
          },
        },
        update: {
          name: input.constituentName,
        },
        create: expect.objectContaining({
          cityId: input.cityId,
          email: input.constituentEmail,
          name: input.constituentName,
        }),
      });

      expect(result.status).toBe("created");
      expect(result.signalId).toBe("signal-1");
    });
  });

  describe("Finding existing constituent by [cityId, email]", () => {
    it("should find an existing constituent when same email in same city", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "existing@example.com",
        constituentName: "Jane Doe",
        newsletterExternalId: "news-2",
        newsletterTitle: "Newsletter 2",
        newsletterSummary: "Summary 2",
        topicTags: ["parks"],
        sourceUrl: "https://example.com/news-2",
        tcDataUrl: "https://transparent.city/data",
        signalType: "APPLAUD",
      };

      const mockConstituent = {
        id: "constituent-existing",
        email: input.constituentEmail,
        name: input.constituentName,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-2",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
      };

      const mockSignal = {
        id: "signal-2",
        newsletterItemId: "newsletter-2",
        constituentId: "constituent-existing",
        signalType: "APPLAUD",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      const result = await processSignal(input);

      expect(result.signalId).toBe("signal-2");
      expect(result.status).toBe("created");
    });
  });

  describe("Creating new newsletter item when externalId not found", () => {
    it("should create a new newsletter item when externalId does not exist", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "test@example.com",
        newsletterExternalId: "new-newsletter-id",
        newsletterTitle: "New Newsletter",
        newsletterSummary: "New summary",
        topicTags: ["budget"],
        sourceUrl: "https://example.com/new",
        tcDataUrl: "https://transparent.city/new",
        signalType: "FLAG",
      };

      const mockConstituent = {
        id: "constituent-1",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-new",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
        title: input.newsletterTitle,
        flagCount: 0,
      };

      const mockSignal = {
        id: "signal-new",
        newsletterItemId: "newsletter-new",
        constituentId: "constituent-1",
        signalType: "FLAG",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(null);
      (prisma.slaConfig.findFirst as any).mockResolvedValueOnce(null);
      (prisma.city.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: input.cityId,
        timezone: "America/New_York",
      });
      (prisma.case.create as any).mockResolvedValueOnce({
        id: "case-1",
        referenceNumber: "CR-2024-00001",
      });
      (prisma.user.findMany as any).mockResolvedValueOnce([]);

      const result = await processSignal(input);

      expect(prisma.newsletterItem.upsert).toHaveBeenCalledWith({
        where: {
          cityId_externalId: {
            cityId: input.cityId,
            externalId: input.newsletterExternalId,
          },
        },
        update: {},
        create: expect.objectContaining({
          cityId: input.cityId,
          externalId: input.newsletterExternalId,
          title: input.newsletterTitle,
          summary: input.newsletterSummary,
        }),
      });

      expect(result.status).toBe("created");
    });
  });

  describe("Idempotency - returns existing signal if duplicate [newsletterItemId, constituentId, signalType]", () => {
    it("should return existing signal without creating duplicate", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "dup@example.com",
        newsletterExternalId: "news-dup",
        newsletterTitle: "Duplicate Newsletter",
        newsletterSummary: "Dup summary",
        topicTags: ["public-works"],
        sourceUrl: "https://example.com/dup",
        tcDataUrl: "https://transparent.city/dup",
        signalType: "FLAG",
      };

      const mockConstituent = {
        id: "constituent-dup",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-dup",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
      };

      const existingSignal = {
        id: "signal-existing-dup",
        newsletterItemId: "newsletter-dup",
        constituentId: "constituent-dup",
        signalType: "FLAG",
        caseId: "case-existing",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(existingSignal);

      const result = await processSignal(input);

      expect(result.status).toBe("duplicated");
      expect(result.signalId).toBe("signal-existing-dup");
      expect(result.caseId).toBe("case-existing");
      expect(prisma.newsletterSignal.create).not.toHaveBeenCalled();
    });
  });

  describe("Increments flagCount on newsletter item for FLAG signal", () => {
    it("should increment flagCount when FLAG signal is processed", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "flag@example.com",
        newsletterExternalId: "news-flag",
        newsletterTitle: "Flag Newsletter",
        newsletterSummary: "Flag summary",
        topicTags: ["police"],
        sourceUrl: "https://example.com/flag",
        tcDataUrl: "https://transparent.city/flag",
        signalType: "FLAG",
      };

      const mockConstituent = {
        id: "constituent-flag",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-flag",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
        flagCount: 5,
      };

      const mockSignal = {
        id: "signal-flag",
        newsletterItemId: "newsletter-flag",
        constituentId: "constituent-flag",
        signalType: "FLAG",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(null);
      (prisma.slaConfig.findFirst as any).mockResolvedValueOnce(null);
      (prisma.city.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: input.cityId,
        timezone: "America/New_York",
      });
      (prisma.case.create as any).mockResolvedValueOnce({
        id: "case-flag",
        referenceNumber: "CR-2024-00001",
      });
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});
      (prisma.user.findMany as any).mockResolvedValueOnce([]);

      await processSignal(input);

      expect(prisma.newsletterItem.update).toHaveBeenCalledWith({
        where: { id: "newsletter-flag" },
        data: { flagCount: { increment: 1 } },
      });
    });
  });

  describe("Increments applaudCount for APPLAUD signal", () => {
    it("should increment applaudCount when APPLAUD signal is processed", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "applaud@example.com",
        newsletterExternalId: "news-applaud",
        newsletterTitle: "Applaud Newsletter",
        newsletterSummary: "Applaud summary",
        topicTags: ["parks"],
        sourceUrl: "https://example.com/applaud",
        tcDataUrl: "https://transparent.city/applaud",
        signalType: "APPLAUD",
      };

      const mockConstituent = {
        id: "constituent-applaud",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-applaud",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
        applaudCount: 3,
      };

      const mockSignal = {
        id: "signal-applaud",
        newsletterItemId: "newsletter-applaud",
        constituentId: "constituent-applaud",
        signalType: "APPLAUD",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      await processSignal(input);

      expect(prisma.newsletterItem.update).toHaveBeenCalledWith({
        where: { id: "newsletter-applaud" },
        data: { applaudCount: { increment: 1 } },
      });
    });
  });

  describe("Creates new case for first FLAG on a newsletter item", () => {
    it("should create a new case when first FLAG is received for a newsletter", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "first-flag@example.com",
        newsletterExternalId: "news-case",
        newsletterTitle: "Case Newsletter",
        newsletterSummary: "Case summary",
        topicTags: ["budget"],
        sourceUrl: "https://example.com/case",
        tcDataUrl: "https://transparent.city/case",
        signalType: "FLAG",
        note: "This is concerning",
      };

      const mockConstituent = {
        id: "constituent-case",
        email: input.constituentEmail,
        cityId: input.cityId,
        name: "Test User",
      };

      const mockNewsletterItem = {
        id: "newsletter-case",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
        title: input.newsletterTitle,
        summary: input.newsletterSummary,
      };

      const mockSignal = {
        id: "signal-case",
        newsletterItemId: "newsletter-case",
        constituentId: "constituent-case",
        signalType: "FLAG",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(null);
      (prisma.slaConfig.findFirst as any).mockResolvedValueOnce({
        responseHours: 4,
        businessHoursStart: "09:00",
        businessHoursEnd: "17:00",
        businessDays: ["MON", "TUE", "WED", "THU", "FRI"],
      });
      (prisma.city.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: input.cityId,
        timezone: "America/New_York",
      });
      (prisma.case.create as any).mockResolvedValueOnce({
        id: "case-new",
        referenceNumber: "CR-2024-00001",
      });
      (prisma.caseMessage.create as any).mockResolvedValueOnce({});
      (prisma.newsletterSignal.update as any).mockResolvedValueOnce({});
      (prisma.department.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: "dept-1",
        name: "Budget Department",
      });
      (prisma.user.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      const result = await processSignal(input);

      expect(prisma.case.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cityId: input.cityId,
          constituentId: "constituent-case",
          subject: expect.stringContaining("Newsletter Flag"),
          status: "NEW",
          departmentId: "dept-1",
          newsletterItemId: "newsletter-case",
          signalType: undefined,
        }),
      });

      expect(result.caseId).toBe("case-new");
      expect(result.referenceNumber).toBe("CR-2024-00001");
    });
  });

  describe("Adds message to existing case for subsequent FLAGs", () => {
    it("should add message to existing case instead of creating new one", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "second-flag@example.com",
        newsletterExternalId: "news-existing",
        newsletterTitle: "Existing Newsletter",
        newsletterSummary: "Existing summary",
        topicTags: ["parks"],
        sourceUrl: "https://example.com/existing",
        tcDataUrl: "https://transparent.city/existing",
        signalType: "FLAG",
        note: "Another concern",
      };

      const mockConstituent = {
        id: "constituent-second",
        email: input.constituentEmail,
        cityId: input.cityId,
        name: "Second User",
      };

      const mockNewsletterItem = {
        id: "newsletter-existing",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
      };

      const existingCase = {
        id: "case-existing",
        referenceNumber: "CR-2024-00001",
        status: "NEW",
        newsItemId: "newsletter-existing",
      };

      const mockSignal = {
        id: "signal-second",
        newsletterItemId: "newsletter-existing",
        constituentId: "constituent-second",
        signalType: "FLAG",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(existingCase);
      (prisma.caseMessage.create as any).mockResolvedValueOnce({});
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      await processSignal(input);

      expect(prisma.caseMessage.create).toHaveBeenCalledWith({
        data: {
          caseId: "case-existing",
          authorType: "CONSTITUENT",
          authorId: "constituent-second",
          content: input.note,
          contentLanguage: input.noteLanguage,
        },
      });

      expect(prisma.case.create).not.toHaveBeenCalled();
    });
  });

  describe("Routes case to department by matching topic tags", () => {
    it("should route case to department with matching tags", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "route@example.com",
        newsletterExternalId: "news-route",
        newsletterTitle: "Route Newsletter",
        newsletterSummary: "Route summary",
        topicTags: ["police", "safety"],
        sourceUrl: "https://example.com/route",
        tcDataUrl: "https://transparent.city/route",
        signalType: "FLAG",
      };

      const { routeCase } = await import("@/server/services/case-router");

      const mockConstituent = {
        id: "constituent-route",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-route",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
      };

      const mockSignal = {
        id: "signal-route",
        newsletterItemId: "newsletter-route",
        constituentId: "constituent-route",
        signalType: "FLAG",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(null);
      (prisma.slaConfig.findFirst as any).mockResolvedValueOnce(null);
      (prisma.city.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: input.cityId,
        timezone: "America/New_York",
      });
      (prisma.case.create as any).mockResolvedValueOnce({
        id: "case-route",
        referenceNumber: "CR-2024-00001",
      });
      (prisma.user.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      await processSignal(input);

      expect(routeCase).toHaveBeenCalledWith(input.cityId, input.topicTags);
    });
  });

  describe("Sets SLA deadline on new case", () => {
    it("should calculate and set SLA deadline when creating case", async () => {
      const { calculateSlaDeadline } = await import("@/lib/sla");

      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "sla@example.com",
        newsletterExternalId: "news-sla",
        newsletterTitle: "SLA Newsletter",
        newsletterSummary: "SLA summary",
        topicTags: ["budget"],
        sourceUrl: "https://example.com/sla",
        tcDataUrl: "https://transparent.city/sla",
        signalType: "FLAG",
      };

      const mockConstituent = {
        id: "constituent-sla",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-sla",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
      };

      const mockSignal = {
        id: "signal-sla",
        newsletterItemId: "newsletter-sla",
        constituentId: "constituent-sla",
        signalType: "FLAG",
      };

      const mockDeadline = new Date(Date.now() + 4 * 60 * 60 * 1000);

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.case.findFirst as any).mockResolvedValueOnce(null);
      (prisma.slaConfig.findFirst as any).mockResolvedValueOnce({
        responseHours: 4,
        businessHoursStart: "09:00",
        businessHoursEnd: "17:00",
        businessDays: ["MON", "TUE", "WED", "THU", "FRI"],
      });
      (prisma.city.findUniqueOrThrow as any).mockResolvedValueOnce({
        id: input.cityId,
        timezone: "America/New_York",
      });
      (prisma.case.create as any).mockResolvedValueOnce({
        id: "case-sla",
        referenceNumber: "CR-2024-00001",
        slaDeadline: mockDeadline,
      });
      (prisma.user.findMany as any).mockResolvedValueOnce([]);
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      await processSignal(input);

      expect(calculateSlaDeadline).toHaveBeenCalledWith(
        expect.any(Date),
        4,
        expect.objectContaining({
          businessHoursStart: "09:00",
          businessHoursEnd: "17:00",
          timezone: "America/New_York",
        })
      );

      expect(prisma.case.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slaDeadline: expect.any(Date),
        }),
      });
    });
  });

  describe("Does not create case for APPLAUD without note", () => {
    it("should not create case when APPLAUD signal has no note", async () => {
      const input: ProcessSignalInput = {
        cityId: "city-1",
        constituentEmail: "applaud-no-note@example.com",
        newsletterExternalId: "news-applaud-no-note",
        newsletterTitle: "Applaud No Note",
        newsletterSummary: "Summary",
        topicTags: ["parks"],
        sourceUrl: "https://example.com",
        tcDataUrl: "https://transparent.city",
        signalType: "APPLAUD",
        // No note provided
      };

      const mockConstituent = {
        id: "constituent-applaud-no-note",
        email: input.constituentEmail,
        cityId: input.cityId,
      };

      const mockNewsletterItem = {
        id: "newsletter-applaud-no-note",
        externalId: input.newsletterExternalId,
        cityId: input.cityId,
      };

      const mockSignal = {
        id: "signal-applaud-no-note",
        newsletterItemId: "newsletter-applaud-no-note",
        constituentId: "constituent-applaud-no-note",
        signalType: "APPLAUD",
      };

      (prisma.constituent.upsert as any).mockResolvedValueOnce(mockConstituent);
      (prisma.newsletterItem.upsert as any).mockResolvedValueOnce(mockNewsletterItem);
      (prisma.newsletterSignal.findUnique as any).mockResolvedValueOnce(null);
      (prisma.newsletterSignal.create as any).mockResolvedValueOnce(mockSignal);
      (prisma.newsletterItem.update as any).mockResolvedValueOnce({});

      const result = await processSignal(input);

      expect(result.caseId).toBeUndefined();
      expect(prisma.case.create).not.toHaveBeenCalled();
    });
  });
});

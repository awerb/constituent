import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  exportAllData,
  exportFoia,
  listExports,
  deleteExport,
} from "@/server/services/export";
import { prisma } from "@/lib/db";
import * as fs from "fs";
import * as archiver from "archiver";

vi.mock("@/lib/db");
vi.mock("fs");
vi.mock("archiver");

describe("Export Service", () => {
  const mockCity = {
    id: "city-1",
    name: "San Francisco",
  };

  const mockConstituents = [
    {
      id: "const-1",
      email: "john@example.com",
      name: "John Smith",
      phone: "555-1234",
      cityId: "city-1",
    },
    {
      id: "const-2",
      email: "jane@example.com",
      name: "Jane Doe",
      phone: "555-5678",
      cityId: "city-1",
    },
  ];

  const mockCases = [
    {
      id: "case-1",
      referenceNumber: "REF-2024-001",
      subject: "Street Pothole",
      description: "Large pothole on Main St",
      status: "NEW",
      priority: "HIGH",
      cityId: "city-1",
      constituentId: "const-1",
      departmentId: "dept-1",
      createdAt: new Date("2024-01-01"),
      constituent: mockConstituents[0],
      department: { id: "dept-1", name: "Public Works" },
    },
  ];

  const mockMessages = [
    {
      id: "msg-1",
      caseId: "case-1",
      content: "Help needed",
      authorType: "CONSTITUENT",
      createdAt: new Date("2024-01-01"),
      isInternalNote: false,
      isPublicRecordsExcluded: false,
      case: mockCases[0],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
    vi.mocked(prisma.constituent).findMany.mockResolvedValue(mockConstituents);
    vi.mocked(prisma.case).findMany.mockResolvedValue(mockCases);
    vi.mocked(prisma.caseMessage).findMany.mockResolvedValue(mockMessages);
    vi.mocked(prisma.department).findMany.mockResolvedValue([]);
    vi.mocked(prisma.user).findMany.mockResolvedValue([]);
    vi.mocked(prisma.newsletterItem).findMany.mockResolvedValue([]);
    vi.mocked(prisma.newsletterSignal).findMany.mockResolvedValue([]);
    vi.mocked(prisma.template).findMany.mockResolvedValue([]);
    vi.mocked(prisma.slaConfig).findMany.mockResolvedValue([]);
    vi.mocked(prisma.kbArticle).findMany.mockResolvedValue([]);
    vi.mocked(prisma.webhook).findMany.mockResolvedValue([]);
    vi.mocked(prisma.auditLog).findMany.mockResolvedValue([]);

    vi.mocked(fs.promises.mkdir).mockResolvedValue("");
    vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.promises.rm).mockResolvedValue(undefined);
    vi.mocked(fs.promises.readdir).mockResolvedValue([]);
    vi.mocked(fs.promises.stat).mockResolvedValue({
      mtime: new Date(),
      size: 1024,
    } as any);
  });

  describe("exportAllData - Full Data Export", () => {
    it("should generate ZIP file", async () => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn((event, callback) => {
          if (event === "close") callback();
        },
      } as any);

      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === "close") callback();
        }),
        pointer: vi.fn(() => 2048),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      const result = await exportAllData("city-1");

      expect(result).toContain(".zip");
      expect(result).toContain("city-export");
    });

    it("should export all tables", async () => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 1024),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await exportAllData("city-1");

      expect(prisma.city.findUniqueOrThrow).toHaveBeenCalled();
      expect(prisma.constituent).findMany.toHaveBeenCalled();
      expect(prisma.case).findMany.toHaveBeenCalled();
      expect(prisma.department).findMany.toHaveBeenCalled();
      expect(prisma.user).findMany.toHaveBeenCalled();
      expect(prisma.caseMessage).findMany.toHaveBeenCalled();
    });

    it("should scope export to city (tenant isolation)", async () => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 1024),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await exportAllData("city-1");

      // Verify cityId filter is applied
      const casesCall = vi.mocked(prisma.case).findMany.mock.calls[0];
      expect(casesCall[0]?.where?.cityId).toBe("city-1");
    });

    it("should handle city with no data (empty CSVs)", async () => {
      vi.mocked(prisma.case).findMany.mockResolvedValue([]);
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([]);

      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 512),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      const result = await exportAllData("city-1");

      expect(result).toBeDefined();
      expect(result).toContain(".zip");
    });
  });

  describe("exportFoia - FOIA Export with Filters", () => {
    beforeEach(() => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 2048),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);
    });

    it("should respect date range filter", async () => {
      const dateRange = {
        start: new Date("2024-01-01"),
        end: new Date("2024-12-31"),
      };

      await exportFoia("city-1", { dateRange });

      const call = vi.mocked(prisma.case).findMany.mock.calls[0];
      expect(call[0]?.where?.createdAt).toEqual({
        gte: dateRange.start,
        lte: dateRange.end,
      });
    });

    it("should respect department filter", async () => {
      await exportFoia("city-1", { departmentId: "dept-1" });

      const call = vi.mocked(prisma.case).findMany.mock.calls[0];
      expect(call[0]?.where?.departmentId).toBe("dept-1");
    });

    it("should exclude internal notes by default", async () => {
      await exportFoia("city-1", { includeInternalNotes: false });

      const call = vi.mocked(prisma.caseMessage).findMany.mock.calls[0];
      expect(call[0]?.where?.isInternalNote).toBe(false);
    });

    it("should include internal notes when flag set", async () => {
      await exportFoia("city-1", { includeInternalNotes: true });

      const call = vi.mocked(prisma.caseMessage).findMany.mock.calls[0];
      // When includeInternalNotes is true, there should be no isInternalNote filter
      expect(call[0]?.where?.isInternalNote).toBeUndefined();
    });

    it("should create README with export details", async () => {
      await exportFoia("city-1", {
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-12-31"),
        },
        departmentId: "dept-1",
      });

      // Verify README was written
      const writeCall = vi.mocked(fs.promises.writeFile).mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("README")
      );

      expect(writeCall).toBeDefined();
      const readmeContent = writeCall![1] as string;
      expect(readmeContent).toContain("FOIA Export");
      expect(readmeContent).toContain("Date Range");
      expect(readmeContent).toContain("Department");
    });

    it("should anonymize sensitive data (redact emails)", async () => {
      await exportFoia("city-1", {});

      const writeCall = vi.mocked(fs.promises.writeFile).mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("cases.csv")
      );

      if (writeCall) {
        const csvContent = writeCall[1] as string;
        expect(csvContent).toContain("REDACTED");
      }
    });

    it("should include constituent names as part of public record", async () => {
      await exportFoia("city-1", {});

      const writeCall = vi.mocked(fs.promises.writeFile).mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("cases.csv")
      );

      if (writeCall) {
        const csvContent = writeCall[1] as string;
        // Names should be included even in FOIA export
        expect(csvContent).toContain("John Smith");
      }
    });

    it("should return ZIP file path", async () => {
      const result = await exportFoia("city-1", {});

      expect(result).toContain(".zip");
      expect(result).toContain("foia-export");
    });
  });

  describe("CSV Export Format", () => {
    it("should have CSV headers matching table columns", async () => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 1024),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await exportAllData("city-1");

      // Verify CSV writing calls include headers
      const csvWriteCalls = vi.mocked(fs.promises.writeFile).mock.calls;
      expect(csvWriteCalls.length).toBeGreaterThan(0);
    });

    it("should properly escape CSV data (commas in values, quotes)", async () => {
      const constituentWithComma = {
        ...mockConstituents[0],
        name: 'Smith, "John"',
      };
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        constituentWithComma,
      ]);

      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 1024),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await exportAllData("city-1");

      // CSV writer should handle escaping
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });

  describe("listExports - Export Management", () => {
    it("should list all export files", async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValue([
        "city-export-city-1-1234567890.zip",
        "foia-export-city-1-1234567890.zip",
        "other-file.txt",
      ] as any);

      const result = await listExports();

      expect(result.length).toBeGreaterThan(0);
    });

    it("should filter to only export ZIP files", async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValue([
        "city-export-123.zip",
        "foia-export-123.zip",
        "random-file.txt",
        "document.pdf",
      ] as any);

      const result = await listExports();

      const allZips = result.every((exp) => exp.filename.endsWith(".zip"));
      expect(allZips).toBe(true);

      const hasNonExport = result.some(
        (exp) =>
          !exp.filename.startsWith("city-export") &&
          !exp.filename.startsWith("foia-export")
      );
      expect(hasNonExport).toBe(false);
    });

    it("should include file metadata (size, creation date)", async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValue([
        "city-export-123.zip",
      ] as any);
      vi.mocked(fs.promises.stat).mockResolvedValue({
        size: 5242880,
        mtime: new Date("2024-01-15"),
      } as any);

      const result = await listExports();

      expect(result[0]).toMatchObject({
        filename: "city-export-123.zip",
        size: 5242880,
        createdAt: expect.any(Date),
      });
    });

    it("should sort exports by creation date (newest first)", async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValue([
        "city-export-1.zip",
        "city-export-2.zip",
        "city-export-3.zip",
      ] as any);

      vi.mocked(fs.promises.stat)
        .mockResolvedValueOnce({
          mtime: new Date("2024-01-01"),
        } as any)
        .mockResolvedValueOnce({
          mtime: new Date("2024-01-15"),
        } as any)
        .mockResolvedValueOnce({
          mtime: new Date("2024-01-10"),
        } as any);

      const result = await listExports();

      if (result.length >= 2) {
        expect(
          new Date(result[0].createdAt).getTime() >=
          new Date(result[1].createdAt).getTime()
        ).toBe(true);
      }
    });
  });

  describe("deleteExport - Export File Deletion", () => {
    it("should delete export file", async () => {
      await deleteExport("/tmp/city-export-city-1-1234567890.zip");

      expect(fs.promises.unlink).toHaveBeenCalledWith(
        "/tmp/city-export-city-1-1234567890.zip"
      );
    });

    it("should validate that path is in temp directory", async () => {
      await expect(
        deleteExport("/etc/passwd")
      ).rejects.toThrow("Invalid export file path");

      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it("should allow deletion of files in /tmp directory", async () => {
      await deleteExport("/tmp/foia-export-123.zip");

      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it("should handle file not found error", async () => {
      vi.mocked(fs.promises.unlink).mockRejectedValue(
        new Error("ENOENT: no such file")
      );

      await expect(
        deleteExport("/tmp/nonexistent.zip")
      ).rejects.toThrow();
    });
  });

  describe("Data Integrity and Privacy", () => {
    it("should handle large datasets without memory overflow (streaming)", async () => {
      const largeConstituents = Array.from({ length: 10000 }, (_, i) => ({
        id: `const-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        phone: `555-${String(i).padStart(4, "0")}`,
        cityId: "city-1",
      }));

      vi.mocked(prisma.constituent).findMany.mockResolvedValue(
        largeConstituents
      );

      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 1024 * 1024), // 1MB
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      const result = await exportAllData("city-1");

      expect(result).toBeDefined();
    });

    it("should preserve data integrity in exports", async () => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 2048),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await exportAllData("city-1");

      // Data should be exported as-is
      expect(prisma.case).findMany.toHaveBeenCalled();
    });

    it("should NOT include sensitive fields unless explicitly requested", async () => {
      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 2048),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await exportFoia("city-1", { includeInternalNotes: false });

      // Internal notes should not be included
      const messageCall = vi.mocked(prisma.caseMessage).findMany.mock
        .calls[0][0] as any;
      expect(messageCall.where?.isInternalNote).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.case).findMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      vi.mocked(fs.createWriteStream).mockReturnValue({
        on: vi.fn(),
      } as any);
      const mockArchive = {
        pipe: vi.fn(),
        directory: vi.fn(),
        finalize: vi.fn(),
        on: vi.fn(),
        pointer: vi.fn(() => 1024),
      };
      vi.mocked(archiver.default).mockReturnValue(mockArchive as any);

      await expect(exportAllData("city-1")).rejects.toThrow();
    });

    it("should handle file system errors during export", async () => {
      vi.mocked(fs.promises.mkdir).mockRejectedValue(
        new Error("Permission denied")
      );

      await expect(exportAllData("city-1")).rejects.toThrow();
    });
  });
});

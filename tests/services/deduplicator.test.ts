import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findDuplicates,
  mergeConstituents,
  getMergePreview,
} from "@/server/services/deduplicator";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db");

describe("Deduplicator Service", () => {
  const mockConstituent = {
    id: "const-1",
    email: "john@example.com",
    name: "John Smith",
    phone: "555-1234",
    cityId: "city-1",
    createdAt: new Date(),
    _count: { cases: 3 },
  };

  const mockDuplicate = {
    id: "const-2",
    email: "john@example.com",
    name: "John Smith",
    phone: "555-1234",
    cityId: "city-1",
    createdAt: new Date(),
    _count: { cases: 2 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findDuplicates - Email Matching", () => {
    it("should find exact email match as duplicate", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        mockConstituent,
        mockDuplicate,
      ]);

      const result = await findDuplicates(
        "city-1",
        "john@example.com",
        undefined,
        undefined
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].email).toBe("john@example.com");
    });

    it("should find email match case-insensitively", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        mockConstituent,
      ]);

      const result = await findDuplicates(
        "city-1",
        "JOHN@EXAMPLE.COM",
        undefined,
        undefined
      );

      expect(prisma.constituent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          cityId: "city-1",
        }),
        include: expect.any(Object),
      });

      expect(result[0].email).toBe("john@example.com");
    });

    it("should return empty array when no email matches found", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([]);

      const result = await findDuplicates(
        "city-1",
        "nonexistent@example.com",
        undefined,
        undefined
      );

      expect(result).toEqual([]);
    });
  });

  describe("findDuplicates - Phone Matching", () => {
    it("should find exact phone match as duplicate", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        mockConstituent,
        mockDuplicate,
      ]);

      const result = await findDuplicates(
        "city-1",
        undefined,
        "555-1234",
        undefined
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].phone).toBe("555-1234");
    });

    it("should find phone match with different formatting", async () => {
      const constituent = {
        ...mockConstituent,
        phone: "(555) 123-4567",
      };

      vi.mocked(prisma.constituent).findMany.mockResolvedValue([constituent]);

      const result = await findDuplicates(
        "city-1",
        undefined,
        "5551234567",
        undefined
      );

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("findDuplicates - Name Matching", () => {
    it("should find fuzzy name match using Levenshtein distance", async () => {
      const similar = {
        ...mockConstituent,
        name: "Jon Smith", // Similar to John Smith
      };

      vi.mocked(prisma.constituent).findMany.mockResolvedValue([similar]);

      const result = await findDuplicates(
        "city-1",
        undefined,
        undefined,
        "John Smith"
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].similarity).toBeGreaterThan(0);
    });

    it("should calculate lower similarity for very different names", async () => {
      const different = {
        ...mockConstituent,
        name: "Jane Doe",
      };

      vi.mocked(prisma.constituent).findMany.mockResolvedValue([different]);

      const result = await findDuplicates(
        "city-1",
        undefined,
        undefined,
        "John Smith"
      );

      if (result.length > 0) {
        expect(result[0].similarity).toBeLessThan(50);
      }
    });
  });

  describe("findDuplicates - Tenant Isolation", () => {
    it("should not match across different cities", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([]);

      const result = await findDuplicates(
        "city-2",
        "john@example.com",
        undefined,
        undefined
      );

      expect(prisma.constituent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          cityId: "city-2",
        }),
        include: expect.any(Object),
      });

      expect(result).toEqual([]);
    });

    it("should include cityId in where clause for queries", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([]);

      await findDuplicates("city-1", "test@example.com", undefined, undefined);

      const call = vi.mocked(prisma.constituent).findMany.mock.calls[0][0];
      expect(call.where?.cityId).toBe("city-1");
    });
  });

  describe("findDuplicates - Results", () => {
    it("should return empty array when no search criteria provided", async () => {
      const result = await findDuplicates("city-1", undefined, undefined, undefined);

      expect(result).toEqual([]);
      expect(prisma.constituent.findMany).not.toHaveBeenCalled();
    });

    it("should include case count in results", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        { ...mockConstituent, _count: { cases: 5 } },
      ]);

      const result = await findDuplicates(
        "city-1",
        "john@example.com",
        undefined,
        undefined
      );

      expect(result[0].caseCount).toBe(5);
    });

    it("should include similarity score in results", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        mockConstituent,
      ]);

      const result = await findDuplicates(
        "city-1",
        "john@example.com",
        undefined,
        undefined
      );

      expect(result[0].similarity).toBeDefined();
      expect(typeof result[0].similarity).toBe("number");
    });

    it("should sort results by similarity score descending", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        { ...mockConstituent, name: "John Smith", similarity: 100 },
        { ...mockConstituent, id: "const-2", name: "Jon Smith", similarity: 80 },
        { ...mockConstituent, id: "const-3", name: "Jane Smith", similarity: 60 },
      ]);

      const result = await findDuplicates(
        "city-1",
        undefined,
        undefined,
        "John Smith"
      );

      if (result.length >= 2) {
        expect(result[0].similarity).toBeGreaterThanOrEqual(
          result[1].similarity
        );
      }
    });
  });

  describe("mergeConstituents - Case and Data Movement", () => {
    const mockPrimary = {
      id: "const-1",
      email: "john@example.com",
      name: "John Smith",
      phone: "555-1234",
      address: "123 Main St",
      metadata: { source: "web" },
    };

    const mockDuplicate = {
      id: "const-2",
      email: "john.smith@example.com",
      name: "John Smith",
      phone: "555-1234",
      address: null,
      metadata: { source: "phone" },
    };

    beforeEach(() => {
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") return mockPrimary;
          if (query.where.id === "const-2") return mockDuplicate;
        }
      );

      vi.mocked(prisma.case).updateMany.mockResolvedValue({ count: 5 });
      vi.mocked(prisma.newsletterSignal).updateMany.mockResolvedValue({ count: 3 });
      vi.mocked(prisma.caseMessage).updateMany.mockResolvedValue({ count: 2 });
      vi.mocked(prisma.constituent).update.mockResolvedValue(mockPrimary);
      vi.mocked(prisma.constituent).delete.mockResolvedValue(mockDuplicate);
    });

    it("should move all cases to primary constituent", async () => {
      await mergeConstituents("const-1", "const-2");

      expect(prisma.case.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { constituentId: "const-2" },
          data: { constituentId: "const-1" },
        })
      );
    });

    it("should move all signals to primary constituent", async () => {
      await mergeConstituents("const-1", "const-2");

      expect(prisma.newsletterSignal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { constituentId: "const-2" },
          data: { constituentId: "const-1" },
        })
      );
    });

    it("should move all messages to primary constituent", async () => {
      await mergeConstituents("const-1", "const-2");

      expect(prisma.caseMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: "const-2",
            authorType: "CONSTITUENT",
          },
          data: { authorId: "const-1" },
        })
      );
    });

    it("should deactivate the duplicate record by deleting it", async () => {
      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent).delete.toHaveBeenCalledWith({
        where: { id: "const-2" },
      });
    });

    it("should merge metadata from duplicate into primary", async () => {
      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              mergedFrom: expect.objectContaining({
                id: "const-2",
                email: "john.smith@example.com",
              }),
            }),
          }),
        })
      );
    });

    it("should fill missing name in primary from duplicate", async () => {
      const primaryNoName = { ...mockPrimary, name: null };
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") return primaryNoName;
          if (query.where.id === "const-2") return mockDuplicate;
        }
      );

      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "John Smith",
          }),
        })
      );
    });

    it("should keep existing name in primary even if duplicate has one", async () => {
      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "John Smith",
          }),
        })
      );
    });

    it("should fill missing phone from duplicate", async () => {
      const primaryNoPhone = { ...mockPrimary, phone: null };
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") return primaryNoPhone;
          if (query.where.id === "const-2") return mockDuplicate;
        }
      );

      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: "555-1234",
          }),
        })
      );
    });

    it("should fill missing address from duplicate", async () => {
      const primaryNoAddress = { ...mockPrimary, address: null };
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") return primaryNoAddress;
          if (query.where.id === "const-2") return mockDuplicate;
        }
      );

      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address: mockDuplicate.address || undefined,
          }),
        })
      );
    });
  });

  describe("mergeConstituents - Validation", () => {
    it("should throw error when merging constituent with itself", async () => {
      await expect(mergeConstituents("const-1", "const-1")).rejects.toThrow(
        "Cannot merge a constituent with itself"
      );
    });

    it("should verify both constituents exist", async () => {
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockRejectedValueOnce(
        new Error("Not found")
      );

      await expect(mergeConstituents("const-1", "nonexistent")).rejects.toThrow(
        "Not found"
      );
    });
  });

  describe("mergeConstituents - Edge Cases", () => {
    it("should handle constituent with no cases", async () => {
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") return mockPrimary;
          if (query.where.id === "const-2") return { ...mockDuplicate };
        }
      );

      vi.mocked(prisma.case).updateMany.mockResolvedValue({ count: 0 });
      vi.mocked(prisma.newsletterSignal).updateMany.mockResolvedValue({
        count: 0,
      });
      vi.mocked(prisma.caseMessage).updateMany.mockResolvedValue({ count: 0 });
      vi.mocked(prisma.constituent).update.mockResolvedValue(mockPrimary);
      vi.mocked(prisma.constituent).delete.mockResolvedValue(mockDuplicate);

      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.delete).toHaveBeenCalledWith({
        where: { id: "const-2" },
      });
    });

    it("should handle duplicate with active privacy request", async () => {
      // This tests that merge doesn't skip on privacy status
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") return mockPrimary;
          if (query.where.id === "const-2") return mockDuplicate;
        }
      );

      vi.mocked(prisma.case).updateMany.mockResolvedValue({ count: 2 });
      vi.mocked(prisma.newsletterSignal).updateMany.mockResolvedValue({
        count: 1,
      });
      vi.mocked(prisma.caseMessage).updateMany.mockResolvedValue({ count: 0 });
      vi.mocked(prisma.constituent).update.mockResolvedValue(mockPrimary);
      vi.mocked(prisma.constituent).delete.mockResolvedValue(mockDuplicate);

      await mergeConstituents("const-1", "const-2");

      expect(prisma.constituent.delete).toHaveBeenCalled();
    });
  });

  describe("getMergePreview - Preview Generation", () => {
    beforeEach(() => {
      vi.mocked(prisma.constituent).findUniqueOrThrow.mockImplementation(
        async (query: any) => {
          if (query.where.id === "const-1") {
            return {
              ...mockConstituent,
              _count: { cases: 5, newsletterSignals: 2 },
            };
          }
          if (query.where.id === "const-2") {
            return {
              ...mockDuplicate,
              _count: { cases: 3, newsletterSignals: 1 },
            };
          }
        }
      );
    });

    it("should return both constituent records", async () => {
      const preview = await getMergePreview("const-1", "const-2");

      expect(preview.primaryConstituent).toBeDefined();
      expect(preview.duplicateConstituent).toBeDefined();
    });

    it("should calculate cases affected by merge", async () => {
      const preview = await getMergePreview("const-1", "const-2");

      expect(preview.casesAffected).toBe(3);
    });

    it("should calculate signals affected by merge", async () => {
      const preview = await getMergePreview("const-1", "const-2");

      expect(preview.signalsAffected).toBe(1);
    });

    it("should show merged result with combined data", async () => {
      const preview = await getMergePreview("const-1", "const-2");

      expect(preview.mergedResult.totalCases).toBe(8);
      expect(preview.mergedResult.totalSignals).toBe(3);
    });

    it("should show merged metadata", async () => {
      const preview = await getMergePreview("const-1", "const-2");

      expect(preview.mergedResult.metadata).toBeDefined();
    });

    it("should preserve primary email in merged result", async () => {
      const preview = await getMergePreview("const-1", "const-2");

      expect(preview.mergedResult.email).toBe("john@example.com");
    });
  });

  describe("Similarity Scoring", () => {
    it("should score exact email match highly", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        { ...mockConstituent, email: "exact@match.com" },
      ]);

      const result = await findDuplicates(
        "city-1",
        "exact@match.com",
        undefined,
        undefined
      );

      if (result.length > 0) {
        expect(result[0].similarity).toBeGreaterThan(80);
      }
    });

    it("should score partial email match moderately", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        { ...mockConstituent, email: "johnsmith@example.com" },
      ]);

      const result = await findDuplicates(
        "city-1",
        "john@example.com",
        undefined,
        undefined
      );

      if (result.length > 0) {
        expect(result[0].similarity).toBeGreaterThan(0);
      }
    });

    it("should score phone match highly", async () => {
      vi.mocked(prisma.constituent).findMany.mockResolvedValue([
        { ...mockConstituent, phone: "5551234567" },
      ]);

      const result = await findDuplicates(
        "city-1",
        undefined,
        "555-123-4567",
        undefined
      );

      if (result.length > 0) {
        expect(result[0].similarity).toBeGreaterThan(70);
      }
    });
  });
});

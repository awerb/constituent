import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateReferenceNumber,
  validateReferenceNumber,
  parseReferenceNumber,
} from "@/lib/ref-number";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    case: {
      findMany: vi.fn(),
    },
  },
}));

describe("Reference Number Generation", () => {
  const cityId = "city-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Generates format CR-{YEAR}-{NNNNN}", () => {
    it("should generate reference number with correct format", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00000` }]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result).toMatch(/^CR-\d{4}-\d{5}$/);
      expect(result.startsWith("CR-")).toBe(true);
    });

    it("should include current year in reference number", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi.fn().mockResolvedValueOnce([]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result).toContain(`CR-${year}`);
    });
  });

  describe("Increments sequence within same year", () => {
    it("should increment from existing sequence", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00005` }]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result).toBe(`CR-${year}-00006`);
    });

    it("should increment multiple times", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any)
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi
                .fn()
                .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00010` }]),
            },
          });
        })
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi
                .fn()
                .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00011` }]),
            },
          });
        });

      const first = await generateReferenceNumber(cityId, prisma as any);
      const second = await generateReferenceNumber(cityId, prisma as any);

      expect(first).toBe(`CR-${year}-00011`);
      expect(second).toBe(`CR-${year}-00012`);
    });
  });

  describe("Resets sequence for new year", () => {
    it("should start at 00001 when no cases exist for year", async () => {
      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi.fn().mockResolvedValueOnce([]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result.endsWith("-00001")).toBe(true);
    });

    it("should handle year change correctly", async () => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;

      (prisma.$transaction as any)
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi
                .fn()
                .mockResolvedValueOnce([{ referenceNumber: `CR-${lastYear}-00099` }]),
            },
          });
        })
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi.fn().mockResolvedValueOnce([]),
            },
          });
        });

      await generateReferenceNumber(cityId, prisma as any);

      (prisma.$transaction as any).mockClear();
      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi.fn().mockResolvedValueOnce([]),
          },
        });
      });

      const newYearResult = await generateReferenceNumber(cityId, prisma as any);

      expect(newYearResult).toContain(`CR-${currentYear}`);
      expect(newYearResult.endsWith("-00001")).toBe(true);
    });
  });

  describe("Zero-pads to 5 digits", () => {
    it("should pad single digit to 00001", async () => {
      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi.fn().mockResolvedValueOnce([]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result.endsWith("-00001")).toBe(true);
    });

    it("should pad two digits to 00010", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00009` }]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result.endsWith("-00010")).toBe(true);
    });

    it("should pad three digits to 00100", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00099` }]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result.endsWith("-00100")).toBe(true);
    });

    it("should handle five digit numbers without padding", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          case: {
            findMany: vi
              .fn()
              .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-99999` }]),
          },
        });
      });

      const result = await generateReferenceNumber(cityId, prisma as any);

      expect(result).toBe(`CR-${year}-100000`);
    });
  });

  describe("Generates unique numbers for same city", () => {
    it("should generate different numbers when called multiple times", async () => {
      const year = new Date().getFullYear();

      (prisma.$transaction as any)
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi
                .fn()
                .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00001` }]),
            },
          });
        })
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi
                .fn()
                .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00002` }]),
            },
          });
        })
        .mockImplementationOnce(async (callback: any) => {
          return callback({
            case: {
              findMany: vi
                .fn()
                .mockResolvedValueOnce([{ referenceNumber: `CR-${year}-00003` }]),
            },
          });
        });

      const ref1 = await generateReferenceNumber(cityId, prisma as any);
      const ref2 = await generateReferenceNumber(cityId, prisma as any);
      const ref3 = await generateReferenceNumber(cityId, prisma as any);

      expect(ref1).not.toBe(ref2);
      expect(ref2).not.toBe(ref3);
      expect(ref1).toBe(`CR-${year}-00002`);
      expect(ref2).toBe(`CR-${year}-00003`);
      expect(ref3).toBe(`CR-${year}-00004`);
    });
  });

  describe("Validates reference number format", () => {
    it("should validate correct format CR-2024-00001", () => {
      const result = validateReferenceNumber("CR-2024-00001");

      expect(result).toBe(true);
    });

    it("should validate year with any 4 digits", () => {
      expect(validateReferenceNumber("CR-1999-00001")).toBe(true);
      expect(validateReferenceNumber("CR-2050-00001")).toBe(true);
    });

    it("should validate sequence with any 5 digits", () => {
      expect(validateReferenceNumber("CR-2024-00001")).toBe(true);
      expect(validateReferenceNumber("CR-2024-99999")).toBe(true);
      expect(validateReferenceNumber("CR-2024-12345")).toBe(true);
    });

    it("should reject lowercase cr", () => {
      const result = validateReferenceNumber("cr-2024-00001");

      expect(result).toBe(false);
    });

    it("should reject missing hyphen", () => {
      expect(validateReferenceNumber("CR2024-00001")).toBe(false);
      expect(validateReferenceNumber("CR-202400001")).toBe(false);
    });

    it("should reject wrong number of digits", () => {
      expect(validateReferenceNumber("CR-202-00001")).toBe(false);
      expect(validateReferenceNumber("CR-20244-00001")).toBe(false);
      expect(validateReferenceNumber("CR-2024-0001")).toBe(false);
      expect(validateReferenceNumber("CR-2024-000001")).toBe(false);
    });

    it("should reject non-numeric digits", () => {
      expect(validateReferenceNumber("CR-ABCD-00001")).toBe(false);
      expect(validateReferenceNumber("CR-2024-ABCDE")).toBe(false);
    });

    it("should reject extra characters", () => {
      expect(validateReferenceNumber("CR-2024-00001-extra")).toBe(false);
      expect(validateReferenceNumber("PREFIX-CR-2024-00001")).toBe(false);
    });
  });

  describe("Parses reference number", () => {
    it("should parse valid reference number", () => {
      const result = parseReferenceNumber("CR-2024-00001");

      expect(result).toBeDefined();
      expect(result?.prefix).toBe("CR");
      expect(result?.year).toBe(2024);
      expect(result?.sequence).toBe(1);
    });

    it("should parse with different years", () => {
      const result1999 = parseReferenceNumber("CR-1999-12345");
      expect(result1999?.year).toBe(1999);
      expect(result1999?.sequence).toBe(12345);

      const result2050 = parseReferenceNumber("CR-2050-99999");
      expect(result2050?.year).toBe(2050);
      expect(result2050?.sequence).toBe(99999);
    });

    it("should return null for invalid format", () => {
      expect(parseReferenceNumber("INVALID")).toBeNull();
      expect(parseReferenceNumber("cr-2024-00001")).toBeNull();
      expect(parseReferenceNumber("CR-2024-0001")).toBeNull();
    });

    it("should extract sequence number correctly", () => {
      const result = parseReferenceNumber("CR-2024-00123");

      expect(result?.sequence).toBe(123);
    });

    it("should handle leading zeros in sequence", () => {
      const result = parseReferenceNumber("CR-2024-00001");

      expect(result?.sequence).toBe(1);
    });
  });
});

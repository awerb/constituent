import type { PrismaClient } from "@prisma/client";

/**
 * Generate a reference number in the format "CR-{YEAR}-{SEQUENCE}"
 * For example: CR-2024-00001, CR-2024-00002
 *
 * Uses a database counter for thread-safe sequence generation
 */
export async function generateReferenceNumber(
  cityId: string,
  prisma: PrismaClient
): Promise<string> {
  const year = new Date().getFullYear();

  // Use a transaction to ensure thread-safe counter increment
  const result = await prisma.$transaction(async (tx) => {
    // First, try to find the highest existing sequence for this city and year
    const existingCases = await tx.case.findMany({
      where: {
        cityId,
        referenceNumber: {
          startsWith: `CR-${year}-`,
        },
      },
      select: { referenceNumber: true },
      orderBy: { referenceNumber: "desc" },
      take: 1,
    });

    let nextSequence = 1;

    if (existingCases.length > 0) {
      const lastRefNumber = existingCases[0].referenceNumber;
      const sequencePart = lastRefNumber.split("-")[2];
      const lastSequence = parseInt(sequencePart, 10);
      nextSequence = lastSequence + 1;
    }

    return {
      sequence: nextSequence,
      year,
    };
  });

  const sequenceStr = String(result.sequence).padStart(5, "0");
  return `CR-${result.year}-${sequenceStr}`;
}

/**
 * Validate a reference number format
 */
export function validateReferenceNumber(refNumber: string): boolean {
  const pattern = /^CR-\d{4}-\d{5}$/;
  return pattern.test(refNumber);
}

/**
 * Parse a reference number to extract components
 */
export function parseReferenceNumber(refNumber: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const pattern = /^CR-(\d{4})-(\d{5})$/;
  const match = refNumber.match(pattern);

  if (!match) {
    return null;
  }

  return {
    prefix: "CR",
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

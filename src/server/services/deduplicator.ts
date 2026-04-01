import { prisma } from "@/lib/db";

export interface DuplicateMatch {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: Date;
  caseCount: number;
  similarity: number; // 0-100
}

/**
 * Find potential duplicate constituents based on email, phone, and name matching
 */
export async function findDuplicates(
  cityId: string,
  email?: string,
  phone?: string,
  name?: string
): Promise<DuplicateMatch[]> {
  try {
    console.log(`Finding duplicates for city ${cityId}`);

    const whereConditions = [
      email && { email: { mode: "insensitive" as const, equals: email } },
      phone && { phone: { mode: "insensitive" as const, contains: phone } },
      name && { name: { mode: "insensitive" as const, contains: name } },
    ].filter(Boolean);

    if (whereConditions.length === 0) {
      console.log("No search criteria provided");
      return [];
    }

    const duplicates = await prisma.constituent.findMany({
      where: {
        cityId,
        OR: whereConditions as any,
      },
      include: {
        _count: { select: { cases: true } },
      },
    });

    // Calculate similarity scores
    const matches: DuplicateMatch[] = duplicates
      .map((dup) => ({
        id: dup.id,
        email: dup.email,
        name: dup.name,
        phone: dup.phone,
        createdAt: dup.createdAt,
        caseCount: dup._count.cases,
        similarity: calculateSimilarity({
          searchEmail: email,
          searchPhone: phone,
          searchName: name,
          dupEmail: dup.email,
          dupPhone: dup.phone,
          dupName: dup.name,
        }),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    console.log(`Found ${matches.length} potential duplicates`);

    return matches;
  } catch (error) {
    console.error("Error finding duplicates:", error);
    throw error;
  }
}

/**
 * Merge two constituent records
 * Moves all cases and signals to primary, deactivates duplicate
 */
export async function mergeConstituents(
  primaryId: string,
  duplicateId: string
): Promise<void> {
  try {
    console.log(`Merging constituent ${duplicateId} into ${primaryId}`);

    if (primaryId === duplicateId) {
      throw new Error("Cannot merge a constituent with itself");
    }

    // Verify both constituents exist
    const primary = await prisma.constituent.findUniqueOrThrow({
      where: { id: primaryId },
    });

    const duplicate = await prisma.constituent.findUniqueOrThrow({
      where: { id: duplicateId },
    });

    // Move all cases from duplicate to primary
    const casesCount = await prisma.case.updateMany({
      where: { constituentId: duplicateId },
      data: { constituentId: primaryId },
    });

    console.log(`Moved ${casesCount.count} cases`);

    // Move all newsletter signals from duplicate to primary
    const signalsCount = await prisma.newsletterSignal.updateMany({
      where: { constituentId: duplicateId },
      data: { constituentId: primaryId },
    });

    console.log(`Moved ${signalsCount.count} signals`);

    // Move all messages from duplicate to primary
    const messagesCount = await prisma.caseMessage.updateMany({
      where: { authorId: duplicateId, authorType: "CONSTITUENT" },
      data: { authorId: primaryId },
    });

    console.log(`Moved ${messagesCount.count} messages`);

    // Merge metadata
    const mergedMetadata = {
      ...duplicate.metadata,
      ...primary.metadata,
      mergedFrom: {
        id: duplicate.id,
        email: duplicate.email,
        mergedAt: new Date().toISOString(),
      },
    };

    // Update primary with merged data
    await prisma.constituent.update({
      where: { id: primaryId },
      data: {
        // Keep primary name unless duplicate has more complete info
        name:
          !primary.name && duplicate.name
            ? duplicate.name
            : primary.name,
        // Use the phone from primary unless it's missing
        phone:
          !primary.phone && duplicate.phone
            ? duplicate.phone
            : primary.phone,
        // Use the address from primary unless it's missing
        address:
          !primary.address && duplicate.address
            ? duplicate.address
            : primary.address,
        metadata: mergedMetadata,
      },
    });

    console.log("Primary constituent updated with merged data");

    // Delete the duplicate record
    await prisma.constituent.delete({
      where: { id: duplicateId },
    });

    console.log(`Duplicate constituent ${duplicateId} deleted`);
  } catch (error) {
    console.error("Error merging constituents:", error);
    throw error;
  }
}

/**
 * Calculate similarity score between search criteria and duplicate
 */
function calculateSimilarity(data: {
  searchEmail?: string;
  searchPhone?: string;
  searchName?: string;
  dupEmail: string;
  dupPhone: string | null;
  dupName: string | null;
}): number {
  let score = 0;
  let criteria = 0;

  // Email match (highest priority)
  if (data.searchEmail) {
    criteria++;
    if (
      data.searchEmail.toLowerCase() === data.dupEmail.toLowerCase()
    ) {
      score += 100;
    } else if (data.dupEmail.toLowerCase().includes(data.searchEmail.toLowerCase())) {
      score += 50;
    }
  }

  // Phone match (medium priority)
  if (data.searchPhone && data.dupPhone) {
    criteria++;
    const searchPhoneClean = data.searchPhone.replace(/\D/g, "");
    const dupPhoneClean = data.dupPhone.replace(/\D/g, "");

    if (searchPhoneClean === dupPhoneClean) {
      score += 80;
    } else if (searchPhoneClean.endsWith(dupPhoneClean.slice(-7))) {
      score += 40;
    }
  }

  // Name match (lowest priority)
  if (data.searchName && data.dupName) {
    criteria++;
    const levenshteinDist = calculateLevenshteinDistance(
      data.searchName.toLowerCase(),
      data.dupName.toLowerCase()
    );
    const maxLen = Math.max(data.searchName.length, data.dupName.length);
    const similarity = Math.max(0, 1 - levenshteinDist / maxLen);

    score += similarity * 50;
  }

  return criteria > 0 ? Math.round(score / criteria) : 0;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Get merge preview - what would happen if we merged these constituents
 */
export async function getMergePreview(
  primaryId: string,
  duplicateId: string
): Promise<{
  primaryConstituent: any;
  duplicateConstituent: any;
  casesAffected: number;
  signalsAffected: number;
  mergedResult: any;
}> {
  try {
    const primary = await prisma.constituent.findUniqueOrThrow({
      where: { id: primaryId },
      include: { _count: { select: { cases: true, newsletterSignals: true } } },
    });

    const duplicate = await prisma.constituent.findUniqueOrThrow({
      where: { id: duplicateId },
      include: { _count: { select: { cases: true, newsletterSignals: true } } },
    });

    const mergedMetadata = {
      ...duplicate.metadata,
      ...primary.metadata,
    };

    return {
      primaryConstituent: primary,
      duplicateConstituent: duplicate,
      casesAffected: duplicate._count.cases,
      signalsAffected: duplicate._count.newsletterSignals,
      mergedResult: {
        id: primary.id,
        email: primary.email,
        name: !primary.name && duplicate.name ? duplicate.name : primary.name,
        phone: !primary.phone && duplicate.phone ? duplicate.phone : primary.phone,
        address: !primary.address && duplicate.address ? duplicate.address : primary.address,
        languagePreference: primary.languagePreference,
        metadata: mergedMetadata,
        totalCases: primary._count.cases + duplicate._count.cases,
        totalSignals: primary._count.newsletterSignals + duplicate._count.newsletterSignals,
      },
    };
  } catch (error) {
    console.error("Error getting merge preview:", error);
    throw error;
  }
}

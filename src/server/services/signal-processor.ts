import { prisma } from "@/lib/db";
import { generateReferenceNumber } from "@/lib/ref-number";
import { calculateSlaDeadline, type SLAConfig } from "@/lib/sla";
import { routeCase } from "./case-router";
import { notify } from "./notifier";
import { NotificationEvent } from "@/lib/notifications";

export interface ProcessSignalInput {
  cityId: string;
  constituentEmail: string;
  constituentName?: string;
  newsletterExternalId: string;
  newsletterTitle: string;
  newsletterSummary: string;
  topicTags: string[];
  sourceUrl: string;
  tcDataUrl: string;
  signalType: "FLAG" | "APPLAUD";
  note?: string;
  noteLanguage?: string;
}

export interface ProcessSignalResult {
  referenceNumber?: string;
  status: "created" | "updated" | "duplicated";
  signalId: string;
  caseId?: string;
}

/**
 * Process newsletter flag/applaud signals
 * Handles constituent creation, newsletter tracking, idempotency, and case routing
 */
export async function processSignal(input: ProcessSignalInput): Promise<ProcessSignalResult> {
  try {
    console.log(`Processing signal: ${input.signalType} for newsletter ${input.newsletterExternalId}`);

    // Step 1: Find or create constituent
    const constituent = await prisma.constituent.upsert({
      where: {
        cityId_email: {
          cityId: input.cityId,
          email: input.constituentEmail,
        },
      },
      update: {
        name: input.constituentName || undefined,
      },
      create: {
        cityId: input.cityId,
        email: input.constituentEmail,
        name: input.constituentName,
        languagePreference: input.noteLanguage || "en",
      },
    });

    console.log(`Constituent ${constituent.id} found/created`);

    // Step 2: Find or create newsletter item
    const newsletterItem = await prisma.newsletterItem.upsert({
      where: {
        cityId_externalId: {
          cityId: input.cityId,
          externalId: input.newsletterExternalId,
        },
      },
      update: {},
      create: {
        cityId: input.cityId,
        externalId: input.newsletterExternalId,
        title: input.newsletterTitle,
        summary: input.newsletterSummary,
        topicTags: input.topicTags,
        sourceUrl: input.sourceUrl,
        transparentCityDataUrl: input.tcDataUrl,
        publishedAt: new Date(),
      },
    });

    console.log(`Newsletter item ${newsletterItem.id} found/created`);

    // Step 3: Check idempotency - signal already exists?
    const existingSignal = await prisma.newsletterSignal.findUnique({
      where: {
        newsletterItemId_constituentId_signalType: {
          newsletterItemId: newsletterItem.id,
          constituentId: constituent.id,
          signalType: input.signalType as any,
        },
      },
    });

    if (existingSignal) {
      console.log(`Signal already exists: ${existingSignal.id}`);
      return {
        status: "duplicated",
        signalId: existingSignal.id,
        caseId: existingSignal.caseId || undefined,
      };
    }

    // Step 4: Create the signal record
    const signal = await prisma.newsletterSignal.create({
      data: {
        cityId: input.cityId,
        newsletterItemId: newsletterItem.id,
        constituentId: constituent.id,
        signalType: input.signalType as any,
        note: input.note,
        noteLanguage: input.noteLanguage,
      },
    });

    console.log(`Signal created: ${signal.id}`);

    // Step 5: Handle FLAG vs APPLAUD
    let caseId: string | undefined;
    let referenceNumber: string | undefined;

    if (input.signalType === "FLAG") {
      ({ caseId, referenceNumber } = await handleFlagSignal(
        input,
        constituent,
        newsletterItem,
        signal.id
      ));
    } else if (input.signalType === "APPLAUD") {
      // For APPLAUD, only create case if note exists and looks like it needs response
      if (input.note && input.note.length > 20) {
        ({ caseId, referenceNumber } = await handleApplaudSignal(
          input,
          constituent,
          newsletterItem,
          signal.id
        ));
      }
    }

    // Step 6: Update newsletter counts
    if (input.signalType === "FLAG") {
      await prisma.newsletterItem.update({
        where: { id: newsletterItem.id },
        data: { flagCount: { increment: 1 } },
      });
    } else if (input.signalType === "APPLAUD") {
      await prisma.newsletterItem.update({
        where: { id: newsletterItem.id },
        data: { applaudCount: { increment: 1 } },
      });
    }

    return {
      referenceNumber,
      status: "created",
      signalId: signal.id,
      caseId,
    };
  } catch (error) {
    console.error("Error processing signal:", error);
    throw error;
  }
}

/**
 * Handle FLAG signal - check if case exists, add message, or create new case
 */
async function handleFlagSignal(
  input: ProcessSignalInput,
  constituent: any,
  newsletterItem: any,
  signalId: string
): Promise<{ caseId?: string; referenceNumber?: string }> {
  // Check if case already exists for this newsletter item
  const existingCase = await prisma.case.findFirst({
    where: {
      newsletterItemId: newsletterItem.id,
      status: { not: "CLOSED" },
    },
  });

  if (existingCase) {
    console.log(`Case exists for this newsletter: ${existingCase.id}`);
    // Add note as message to existing case
    if (input.note) {
      await prisma.caseMessage.create({
        data: {
          caseId: existingCase.id,
          authorType: "CONSTITUENT",
          authorId: constituent.id,
          content: input.note,
          contentLanguage: input.noteLanguage,
        },
      });
    }
    return { caseId: existingCase.id };
  }

  // Create new case for this FLAG
  const referenceNumber = await generateReferenceNumber(input.cityId, prisma);
  const { departmentId } = await routeCase(input.cityId, input.topicTags);

  // Get SLA config for this department
  const slaConfig = await prisma.slaConfig.findFirst({
    where: {
      cityId: input.cityId,
      departmentId,
      priority: "NORMAL",
    },
  });

  // Get city timezone for SLA calculation
  const city = await prisma.city.findUniqueOrThrow({
    where: { id: input.cityId },
  });

  const slaDeadline = slaConfig
    ? calculateSlaDeadline(new Date(), slaConfig.responseHours, {
        businessHoursStart: slaConfig.businessHoursStart,
        businessHoursEnd: slaConfig.businessHoursEnd,
        businessDays: slaConfig.businessDays,
        timezone: city.timezone,
      })
    : undefined;

  const newCase = await prisma.case.create({
    data: {
      cityId: input.cityId,
      referenceNumber,
      constituentId: constituent.id,
      subject: `Newsletter Flag: ${input.newsletterTitle}`,
      description: `Constituent flagged newsletter item: ${input.newsletterTitle}\n\nNewsletter Summary: ${input.newsletterSummary}\n\nSource: ${input.sourceUrl}`,
      status: "NEW",
      priority: "NORMAL",
      source: "NEWSLETTER_FLAG",
      departmentId,
      newsletterItemId: newsletterItem.id,
      slaDeadline,
      transparentCityContext: {
        sourceUrl: input.sourceUrl,
        tcDataUrl: input.tcDataUrl,
        topicTags: input.topicTags,
      },
    },
  });

  console.log(`Case created: ${newCase.id} with reference ${referenceNumber}`);

  // Add initial message if note provided
  if (input.note) {
    await prisma.caseMessage.create({
      data: {
        caseId: newCase.id,
        authorType: "CONSTITUENT",
        authorId: constituent.id,
        content: input.note,
        contentLanguage: input.noteLanguage,
      },
    });
  }

  // Update signal with case ID
  await prisma.newsletterSignal.update({
    where: { id: signalId },
    data: { caseId: newCase.id },
  });

  // Notify department about new case
  const department = await prisma.department.findUniqueOrThrow({
    where: { id: departmentId },
  });

  const managers = await prisma.user.findMany({
    where: {
      cityId: input.cityId,
      departmentId,
      role: { in: ["MANAGER", "ADMIN"] },
      isActive: true,
    },
  });

  for (const manager of managers) {
    await notify(manager.id, NotificationEvent.CASE_CREATED, {
      caseId: newCase.id,
      referenceNumber,
      constituentName: constituent.name || input.constituentEmail,
      subject: newCase.subject,
    });
  }

  return { caseId: newCase.id, referenceNumber };
}

/**
 * Handle APPLAUD signal - only create case if note is substantial
 */
async function handleApplaudSignal(
  input: ProcessSignalInput,
  constituent: any,
  newsletterItem: any,
  signalId: string
): Promise<{ caseId?: string; referenceNumber?: string }> {
  // APPLAUD signals typically don't need cases unless note is substantial
  // Check if note looks like it needs response (contains question, request, etc.)
  if (!input.note || input.note.length < 20) {
    console.log("Applaud signal note too short, skipping case creation");
    return {};
  }

  const referenceNumber = await generateReferenceNumber(input.cityId, prisma);
  const { departmentId } = await routeCase(input.cityId, input.topicTags);

  const city = await prisma.city.findUniqueOrThrow({
    where: { id: input.cityId },
  });

  const slaConfig = await prisma.slaConfig.findFirst({
    where: {
      cityId: input.cityId,
      departmentId,
      priority: "LOW",
    },
  });

  const slaDeadline = slaConfig
    ? calculateSlaDeadline(new Date(), slaConfig.responseHours, {
        businessHoursStart: slaConfig.businessHoursStart,
        businessHoursEnd: slaConfig.businessHoursEnd,
        businessDays: slaConfig.businessDays,
        timezone: city.timezone,
      })
    : undefined;

  const newCase = await prisma.case.create({
    data: {
      cityId: input.cityId,
      referenceNumber,
      constituentId: constituent.id,
      subject: `Newsletter Applaud: ${input.newsletterTitle}`,
      description: `Constituent applauded newsletter item: ${input.newsletterTitle}\n\nComment: ${input.note}`,
      status: "NEW",
      priority: "LOW",
      source: "NEWSLETTER_FLAG",
      departmentId,
      newsletterItemId: newsletterItem.id,
      slaDeadline,
    },
  });

  await prisma.caseMessage.create({
    data: {
      caseId: newCase.id,
      authorType: "CONSTITUENT",
      authorId: constituent.id,
      content: input.note,
      contentLanguage: input.noteLanguage,
    },
  });

  await prisma.newsletterSignal.update({
    where: { id: signalId },
    data: { caseId: newCase.id },
  });

  return { caseId: newCase.id, referenceNumber };
}

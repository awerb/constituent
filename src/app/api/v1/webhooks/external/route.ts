import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const ExternalWebhookSchema = z.object({
  event: z.enum(["case.statusUpdate", "case.note"]),
  data: z.record(z.any()),
  referenceNumber: z.string().min(1),
});

type ExternalWebhookPayload = z.infer<typeof ExternalWebhookSchema>;

/**
 * Verify HMAC-SHA256 signature from external system
 */
function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Validate that status is a valid CaseStatus enum value
 */
function isValidCaseStatus(status: string): boolean {
  const validStatuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"];
  return validStatuses.includes(status);
}

/**
 * Handle case.statusUpdate event
 */
async function handleCaseStatusUpdate(
  referenceNumber: string,
  data: Record<string, any>
): Promise<void> {
  const { status, externalId, externalUpdatedAt } = data;

  if (!status) {
    throw new Error("Missing status in statusUpdate event");
  }

  if (!isValidCaseStatus(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  // Find case
  const caseRecord = await prisma.case.findUnique({
    where: { referenceNumber },
  });

  if (!caseRecord) {
    throw new Error(`Case not found: ${referenceNumber}`);
  }

  // Prepare update data
  const updateData: Record<string, any> = {
    status,
  };

  // Track state transitions
  if (status === "ASSIGNED" && caseRecord.status === "NEW") {
    // First assignment
  } else if (status === "RESOLVED" && !caseRecord.resolvedAt) {
    updateData.resolvedAt = new Date();
  } else if (status === "CLOSED") {
    updateData.closedAt = new Date();
  }

  if (status !== "NEW" && !caseRecord.firstRespondedAt) {
    updateData.firstRespondedAt = new Date();
  }

  await prisma.case.update({
    where: { id: caseRecord.id },
    data: updateData,
  });

  console.log(`Updated case status: ${referenceNumber} -> ${status}`);
}

/**
 * Handle case.note event
 */
async function handleCaseNote(
  referenceNumber: string,
  data: Record<string, any>
): Promise<void> {
  const { content, authorName, isInternalNote, externalId } = data;

  if (!content) {
    throw new Error("Missing content in note event");
  }

  // Find case
  const caseRecord = await prisma.case.findUnique({
    where: { referenceNumber },
    include: { constituent: true },
  });

  if (!caseRecord) {
    throw new Error(`Case not found: ${referenceNumber}`);
  }

  // Create message (attributed to SYSTEM since it's from external system)
  await prisma.caseMessage.create({
    data: {
      caseId: caseRecord.id,
      authorType: "SYSTEM",
      authorId: "external-system",
      content,
      isInternalNote: isInternalNote === true,
      isPublicRecordsExcluded: isInternalNote === true,
    },
  });

  console.log(`Added note to case: ${referenceNumber}`);
}

/**
 * POST /api/v1/webhooks/external - Inbound webhook from external 311/CRM systems
 * Processes case updates from external systems
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from query parameter or header
    // In production, this should come from database configuration
    const webhookSecret =
      request.headers.get("X-Webhook-Secret") ||
      new URL(request.url).searchParams.get("secret");

    if (!webhookSecret) {
      return NextResponse.json(
        {
          error: "missing_webhook_secret",
          message: "Webhook secret is required",
        },
        { status: 401 }
      );
    }

    // Get signature header
    const signature = request.headers.get("X-Signature");
    if (!signature) {
      return NextResponse.json(
        { error: "missing_signature", message: "X-Signature header is required" },
        { status: 401 }
      );
    }

    // Get request body as text for signature verification
    const body = await request.text();

    // Verify signature
    try {
      if (!verifySignature(body, signature, webhookSecret)) {
        return NextResponse.json(
          { error: "invalid_signature", message: "Invalid signature" },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Signature verification failed:", error);
      return NextResponse.json(
        { error: "signature_verification_failed", message: "Signature verification failed" },
        { status: 403 }
      );
    }

    // Parse webhook payload
    let payload: ExternalWebhookPayload;
    try {
      payload = ExternalWebhookSchema.parse(JSON.parse(body));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "validation_error",
            message: "Invalid webhook payload",
            details: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Process based on event type
    try {
      if (payload.event === "case.statusUpdate") {
        await handleCaseStatusUpdate(payload.referenceNumber, payload.data);
      } else if (payload.event === "case.note") {
        await handleCaseNote(payload.referenceNumber, payload.data);
      } else {
        return NextResponse.json(
          { error: "unknown_event", message: "Unknown event type" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error handling ${payload.event}:`, error);

      // Return 4xx for validation errors, 5xx for system errors
      if (error instanceof Error) {
        if (
          error.message.includes("not found") ||
          error.message.includes("Invalid") ||
          error.message.includes("Missing")
        ) {
          return NextResponse.json(
            {
              error: "event_processing_failed",
              message: error.message,
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          error: "event_processing_failed",
          message: "Failed to process webhook event",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        received: true,
        event: payload.event,
        referenceNumber: payload.referenceNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing external webhook:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "An error occurred processing the webhook",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { signalQueue } from "@/lib/queue";

const NewsletterWebhookSchema = z.object({
  event: z.enum(["newsletter.published", "signal.created"]),
  citySlug: z.string().min(1),
  data: z.record(z.any()),
});

type NewsletterWebhookPayload = z.infer<typeof NewsletterWebhookSchema>;

/**
 * Verify HMAC-SHA256 signature from Transparent City
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

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

/**
 * Handle newsletter.published event
 */
async function handleNewsletterPublished(
  cityId: string,
  data: Record<string, any>
): Promise<void> {
  const {
    externalId,
    title,
    summary,
    topicTags,
    sourceUrl,
    transparentCityDataUrl,
    publishedAt,
  } = data;

  if (!externalId || !title || !summary) {
    throw new Error("Missing required newsletter fields");
  }

  // Upsert newsletter item
  await prisma.newsletterItem.upsert({
    where: {
      cityId_externalId: {
        cityId,
        externalId,
      },
    },
    update: {
      title,
      summary,
      topicTags: topicTags || [],
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
    create: {
      cityId,
      externalId,
      title,
      summary,
      topicTags: topicTags || [],
      sourceUrl: sourceUrl || "",
      transparentCityDataUrl: transparentCityDataUrl || "",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });

  console.log(`Upserted newsletter item: ${externalId}`);
}

/**
 * Handle signal.created event (delegate to signal processor)
 */
async function handleSignalCreated(
  cityId: string,
  data: Record<string, any>
): Promise<void> {
  const {
    constituentEmail,
    constituentName,
    newsletterExternalId,
    newsletterTitle,
    newsletterSummary,
    topicTags,
    sourceUrl,
    transparentCityDataUrl,
    signalType,
    note,
    noteLanguage,
  } = data;

  if (
    !constituentEmail ||
    !newsletterExternalId ||
    !signalType
  ) {
    throw new Error("Missing required signal fields");
  }

  // Queue for processing with signal processor
  await signalQueue.add(
    `process-signal-${signalType.toLowerCase()}`,
    {
      cityId,
      constituentEmail,
      constituentName,
      newsletterExternalId,
      newsletterTitle: newsletterTitle || "Newsletter",
      newsletterSummary: newsletterSummary || "",
      topicTags: topicTags || [],
      sourceUrl: sourceUrl || "",
      tcDataUrl: transparentCityDataUrl || "",
      signalType,
      note,
      noteLanguage,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );

  console.log(`Queued signal for processing: ${constituentEmail}`);
}

/**
 * POST /api/v1/webhooks/newsletter - Inbound webhook from Transparent City
 * Processes newsletter events: newsletter.published, signal.created
 */
export async function POST(request: NextRequest) {
  try {
    // Get signature header
    const signature = request.headers.get("X-TC-Signature");
    if (!signature) {
      return NextResponse.json(
        { error: "missing_signature", message: "X-TC-Signature header is required" },
        { status: 401 }
      );
    }

    // Get request body as text for signature verification
    const body = await request.text();

    // Parse webhook payload
    let payload: NewsletterWebhookPayload;
    try {
      payload = NewsletterWebhookSchema.parse(JSON.parse(body));
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

    // Find city
    const city = await prisma.city.findUnique({
      where: { slug: payload.citySlug },
    });

    if (!city) {
      return NextResponse.json(
        { error: "city_not_found", message: "City not found" },
        { status: 404 }
      );
    }

    // Verify signature if webhook secret is configured
    if (city.transparentCityWebhookSecret) {
      try {
        if (!verifySignature(body, signature, city.transparentCityWebhookSecret)) {
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
    }

    // Process based on event type
    try {
      if (payload.event === "newsletter.published") {
        await handleNewsletterPublished(city.id, payload.data);
      } else if (payload.event === "signal.created") {
        await handleSignalCreated(city.id, payload.data);
      } else {
        return NextResponse.json(
          { error: "unknown_event", message: "Unknown event type" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error handling ${payload.event}:`, error);
      return NextResponse.json(
        {
          error: "event_processing_failed",
          message: "Failed to process webhook event",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { received: true, event: payload.event },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing newsletter webhook:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "An error occurred processing the webhook",
      },
      { status: 500 }
    );
  }
}

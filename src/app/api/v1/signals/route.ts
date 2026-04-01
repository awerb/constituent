import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { signalQueue } from "@/lib/queue";
import { rateLimit, getClientIp, attachRateLimitHeaders } from "@/lib/rate-limit";
import { generateReferenceNumber } from "@/lib/ref-number";

const SignalRequestSchema = z.object({
  citySlug: z.string().min(1, "citySlug is required"),
  constituentEmail: z.string().email("Invalid email format"),
  constituentName: z.string().optional(),
  newsletterExternalId: z.string().min(1, "newsletterExternalId is required"),
  newsletterTitle: z.string().min(1, "newsletterTitle is required"),
  newsletterSummary: z.string().min(1, "newsletterSummary is required"),
  topicTags: z.array(z.string()).min(1, "topicTags must contain at least one tag"),
  sourceUrl: z.string().url("sourceUrl must be a valid URL"),
  transparentCityDataUrl: z.string().url("transparentCityDataUrl must be a valid URL"),
  signalType: z.enum(["FLAG", "APPLAUD"], {
    errorMap: () => ({ message: "signalType must be FLAG or APPLAUD" }),
  }),
  note: z.string().optional(),
  noteLanguage: z.string().optional(),
});

type SignalRequest = z.infer<typeof SignalRequestSchema>;

/**
 * Verify HMAC-SHA256 signature
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
 * POST /api/v1/signals - Newsletter signal endpoint
 * Validates API key, HMAC signature, and queues signal for processing
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Apply rate limiting: 10 requests per minute per IP
    const rateLimitResult = await rateLimit(ip, 10, 60 * 1000);

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
      attachRateLimitHeaders(response, rateLimitResult);
      return response;
    }

    // Get headers
    const apiKey = request.headers.get("X-TC-Api-Key");
    const signature = request.headers.get("X-TC-Signature");

    if (!apiKey) {
      return NextResponse.json(
        { error: "missing_api_key", message: "X-TC-Api-Key header is required" },
        { status: 401 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: "missing_signature", message: "X-TC-Signature header is required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.text();
    let payload: SignalRequest;

    try {
      payload = SignalRequestSchema.parse(JSON.parse(body));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "validation_error",
            message: "Invalid request body",
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

    // Find city and verify API credentials
    const city = await prisma.city.findUnique({
      where: { slug: payload.citySlug },
    });

    if (!city) {
      return NextResponse.json(
        { error: "city_not_found", message: "City not found" },
        { status: 404 }
      );
    }

    if (!city.transparentCityApiKey) {
      return NextResponse.json(
        {
          error: "api_key_not_configured",
          message: "API key not configured for this city",
        },
        { status: 500 }
      );
    }

    // Verify API key
    if (apiKey !== city.transparentCityApiKey) {
      return NextResponse.json(
        { error: "invalid_api_key", message: "Invalid API key" },
        { status: 403 }
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

    // Queue the signal for processing
    const job = await signalQueue.add(
      `process-signal-${payload.signalType.toLowerCase()}`,
      {
        cityId: city.id,
        constituentEmail: payload.constituentEmail,
        constituentName: payload.constituentName,
        newsletterExternalId: payload.newsletterExternalId,
        newsletterTitle: payload.newsletterTitle,
        newsletterSummary: payload.newsletterSummary,
        topicTags: payload.topicTags,
        sourceUrl: payload.sourceUrl,
        tcDataUrl: payload.transparentCityDataUrl,
        signalType: payload.signalType,
        note: payload.note,
        noteLanguage: payload.noteLanguage,
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

    const response = NextResponse.json(
      {
        signalId: job.id,
        status: "queued",
        message: "Signal queued for processing",
      },
      { status: 202 }
    );

    attachRateLimitHeaders(response, rateLimitResult);
    return response;
  } catch (error) {
    console.error("Error processing signal:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "An error occurred processing your request",
      },
      { status: 500 }
    );
  }
}

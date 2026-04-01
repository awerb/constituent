import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { privacyQueue, emailQueue } from "@/lib/queue";
import { rateLimit, getClientIp, attachRateLimitHeaders } from "@/lib/rate-limit";

const PrivacyRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  citySlug: z.string().optional(),
  requestType: z.enum(["export", "deletion"], {
    errorMap: () => ({ message: "requestType must be 'export' or 'deletion'" }),
  }),
});

type PrivacyRequest = z.infer<typeof PrivacyRequestSchema>;

/**
 * Get default city for single-tenant mode
 */
async function getDefaultCity() {
  return prisma.city.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

/**
 * POST /api/v1/privacy - Data export/deletion request
 * Handles GDPR/CCPA data access and deletion requests
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Apply rate limiting: 3 requests per minute per IP
    const rateLimitResult = await rateLimit(ip, 3, 60 * 1000);

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

    // Parse and validate request
    const body = await request.json();
    let payload: PrivacyRequest;

    try {
      payload = PrivacyRequestSchema.parse(body);
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

    // Find city
    let city;
    if (payload.citySlug) {
      city = await prisma.city.findUnique({
        where: { slug: payload.citySlug },
      });

      if (!city) {
        return NextResponse.json(
          { error: "city_not_found", message: "City not found" },
          { status: 404 }
        );
      }
    } else {
      // Single-tenant mode - get default city
      city = await getDefaultCity();

      if (!city) {
        return NextResponse.json(
          {
            error: "no_city_configured",
            message: "No city configured",
          },
          { status: 500 }
        );
      }
    }

    // Find constituent
    const constituent = await prisma.constituent.findUnique({
      where: {
        cityId_email: {
          cityId: city.id,
          email: payload.email,
        },
      },
    });

    if (!constituent) {
      // Return success even if not found (privacy protection)
      // Don't reveal whether email exists
      return NextResponse.json(
        {
          status: "request_received",
          message: "Your request has been received",
          estimatedProcessingTime: "48 hours",
        },
        { status: 202 }
      );
    }

    // Update privacy status based on request type
    const privacyStatus =
      payload.requestType === "export" ? "EXPORT_REQUESTED" : "DELETION_REQUESTED";

    await prisma.constituent.update({
      where: { id: constituent.id },
      data: {
        privacyStatus,
      },
    });

    // Queue the privacy request for processing
    const job = await privacyQueue.add(
      `process-privacy-${payload.requestType}`,
      {
        constituentId: constituent.id,
        email: constituent.email,
        requestType: payload.requestType,
        cityId: city.id,
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

    // Send confirmation email
    await emailQueue.add(
      "send-privacy-confirmation",
      {
        to: constituent.email,
        requestType: payload.requestType,
        referenceNumber: job.id,
        cityName: city.name,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    const response = NextResponse.json(
      {
        status: "request_received",
        message: "Your request has been received and is being processed",
        estimatedProcessingTime: "48 hours",
      },
      { status: 202 }
    );

    attachRateLimitHeaders(response, rateLimitResult);
    return response;
  } catch (error) {
    console.error("Error processing privacy request:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "An error occurred processing your request",
      },
      { status: 500 }
    );
  }
}

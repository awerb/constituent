import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp, attachRateLimitHeaders } from "@/lib/rate-limit";
import { generateReferenceNumber } from "@/lib/ref-number";
import { calculateSlaDeadline } from "@/lib/sla";
import { emailQueue } from "@/lib/queue";

const ContactRequestSchema = z.object({
  citySlug: z.string().min(1, "citySlug is required").optional(),
  name: z.string().min(2, "name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  subject: z.string().min(5, "subject must be at least 5 characters"),
  description: z.string().min(10, "description must be at least 10 characters"),
  department: z.string().optional(),
  language: z.string().default("en"),
});

type ContactRequest = z.infer<typeof ContactRequestSchema>;

/**
 * Get default city for single-tenant mode
 */
async function getDefaultCity() {
  return prisma.city.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

/**
 * POST /api/v1/contact - Public web contact form
 * Creates constituent and case from contact form submission
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Apply rate limiting: 5 requests per minute per IP
    const rateLimitResult = await rateLimit(ip, 5, 60 * 1000);

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
    let payload: ContactRequest;

    try {
      payload = ContactRequestSchema.parse(body);
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

    // Find or create constituent
    const constituent = await prisma.constituent.upsert({
      where: {
        cityId_email: {
          cityId: city.id,
          email: payload.email,
        },
      },
      update: {
        name: payload.name,
        phone: payload.phone || undefined,
        languagePreference: payload.language,
      },
      create: {
        cityId: city.id,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        languagePreference: payload.language,
      },
    });

    // Determine department
    let departmentId: string;

    if (payload.department) {
      const dept = await prisma.department.findFirst({
        where: {
          cityId: city.id,
          slug: payload.department.toLowerCase().replace(/\s+/g, "-"),
          isActive: true,
        },
      });

      if (dept) {
        departmentId = dept.id;
      } else {
        // Fall back to first active department
        const defaultDept = await prisma.department.findFirst({
          where: {
            cityId: city.id,
            isActive: true,
          },
          orderBy: { name: "asc" },
        });

        if (!defaultDept) {
          return NextResponse.json(
            {
              error: "no_departments_available",
              message: "No departments available",
            },
            { status: 500 }
          );
        }

        departmentId = defaultDept.id;
      }
    } else {
      // Auto-route to first available department
      const defaultDept = await prisma.department.findFirst({
        where: {
          cityId: city.id,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });

      if (!defaultDept) {
        return NextResponse.json(
          {
            error: "no_departments_available",
            message: "No departments available",
          },
          { status: 500 }
        );
      }

      departmentId = defaultDept.id;
    }

    // Get SLA configuration
    const dept = await prisma.department.findUniqueOrThrow({
      where: { id: departmentId },
    });

    // Calculate SLA deadline (using department's default SLA hours)
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + dept.defaultSlaHours);

    // Create case
    const referenceNumber = await generateReferenceNumber(city.id);

    const caseRecord = await prisma.case.create({
      data: {
        cityId: city.id,
        referenceNumber,
        constituentId: constituent.id,
        subject: payload.subject,
        description: payload.description,
        source: "WEB_FORM",
        departmentId,
        priority: "NORMAL",
        status: "NEW",
        slaDeadline,
      },
    });

    // Send acknowledgment email
    await emailQueue.add(
      "send-acknowledgment",
      {
        to: constituent.email,
        constituentName: constituent.name,
        referenceNumber: caseRecord.referenceNumber,
        subject: payload.subject,
        language: payload.language,
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
        referenceNumber: caseRecord.referenceNumber,
        caseId: caseRecord.id,
        status: "received",
        message: "Your request has been received",
      },
      { status: 201 }
    );

    attachRateLimitHeaders(response, rateLimitResult);
    return response;
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "An error occurred processing your request",
      },
      { status: 500 }
    );
  }
}

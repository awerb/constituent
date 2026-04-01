import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp, attachRateLimitHeaders } from "@/lib/rate-limit";

/**
 * GET /api/v1/cases/[ref]/status - Public case status lookup
 * Returns case status without sensitive information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const ip = getClientIp(request);

    // Apply rate limiting: 30 requests per minute per IP
    const rateLimitResult = await rateLimit(ip, 30, 60 * 1000);

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

    // Validate reference number format (e.g., CR-2024-00147)
    const refRegex = /^[A-Z]{2}-\d{4}-\d{5}$/;
    if (!refRegex.test(params.ref)) {
      return NextResponse.json(
        {
          error: "invalid_reference_number",
          message: "Invalid reference number format",
        },
        { status: 400 }
      );
    }

    // Find case by reference number
    const caseRecord = await prisma.case.findUnique({
      where: { referenceNumber: params.ref },
      select: {
        referenceNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            name: true,
            slug: true,
          },
        },
        firstRespondedAt: true,
        resolvedAt: true,
      },
    });

    if (!caseRecord) {
      return NextResponse.json(
        {
          error: "case_not_found",
          message: "Case not found",
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json(
      {
        referenceNumber: caseRecord.referenceNumber,
        status: caseRecord.status,
        priority: caseRecord.priority,
        department: caseRecord.department.name,
        departmentSlug: caseRecord.department.slug,
        createdAt: caseRecord.createdAt,
        lastUpdatedAt: caseRecord.updatedAt,
        firstRespondedAt: caseRecord.firstRespondedAt,
        resolvedAt: caseRecord.resolvedAt,
      },
      { status: 200 }
    );

    attachRateLimitHeaders(response, rateLimitResult);
    return response;
  } catch (error) {
    console.error("Error fetching case status:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: "An error occurred fetching case status",
      },
      { status: 500 }
    );
  }
}

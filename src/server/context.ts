import type { NextRequest } from "next/server";
import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getCurrentCityId, setTenantContext } from "@/server/middleware/tenant";
import { initializeSingleTenantMode } from "@/server/middleware/tenant";

let singleTenantInitialized = false;

export interface CreateContextOptions {
  req?: NextRequest | Request;
}

export interface TRPCContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    cityId: string;
    ward?: string | null;
  } | null;
  cityId: string | null;
  prisma: PrismaClient;
  redis: Redis;
  req?: NextRequest | Request;
}

export async function createTRPCContext(opts: CreateContextOptions): Promise<TRPCContext> {
  // Initialize single tenant mode on first call
  if (!singleTenantInitialized) {
    try {
      await initializeSingleTenantMode(prisma);
      singleTenantInitialized = true;
    } catch (error) {
      console.error("Failed to initialize single tenant mode:", error);
    }
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    // For unauthenticated requests, try to get a cityId from single-tenant mode
    let cityId: string | null = null;
    try {
      const city = await prisma.city.findFirst({
        where: { isActive: true },
      });
      if (city) {
        cityId = city.id;
      }
    } catch (error) {
      console.error("Failed to get default city:", error);
    }

    return {
      user: null,
      cityId,
      prisma,
      redis,
      req: opts.req,
    };
  }

  const sessionUser = session.user as {
    id: string;
    email: string;
    name: string;
    role: string;
    cityId: string;
    ward?: string | null;
  };

  // Fetch the ward for the user (used by elected procedures)
  let ward: string | null = sessionUser.ward ?? null;
  if (ward === null) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { ward: true },
      });
      ward = dbUser?.ward ?? null;
    } catch (error) {
      console.error("Failed to fetch user ward:", error);
    }
  }

  const user = { ...sessionUser, ward };

  const cityId = user.cityId;

  return {
    user,
    cityId,
    prisma,
    redis,
    req: opts.req,
  };
}

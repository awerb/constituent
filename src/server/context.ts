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

  const user = session.user as {
    id: string;
    email: string;
    name: string;
    role: string;
    cityId: string;
  };

  const cityId = user.cityId;

  return {
    user,
    cityId,
    prisma,
    redis,
    req: opts.req,
  };
}

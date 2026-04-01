import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Role } from "@prisma/client";
import type { TRPCContext } from "@/server/context";
import { hasMinimumRole, AuthorizationError } from "@/server/middleware/auth";
import { setTenantContext } from "@/server/middleware/tenant";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  if (!ctx.cityId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unable to determine tenant context",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      cityId: ctx.cityId,
      prisma: ctx.prisma,
      redis: ctx.redis,
      req: ctx.req,
    },
  });
});

const setTenantContextMiddleware = t.middleware(async ({ ctx, next }) => {
  const cityId = ctx.cityId || (ctx.user?.cityId as string | null);

  if (!cityId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unable to determine tenant context",
    });
  }

  return next({
    ctx,
  });
});

const enforceRole = (minRole: Role) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const userRole = ctx.user.role as Role;

    if (!hasMinimumRole(userRole, minRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${minRole}`,
      });
    }

    return next({
      ctx: {
        user: ctx.user,
        cityId: ctx.cityId,
        prisma: ctx.prisma,
        redis: ctx.redis,
        req: ctx.req,
      },
    });
  });
};

const enforceElectedOfficial = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  const userRole = ctx.user.role as Role;

  if (userRole !== Role.ELECTED_OFFICIAL) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only elected officials can access this resource",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      cityId: ctx.cityId,
      prisma: ctx.prisma,
      redis: ctx.redis,
      req: ctx.req,
    },
  });
});

export const protectedProcedure = publicProcedure
  .use(enforceUserIsAuthed)
  .use(setTenantContextMiddleware);

export const adminProcedure = protectedProcedure.use(enforceRole(Role.ADMIN));

export const managerProcedure = protectedProcedure.use(enforceRole(Role.MANAGER));

export const agentProcedure = protectedProcedure.use(enforceRole(Role.AGENT));

export const electedProcedure = protectedProcedure.use(enforceElectedOfficial);

export const superAdminProcedure = protectedProcedure.use(enforceRole(Role.SUPER_ADMIN));

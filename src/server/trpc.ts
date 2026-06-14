import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Role } from "@prisma/client";
import type { TRPCContext } from "@/server/context";
import { hasMinimumRole } from "@/server/middleware/auth";

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

export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed);

// Role guards are defined as inline middleware on `protectedProcedure` so they
// inherit its narrowed context (user is non-null, cityId is a non-null string)
// instead of re-widening it back to the base nullable context.
const requireRole = (minRole: Role) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!hasMinimumRole(ctx.user.role as Role, minRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${minRole}`,
      });
    }
    return next();
  });

export const adminProcedure = requireRole(Role.ADMIN);

export const managerProcedure = requireRole(Role.MANAGER);

export const agentProcedure = requireRole(Role.AGENT);

export const superAdminProcedure = requireRole(Role.SUPER_ADMIN);

export const electedProcedure = protectedProcedure.use(({ ctx, next }) => {
  if ((ctx.user.role as Role) !== Role.ELECTED_OFFICIAL) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only elected officials can access this resource",
    });
  }
  return next();
});

import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const listSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
});

const getByIdSchema = z.object({
  id: z.string(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ward: z.string().optional(),
  district: z.string().optional(),
  languagePreference: z.string().optional(),
});

const requestExportSchema = z.object({
  id: z.string(),
});

const requestDeletionSchema = z.object({
  id: z.string(),
});

export const constituentsRouter = router({
  list: protectedProcedure.input(listSchema).query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.limit;

    const where: any = {
      cityId: ctx.cityId,
    };

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { email: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [constituents, total] = await Promise.all([
      ctx.prisma.constituent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: input.limit,
      }),
      ctx.prisma.constituent.count({ where }),
    ]);

    return {
      constituents,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    };
  }),

  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const constituent = await ctx.prisma.constituent.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
      include: {
        cases: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        newsletterSignals: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!constituent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Constituent not found",
      });
    }

    return constituent;
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.constituent.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Constituent not found",
      });
    }

    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.ward !== undefined) updateData.ward = input.ward;
    if (input.district !== undefined) updateData.district = input.district;
    if (input.languagePreference !== undefined) {
      updateData.languagePreference = input.languagePreference;
    }

    const updated = await ctx.prisma.constituent.update({
      where: { id: input.id },
      data: updateData,
    });

    await ctx.prisma.auditLog.create({
      data: {
        cityId: ctx.cityId,
        userId: ctx.user.id,
        action: "UPDATE",
        resourceType: "CONSTITUENT",
        resourceId: input.id,
        details: { changes: input },
      },
    });

    return updated;
  }),

  requestExport: protectedProcedure
    .input(requestExportSchema)
    .mutation(async ({ ctx, input }) => {
      const constituent = await ctx.prisma.constituent.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!constituent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Constituent not found",
        });
      }

      const updated = await ctx.prisma.constituent.update({
        where: { id: input.id },
        data: {
          privacyStatus: "EXPORT_REQUESTED",
        },
      });

      await ctx.redis.lpush(`privacy_queue:export`, JSON.stringify({ constituentId: input.id }));

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "REQUEST_EXPORT",
          resourceType: "CONSTITUENT",
          resourceId: input.id,
          details: { email: constituent.email },
        },
      });

      return updated;
    }),

  requestDeletion: managerProcedure
    .input(requestDeletionSchema)
    .mutation(async ({ ctx, input }) => {
      const constituent = await ctx.prisma.constituent.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!constituent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Constituent not found",
        });
      }

      const updated = await ctx.prisma.constituent.update({
        where: { id: input.id },
        data: {
          privacyStatus: "DELETION_REQUESTED",
        },
      });

      await ctx.redis.lpush(`privacy_queue:delete`, JSON.stringify({ constituentId: input.id }));

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "REQUEST_DELETION",
          resourceType: "CONSTITUENT",
          resourceId: input.id,
          details: { email: constituent.email },
        },
      });

      return updated;
    }),
});

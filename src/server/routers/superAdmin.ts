import { z } from "zod";
import { router, superAdminProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  state: z.string().min(2).max(2),
  timezone: z.string(),
});

const updateTenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

const getTenantStatsSchema = z.object({
  cityId: z.string(),
});

export const superAdminRouter = router({
  listTenants: superAdminProcedure.query(async ({ ctx }) => {
    const cities = await ctx.prisma.city.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        state: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            cases: true,
            constituents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return cities.map((city) => ({
      ...city,
      userCount: city._count.users,
      caseCount: city._count.cases,
      constituentCount: city._count.constituents,
    }));
  }),

  createTenant: superAdminProcedure
    .input(createTenantSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.city.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "City with this slug already exists",
        });
      }

      const city = await ctx.prisma.city.create({
        data: {
          name: input.name,
          slug: input.slug,
          state: input.state,
          timezone: input.timezone,
          settings: {},
          isActive: true,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: city.id,
          userId: ctx.user.id,
          action: "CREATE",
          resourceType: "CITY",
          resourceId: city.id,
          details: { name: city.name, slug: city.slug },
        },
      });

      return city;
    }),

  updateTenant: superAdminProcedure
    .input(updateTenantSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.city.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "City not found",
        });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.settings !== undefined) {
        updateData.settings = {
          ...existing.settings,
          ...input.settings,
        };
      }

      const updated = await ctx.prisma.city.update({
        where: { id: input.id },
        data: updateData,
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: input.id,
          userId: ctx.user.id,
          action: "UPDATE",
          resourceType: "CITY",
          resourceId: input.id,
          details: { changes: input },
        },
      });

      return updated;
    }),

  getTenantStats: superAdminProcedure
    .input(getTenantStatsSchema)
    .query(async ({ ctx, input }) => {
      const city = await ctx.prisma.city.findUnique({
        where: { id: input.cityId },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!city) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "City not found",
        });
      }

      const [users, cases, constituents, departments, activeUsers, newCasesThisWeek] =
        await Promise.all([
          ctx.prisma.user.count({
            where: { cityId: input.cityId },
          }),
          ctx.prisma.case.count({
            where: { cityId: input.cityId },
          }),
          ctx.prisma.constituent.count({
            where: { cityId: input.cityId },
          }),
          ctx.prisma.department.count({
            where: { cityId: input.cityId },
          }),
          ctx.prisma.user.count({
            where: { cityId: input.cityId, isActive: true },
          }),
          ctx.prisma.case.count({
            where: {
              cityId: input.cityId,
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

      const casesLastMonth = await ctx.prisma.case.count({
        where: {
          cityId: input.cityId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const openCases = await ctx.prisma.case.count({
        where: {
          cityId: input.cityId,
          status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS"] },
        },
      });

      const avgResponseTime = await ctx.prisma.case.findMany({
        where: {
          cityId: input.cityId,
          firstRespondedAt: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          firstRespondedAt: true,
        },
      });

      let avgResponseHours = 0;
      if (avgResponseTime.length > 0) {
        const total = avgResponseTime.reduce((sum, c) => {
          return sum + (c.firstRespondedAt!.getTime() - c.createdAt.getTime());
        }, 0);
        avgResponseHours = Math.round((total / avgResponseTime.length / 1000 / 60 / 60) * 10) / 10;
      }

      return {
        cityName: city.name,
        citySlug: city.slug,
        isActive: city.isActive,
        createdAt: city.createdAt,
        stats: {
          totalUsers: users,
          activeUsers,
          totalCases: cases,
          openCases,
          newCasesThisWeek,
          casesLastMonth,
          totalConstituents: constituents,
          totalDepartments: departments,
          avgResponseTimeHours: avgResponseHours,
        },
      };
    }),
});

import { z } from "zod";
import { router, electedProcedure } from "@/server/trpc";
import { CaseStatus } from "@prisma/client";

const districtSummarySchema = z.object({
  ward: z.string().optional(),
});

const topFlaggedSchema = z.object({
  ward: z.string().optional(),
  limit: z.number().int().positive().max(50).optional().default(10),
});

const topApplaudedSchema = z.object({
  ward: z.string().optional(),
  limit: z.number().int().positive().max(50).optional().default(10),
});

const responseComparisonSchema = z.object({
  ward: z.string().optional(),
});

const dashboardSchema = z.object({
  district: z.string().optional(),
});

export const electedRouter = router({
  getDashboard: electedProcedure
    .input(dashboardSchema)
    .query(async ({ ctx, input }) => {
      const ward = input.district || ctx.user.ward || undefined;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const constituentFilter = ward ? { constituent: { ward } } : {};

      const [
        flagsThisWeek,
        applaudsThisWeek,
        openCases,
        respondedCases,
        flagsPrevWeek,
        applaudsPrevWeek,
        flaggedItems,
        applaudedItems,
        cityCases,
        totalCases,
        resolvedCases,
      ] = await Promise.all([
        ctx.prisma.newsletterSignal.count({
          where: {
            cityId: ctx.cityId,
            signalType: "FLAG",
            createdAt: { gte: oneWeekAgo },
            ...constituentFilter,
          },
        }),
        ctx.prisma.newsletterSignal.count({
          where: {
            cityId: ctx.cityId,
            signalType: "APPLAUD",
            createdAt: { gte: oneWeekAgo },
            ...constituentFilter,
          },
        }),
        ctx.prisma.case.count({
          where: {
            cityId: ctx.cityId,
            status: {
              in: [CaseStatus.NEW, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS],
            },
            ...constituentFilter,
          },
        }),
        ctx.prisma.case.findMany({
          where: {
            cityId: ctx.cityId,
            firstRespondedAt: { not: null },
            createdAt: { gte: oneWeekAgo },
            ...constituentFilter,
          },
          select: { createdAt: true, firstRespondedAt: true },
        }),
        ctx.prisma.newsletterSignal.count({
          where: {
            cityId: ctx.cityId,
            signalType: "FLAG",
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
            ...constituentFilter,
          },
        }),
        ctx.prisma.newsletterSignal.count({
          where: {
            cityId: ctx.cityId,
            signalType: "APPLAUD",
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
            ...constituentFilter,
          },
        }),
        ctx.prisma.newsletterItem.findMany({
          where: {
            cityId: ctx.cityId,
            signals: {
              some: { signalType: "FLAG", ...(ward ? { constituent: { ward } } : {}) },
            },
          },
          select: {
            id: true,
            title: true,
            flagCount: true,
          },
          orderBy: { flagCount: "desc" },
          take: 10,
        }),
        ctx.prisma.newsletterItem.findMany({
          where: {
            cityId: ctx.cityId,
            signals: {
              some: { signalType: "APPLAUD", ...(ward ? { constituent: { ward } } : {}) },
            },
          },
          select: {
            id: true,
            title: true,
            applaudCount: true,
          },
          orderBy: { applaudCount: "desc" },
          take: 10,
        }),
        ctx.prisma.case.findMany({
          where: { cityId: ctx.cityId, firstRespondedAt: { not: null } },
          select: { createdAt: true, firstRespondedAt: true },
        }),
        ctx.prisma.case.count({
          where: { cityId: ctx.cityId, ...constituentFilter },
        }),
        ctx.prisma.case.findMany({
          where: {
            cityId: ctx.cityId,
            OR: [{ resolvedAt: { not: null } }, { closedAt: { not: null } }],
            ...constituentFilter,
          },
          select: { createdAt: true, resolvedAt: true, closedAt: true },
        }),
      ]);

      const avgHours = (
        cases: { createdAt: Date; firstRespondedAt: Date | null }[]
      ) => {
        if (cases.length === 0) return 0;
        const total = cases.reduce(
          (sum, c) =>
            sum + (c.firstRespondedAt!.getTime() - c.createdAt.getTime()),
          0
        );
        return Math.round((total / cases.length / 1000 / 60 / 60) * 10) / 10;
      };

      const districtAvg = avgHours(respondedCases);
      const cityWideAvg = avgHours(cityCases);

      const trend = (current: number, previous: number): "up" | "down" | "flat" =>
        current > previous ? "up" : current < previous ? "down" : "flat";

      let avgResolutionDays = 0;
      if (resolvedCases.length > 0) {
        const totalMs = resolvedCases.reduce((sum, c) => {
          const end = (c.resolvedAt || c.closedAt)!.getTime();
          return sum + (end - c.createdAt.getTime());
        }, 0);
        avgResolutionDays =
          Math.round((totalMs / resolvedCases.length / 1000 / 60 / 60 / 24) * 10) /
          10;
      }

      const respondedTotal = await ctx.prisma.case.count({
        where: { cityId: ctx.cityId, firstRespondedAt: { not: null }, ...constituentFilter },
      });
      const responsePercentage =
        totalCases > 0 ? Math.round((respondedTotal / totalCases) * 100) : 0;

      return {
        summary: {
          flagsThisWeek,
          applaudsThisWeek,
          openCases,
          avgResponseTime: districtAvg,
          flagsTrend: trend(flagsThisWeek, flagsPrevWeek),
          applaudsTrend: trend(applaudsThisWeek, applaudsPrevWeek),
          satisfactionScore:
            flagsThisWeek + applaudsThisWeek > 0
              ? Math.round(
                  (applaudsThisWeek / (flagsThisWeek + applaudsThisWeek)) * 100
                )
              : 0,
          avgResolutionDays,
          totalCases,
        },
        responseRate: {
          districtAvg,
          cityWideAvg,
          districtName: ward || "All Districts",
          percentage: responsePercentage,
        },
        topApplauded: applaudedItems.map((item) => ({
          id: item.id,
          title: item.title,
          applaudCount: item.applaudCount,
          department: "General",
        })),
        topFlagged: flaggedItems.map((item) => ({
          id: item.id,
          title: item.title,
          flagCount: item.flagCount,
          department: "General",
          caseStatus: "open" as const,
        })),
      };
    }),

  getDistrictSummary: electedProcedure
    .input(districtSummarySchema)
    .query(async ({ ctx, input }) => {
      const ward = input.ward || ctx.user.ward;

      if (!ward) {
        return {
          error: "No ward assigned to this elected official",
          flagsThisWeek: 0,
          applaudsThisWeek: 0,
          openCases: 0,
          avgResponseTime: 0,
          flagsTrend: [],
          applaudsTrend: [],
        };
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const [flagsThisWeek, applaudsThisWeek, openCases, responseTimes, flagsPrevWeek, applaudsPrevWeek] =
        await Promise.all([
          ctx.prisma.newsletterSignal.count({
            where: {
              cityId: ctx.cityId,
              signalType: "FLAG",
              createdAt: { gte: oneWeekAgo },
              constituent: { ward },
            },
          }),
          ctx.prisma.newsletterSignal.count({
            where: {
              cityId: ctx.cityId,
              signalType: "APPLAUD",
              createdAt: { gte: oneWeekAgo },
              constituent: { ward },
            },
          }),
          ctx.prisma.case.count({
            where: {
              cityId: ctx.cityId,
              status: { in: [CaseStatus.NEW, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS] },
              constituent: { ward },
            },
          }),
          ctx.prisma.case.findMany({
            where: {
              cityId: ctx.cityId,
              firstRespondedAt: { not: null },
              createdAt: { gte: oneWeekAgo },
              constituent: { ward },
            },
            select: {
              createdAt: true,
              firstRespondedAt: true,
            },
          }),
          ctx.prisma.newsletterSignal.count({
            where: {
              cityId: ctx.cityId,
              signalType: "FLAG",
              createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
              constituent: { ward },
            },
          }),
          ctx.prisma.newsletterSignal.count({
            where: {
              cityId: ctx.cityId,
              signalType: "APPLAUD",
              createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
              constituent: { ward },
            },
          }),
        ]);

      let avgResponseTime = 0;
      if (responseTimes.length > 0) {
        const totalMs = responseTimes.reduce(
          (sum, c) => sum + (c.firstRespondedAt!.getTime() - c.createdAt.getTime()),
          0
        );
        avgResponseTime = Math.round((totalMs / responseTimes.length / 1000 / 60 / 60) * 10) / 10;
      }

      const flagsTrend = flagsThisWeek > flagsPrevWeek
        ? `+${flagsThisWeek - flagsPrevWeek}`
        : flagsThisWeek < flagsPrevWeek
        ? `-${flagsPrevWeek - flagsThisWeek}`
        : "stable";

      const applaudsTrend = applaudsThisWeek > applaudsPrevWeek
        ? `+${applaudsThisWeek - applaudsPrevWeek}`
        : applaudsThisWeek < applaudsPrevWeek
        ? `-${applaudsPrevWeek - applaudsThisWeek}`
        : "stable";

      return {
        flagsThisWeek,
        applaudsThisWeek,
        openCases,
        avgResponseTime,
        flagsTrend,
        applaudsTrend,
      };
    }),

  getTopFlagged: electedProcedure
    .input(topFlaggedSchema)
    .query(async ({ ctx, input }) => {
      const ward = input.ward || ctx.user.ward;

      if (!ward) {
        return [];
      }

      const items = await ctx.prisma.newsletterItem.findMany({
        where: {
          cityId: ctx.cityId,
          signals: {
            some: {
              signalType: "FLAG",
              constituent: { ward },
            },
          },
        },
        select: {
          id: true,
          title: true,
          summary: true,
          topicTags: true,
          flagCount: true,
          applaudCount: true,
          signals: {
            where: {
              signalType: "FLAG",
              constituent: { ward },
            },
            select: { id: true },
          },
        },
        orderBy: { flagCount: "desc" },
        take: input.limit,
      });

      return items.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        topicTags: item.topicTags,
        flagCount: item.flagCount,
        districtFlags: item.signals.length,
      }));
    }),

  getTopApplauded: electedProcedure
    .input(topApplaudedSchema)
    .query(async ({ ctx, input }) => {
      const ward = input.ward || ctx.user.ward;

      if (!ward) {
        return [];
      }

      const items = await ctx.prisma.newsletterItem.findMany({
        where: {
          cityId: ctx.cityId,
          signals: {
            some: {
              signalType: "APPLAUD",
              constituent: { ward },
            },
          },
        },
        select: {
          id: true,
          title: true,
          summary: true,
          topicTags: true,
          flagCount: true,
          applaudCount: true,
          signals: {
            where: {
              signalType: "APPLAUD",
              constituent: { ward },
            },
            select: { id: true },
          },
        },
        orderBy: { applaudCount: "desc" },
        take: input.limit,
      });

      return items.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        topicTags: item.topicTags,
        applaudCount: item.applaudCount,
        districtApplauds: item.signals.length,
      }));
    }),

  getResponseComparison: electedProcedure
    .input(responseComparisonSchema)
    .query(async ({ ctx, input }) => {
      const ward = input.ward || ctx.user.ward;

      if (!ward) {
        return { districtAvg: 0, cityAvg: 0, difference: 0 };
      }

      const [districtCases, cityCases] = await Promise.all([
        ctx.prisma.case.findMany({
          where: {
            cityId: ctx.cityId,
            firstRespondedAt: { not: null },
            constituent: { ward },
          },
          select: {
            createdAt: true,
            firstRespondedAt: true,
          },
        }),
        ctx.prisma.case.findMany({
          where: {
            cityId: ctx.cityId,
            firstRespondedAt: { not: null },
          },
          select: {
            createdAt: true,
            firstRespondedAt: true,
          },
        }),
      ]);

      const calculateAvg = (
        cases: { createdAt: Date; firstRespondedAt: Date | null }[]
      ) => {
        if (cases.length === 0) return 0;
        const total = cases.reduce((sum, c) => {
          return sum + (c.firstRespondedAt!.getTime() - c.createdAt.getTime());
        }, 0);
        return Math.round((total / cases.length / 1000 / 60 / 60) * 10) / 10;
      };

      const districtAvg = calculateAvg(districtCases);
      const cityAvg = calculateAvg(cityCases);
      const difference = Math.round((districtAvg - cityAvg) * 10) / 10;

      return {
        districtAvg,
        cityAvg,
        difference,
        performanceStatus: difference < 0 ? "better" : difference > 0 ? "worse" : "same",
      };
    }),
});

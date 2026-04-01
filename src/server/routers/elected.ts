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

export const electedRouter = router({
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

      const calculateAvg = (cases: any[]) => {
        if (cases.length === 0) return 0;
        const total = cases.reduce((sum, c) => {
          return sum + (c.firstRespondedAt.getTime() - c.createdAt.getTime());
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

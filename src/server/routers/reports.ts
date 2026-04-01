import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "@/server/trpc";
import { CaseStatus } from "@prisma/client";

const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  departmentId: z.string().optional(),
});

const topIssuesSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const staffPerformanceSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  departmentId: z.string().optional(),
});

const newsletterEngagementSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const exportCsvSchema = z.object({
  reportType: z.enum(["caseVolume", "responseTimes", "topIssues", "staffPerformance"]),
  startDate: z.date(),
  endDate: z.date(),
  departmentId: z.string().optional(),
});

export const reportsRouter = router({
  caseVolume: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const cases = await ctx.prisma.case.findMany({
        where: {
          cityId: ctx.cityId,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
          ...(input.departmentId && { departmentId: input.departmentId }),
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          closedAt: true,
        },
      });

      const weeks: Record<string, { opened: number; closed: number }> = {};

      cases.forEach((c) => {
        const week = getWeekKey(c.createdAt);
        if (!weeks[week]) weeks[week] = { opened: 0, closed: 0 };
        weeks[week].opened++;

        if (c.closedAt) {
          const closedWeek = getWeekKey(c.closedAt);
          if (!weeks[closedWeek]) weeks[closedWeek] = { opened: 0, closed: 0 };
          weeks[closedWeek].closed++;
        }
      });

      return {
        data: Object.entries(weeks)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, stats]) => ({
            week,
            ...stats,
          })),
        totalOpened: cases.length,
        totalClosed: cases.filter((c) => c.status === CaseStatus.CLOSED).length,
      };
    }),

  responseTimes: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const cases = await ctx.prisma.case.findMany({
        where: {
          cityId: ctx.cityId,
          firstRespondedAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
          ...(input.departmentId && { departmentId: input.departmentId }),
        },
        include: {
          department: true,
        },
        select: {
          id: true,
          createdAt: true,
          firstRespondedAt: true,
          slaDeadline: true,
          slaBreached: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const byDept: Record<string, { times: number[]; breached: number }> = {};

      cases.forEach((c) => {
        const dept = c.department.name;
        if (!byDept[dept]) {
          byDept[dept] = { times: [], breached: 0 };
        }

        const responseHours =
          (c.firstRespondedAt!.getTime() - c.createdAt.getTime()) / 1000 / 60 / 60;
        byDept[dept].times.push(responseHours);

        if (c.slaBreached) byDept[dept].breached++;
      });

      const results = Object.entries(byDept).map(([dept, data]) => {
        const avg = data.times.reduce((a, b) => a + b, 0) / data.times.length;
        const slaMet = data.times.length - data.breached;
        return {
          department: dept,
          avgResponseTimeHours: Math.round(avg * 10) / 10,
          slaComplianceRate: Math.round((slaMet / data.times.length) * 100),
          casesAnalyzed: data.times.length,
        };
      });

      return {
        data: results,
        overallAvgResponseTime: Math.round(
          (results.reduce((sum, r) => sum + r.avgResponseTimeHours, 0) / results.length) * 10
        ) / 10,
      };
    }),

  topIssues: protectedProcedure
    .input(topIssuesSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.newsletterItem.findMany({
        where: {
          cityId: ctx.cityId,
          publishedAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        select: {
          id: true,
          title: true,
          flagCount: true,
          applaudCount: true,
          topicTags: true,
        },
        orderBy: { flagCount: "desc" },
        take: 20,
      });

      return items.map((item) => ({
        id: item.id,
        title: item.title,
        flagCount: item.flagCount,
        applaudCount: item.applaudCount,
        sentiment: item.flagCount > item.applaudCount ? "negative" : "positive",
        topicTags: item.topicTags,
      }));
    }),

  staffPerformance: managerProcedure
    .input(staffPerformanceSchema)
    .query(async ({ ctx, input }) => {
      const staff = await ctx.prisma.user.findMany({
        where: {
          cityId: ctx.cityId,
          ...(input.departmentId && { departmentId: input.departmentId }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          assignedCases: {
            where: {
              createdAt: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            select: {
              id: true,
              createdAt: true,
              firstRespondedAt: true,
              status: true,
              slaBreached: true,
            },
          },
        },
      });

      return staff.map((user) => {
        const cases = user.assignedCases;
        const closedCases = cases.filter((c) => c.status === CaseStatus.CLOSED);
        const respondedCases = cases.filter((c) => c.firstRespondedAt);

        let avgResponseTime = 0;
        if (respondedCases.length > 0) {
          const total = respondedCases.reduce((sum, c) => {
            return sum + (c.firstRespondedAt!.getTime() - c.createdAt.getTime());
          }, 0);
          avgResponseTime = Math.round((total / respondedCases.length / 1000 / 60 / 60) * 10) / 10;
        }

        const slaComplianceRate = cases.length > 0
          ? Math.round(((cases.length - cases.filter((c) => c.slaBreached).length) / cases.length) * 100)
          : 100;

        return {
          staffId: user.id,
          staffName: user.name,
          staffEmail: user.email,
          casesAssigned: cases.length,
          casesClosed: closedCases.length,
          avgResponseTimeHours: avgResponseTime,
          slaComplianceRate,
        };
      });
    }),

  newsletterEngagement: protectedProcedure
    .input(newsletterEngagementSchema)
    .query(async ({ ctx, input }) => {
      const signals = await ctx.prisma.newsletterSignal.findMany({
        where: {
          cityId: ctx.cityId,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        select: {
          createdAt: true,
          signalType: true,
          newsletterItem: {
            select: {
              topicTags: true,
            },
          },
        },
      });

      const byWeek: Record<string, { flags: number; applauds: number }> = {};
      const byTopic: Record<string, { flags: number; applauds: number }> = {};

      signals.forEach((signal) => {
        const week = getWeekKey(signal.createdAt);
        if (!byWeek[week]) byWeek[week] = { flags: 0, applauds: 0 };

        if (signal.signalType === "FLAG") {
          byWeek[week].flags++;
        } else {
          byWeek[week].applauds++;
        }

        signal.newsletterItem.topicTags.forEach((tag) => {
          if (!byTopic[tag]) byTopic[tag] = { flags: 0, applauds: 0 };
          if (signal.signalType === "FLAG") {
            byTopic[tag].flags++;
          } else {
            byTopic[tag].applauds++;
          }
        });
      });

      return {
        byWeek: Object.entries(byWeek)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, data]) => ({ week, ...data })),
        byTopic: Object.entries(byTopic)
          .map(([topic, data]) => ({ topic, ...data }))
          .sort((a, b) => b.flags + b.applauds - (a.flags + a.applauds)),
        totalFlags: signals.filter((s) => s.signalType === "FLAG").length,
        totalApplauds: signals.filter((s) => s.signalType === "APPLAUD").length,
      };
    }),

  exportCsv: protectedProcedure.input(exportCsvSchema).query(async ({ ctx, input }) => {
    let csv = "";

    if (input.reportType === "caseVolume") {
      const data = await ctx.prisma.case.findMany({
        where: {
          cityId: ctx.cityId,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        select: {
          referenceNumber: true,
          status: true,
          priority: true,
          createdAt: true,
          closedAt: true,
          constituent: { select: { email: true } },
        },
      });

      csv = "Reference,Status,Priority,Created,Closed,Constituent\n";
      data.forEach((row) => {
        csv += `${row.referenceNumber},${row.status},${row.priority},${row.createdAt.toISOString()},${row.closedAt?.toISOString() || ""},${row.constituent.email}\n`;
      });
    }

    return csv;
  }),
});

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const week = Math.ceil((d.getDate() - d.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

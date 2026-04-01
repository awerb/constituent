import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { CaseStatus, CasePriority } from "@prisma/client";

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [openCases, casesProcessedToday, avgResponseTime, flags] = await Promise.all([
      ctx.prisma.case.count({
        where: {
          cityId: ctx.cityId,
          status: { in: [CaseStatus.NEW, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS] },
        },
      }),
      ctx.prisma.case.count({
        where: {
          cityId: ctx.cityId,
          createdAt: { gte: startOfToday },
        },
      }),
      ctx.prisma.case.findMany({
        where: {
          cityId: ctx.cityId,
          firstRespondedAt: { not: null },
          createdAt: { gte: oneWeekAgo },
        },
        select: {
          createdAt: true,
          firstRespondedAt: true,
        },
      }),
      ctx.prisma.newsletterSignal.count({
        where: {
          cityId: ctx.cityId,
          createdAt: { gte: oneWeekAgo },
          signalType: "FLAG",
        },
      }),
    ]);

    let avgResponseTimeHours = 0;
    if (flags.length > 0) {
      const totalMs = flags.reduce((sum, c) => {
        const diff = (c.firstRespondedAt!.getTime() - c.createdAt.getTime()) / 1000 / 60 / 60;
        return sum + diff;
      }, 0);
      avgResponseTimeHours = Math.round((totalMs / flags.length) * 10) / 10;
    }

    return {
      openCases,
      casesProcessedToday,
      avgResponseTimeHours,
      newsletterFlagsThisWeek: flags,
    };
  }),

  getMyCases: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const cases = await ctx.prisma.case.findMany({
      where: {
        cityId: ctx.cityId,
        assignedToId: ctx.user.id,
        status: { not: CaseStatus.CLOSED },
      },
      include: {
        constituent: true,
        department: true,
        assignedTo: true,
      },
      orderBy: { slaDeadline: "asc" },
    });

    const casesWithSlaStatus = cases.map((c) => ({
      ...c,
      slaStatus: c.slaDeadline && c.slaDeadline < now ? "overdue" : "ontrack",
      hoursUntilSla: c.slaDeadline
        ? Math.round((c.slaDeadline.getTime() - now.getTime()) / 1000 / 60 / 60)
        : null,
    }));

    return casesWithSlaStatus;
  }),

  getNeedsAttention: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const [unassignedCount, overdueCount, highPriorityNewCount] = await Promise.all([
      ctx.prisma.case.count({
        where: {
          cityId: ctx.cityId,
          status: CaseStatus.NEW,
          assignedToId: null,
        },
      }),
      ctx.prisma.case.count({
        where: {
          cityId: ctx.cityId,
          status: { in: [CaseStatus.NEW, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS] },
          slaDeadline: { lt: now },
        },
      }),
      ctx.prisma.case.count({
        where: {
          cityId: ctx.cityId,
          status: CaseStatus.NEW,
          priority: { in: [CasePriority.URGENT, CasePriority.HIGH] },
        },
      }),
    ]);

    return {
      unassignedCount,
      overdueCount,
      highPriorityNewCount,
      totalNeedsAttention: unassignedCount + overdueCount + highPriorityNewCount,
    };
  }),

  getActivityFeed: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional().default(20) }))
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.auditLog.findMany({
        where: {
          cityId: ctx.cityId,
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return logs.map((log) => ({
        id: log.id,
        action: log.action,
        userName: log.user?.name || "System",
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        timestamp: log.createdAt,
        details: log.details,
      }));
    }),
});

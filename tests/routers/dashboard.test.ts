import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardRouter } from '@/server/routers/dashboard';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { CaseStatus, CasePriority } from '@prisma/client';

describe('dashboardRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext();
    caller = dashboardRouter.createCaller(ctx);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getStats', () => {
    it('should return correct open case count', async () => {
      ctx.prisma.case.count.mockResolvedValueOnce(5);
      ctx.prisma.case.count.mockResolvedValueOnce(3);
      ctx.prisma.case.findMany.mockResolvedValue([]);
      ctx.prisma.newsletterSignal.count.mockResolvedValue(2);

      const result = await caller.getStats();

      expect(result.openCases).toBe(5);
      expect(ctx.prisma.case.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [CaseStatus.NEW, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS] },
          }),
        })
      );
    });

    it('should return correct cases processed today', async () => {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      ctx.prisma.case.count.mockResolvedValueOnce(5);
      ctx.prisma.case.count.mockResolvedValueOnce(3);
      ctx.prisma.case.findMany.mockResolvedValue([]);
      ctx.prisma.newsletterSignal.count.mockResolvedValue(2);

      const result = await caller.getStats();

      expect(result.casesProcessedToday).toBe(3);
    });

    it('should calculate average response time over last 7 days', async () => {
      const now = new Date('2024-03-15T12:00:00Z');
      const createdAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const firstRespondedAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

      const cases = [
        { createdAt, firstRespondedAt },
        {
          createdAt: new Date(createdAt.getTime() - 1000),
          firstRespondedAt: new Date(firstRespondedAt.getTime() - 2 * 60 * 60 * 1000),
        },
      ];

      ctx.prisma.case.count.mockResolvedValueOnce(5);
      ctx.prisma.case.count.mockResolvedValueOnce(3);
      ctx.prisma.case.findMany.mockResolvedValue(cases);
      ctx.prisma.newsletterSignal.count.mockResolvedValue(2);

      const result = await caller.getStats();

      expect(result.avgResponseTimeHours).toBeGreaterThan(0);
    });

    it('should count newsletter flags from last 7 days', async () => {
      ctx.prisma.case.count.mockResolvedValueOnce(5);
      ctx.prisma.case.count.mockResolvedValueOnce(3);
      ctx.prisma.case.findMany.mockResolvedValue([]);
      ctx.prisma.newsletterSignal.count.mockResolvedValue(7);

      const result = await caller.getStats();

      expect(result.newsletterFlagsThisWeek).toEqual([]);
      expect(ctx.prisma.newsletterSignal.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            signalType: 'FLAG',
          }),
        })
      );
    });
  });

  describe('getMyCases', () => {
    it('should return only cases assigned to current user', async () => {
      const myCases = [
        factories.createTestCase({ assignedToId: ctx.user.id }),
        factories.createTestCase({ assignedToId: ctx.user.id }),
      ];
      ctx.prisma.case.findMany.mockResolvedValue(myCases);

      const result = await caller.getMyCases();

      expect(result).toHaveLength(2);
      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: ctx.user.id,
          }),
        })
      );
    });

    it('should exclude CLOSED cases', async () => {
      const cases = [
        factories.createTestCase({ status: CaseStatus.IN_PROGRESS }),
      ];
      ctx.prisma.case.findMany.mockResolvedValue(cases);

      await caller.getMyCases();

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: CaseStatus.CLOSED },
          }),
        })
      );
    });

    it('should sort by SLA deadline ascending', async () => {
      ctx.prisma.case.findMany.mockResolvedValue([]);

      await caller.getMyCases();

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { slaDeadline: 'asc' },
        })
      );
    });

    it('should calculate SLA status as overdue', async () => {
      const pastDeadline = new Date(Date.now() - 1000);
      const cases = [
        factories.createTestCase({
          assignedToId: ctx.user.id,
          slaDeadline: pastDeadline,
        }),
      ];
      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.getMyCases();

      expect(result[0].slaStatus).toBe('overdue');
    });

    it('should calculate SLA status as ontrack', async () => {
      const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const cases = [
        factories.createTestCase({
          assignedToId: ctx.user.id,
          slaDeadline: futureDeadline,
        }),
      ];
      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.getMyCases();

      expect(result[0].slaStatus).toBe('ontrack');
    });

    it('should calculate hours until SLA', async () => {
      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const cases = [
        factories.createTestCase({
          assignedToId: ctx.user.id,
          slaDeadline: deadline,
        }),
      ];
      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.getMyCases();

      expect(result[0].hoursUntilSla).toBeGreaterThan(0);
      expect(result[0].hoursUntilSla).toBeLessThanOrEqual(12);
    });
  });

  describe('getNeedsAttention', () => {
    it('should return count of unassigned NEW cases', async () => {
      ctx.prisma.case.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await caller.getNeedsAttention();

      expect(result.unassignedCount).toBe(3);
      expect(ctx.prisma.case.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CaseStatus.NEW,
            assignedToId: null,
          }),
        })
      );
    });

    it('should return count of overdue cases', async () => {
      ctx.prisma.case.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await caller.getNeedsAttention();

      expect(result.overdueCount).toBe(2);
      expect(ctx.prisma.case.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slaDeadline: { lt: expect.any(Date) },
          }),
        })
      );
    });

    it('should return count of high priority NEW cases', async () => {
      ctx.prisma.case.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await caller.getNeedsAttention();

      expect(result.highPriorityNewCount).toBe(1);
      expect(ctx.prisma.case.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: { in: [CasePriority.URGENT, CasePriority.HIGH] },
          }),
        })
      );
    });

    it('should return total needs attention sum', async () => {
      ctx.prisma.case.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await caller.getNeedsAttention();

      expect(result.totalNeedsAttention).toBe(6);
    });
  });

  describe('getActivityFeed', () => {
    it('should return last 20 audit entries by default', async () => {
      const logs = Array(20).fill(null).map(() => factories.createTestAuditLog());
      ctx.prisma.auditLog.findMany.mockResolvedValue(logs);

      const result = await caller.getActivityFeed({});

      expect(result).toHaveLength(20);
      expect(ctx.prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should respect limit parameter', async () => {
      ctx.prisma.auditLog.findMany.mockResolvedValue([]);

      await caller.getActivityFeed({ limit: 50 });

      expect(ctx.prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should order by createdAt descending', async () => {
      ctx.prisma.auditLog.findMany.mockResolvedValue([]);

      await caller.getActivityFeed({});

      expect(ctx.prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should format activity entries correctly', async () => {
      const user = factories.createTestUser({ name: 'Alice' });
      const log = factories.createTestAuditLog({
        action: 'CREATE',
        resourceType: 'CASE',
      });

      ctx.prisma.auditLog.findMany.mockResolvedValue([
        { ...log, user },
      ]);

      const result = await caller.getActivityFeed({});

      expect(result[0]).toMatchObject({
        id: log.id,
        action: 'CREATE',
        resourceType: 'CASE',
        userName: 'Alice',
      });
    });

    it('should use System as userName if user is null', async () => {
      const log = factories.createTestAuditLog();

      ctx.prisma.auditLog.findMany.mockResolvedValue([
        { ...log, user: null },
      ]);

      const result = await caller.getActivityFeed({});

      expect(result[0].userName).toBe('System');
    });

    it('should include user relation', async () => {
      ctx.prisma.auditLog.findMany.mockResolvedValue([]);

      await caller.getActivityFeed({});

      expect(ctx.prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: true },
        })
      );
    });
  });
});

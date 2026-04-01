import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsRouter } from '@/server/routers/reports';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { CaseStatus, Role } from '@prisma/client';

describe('reportsRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext();
    caller = reportsRouter.createCaller(ctx);
  });

  describe('caseVolume', () => {
    it('should return weekly case volume data', async () => {
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');

      const cases = [
        factories.createTestCase({
          createdAt: new Date('2024-03-05'),
          closedAt: new Date('2024-03-10'),
        }),
        factories.createTestCase({
          createdAt: new Date('2024-03-12'),
          closedAt: null,
        }),
      ];

      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.caseVolume({ startDate, endDate });

      expect(result.data).toBeDefined();
      expect(result.totalOpened).toBe(2);
    });

    it('should filter by department', async () => {
      const deptId = 'dept-123';
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');

      ctx.prisma.case.findMany.mockResolvedValue([]);

      await caller.caseVolume({ startDate, endDate, departmentId: deptId });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: deptId,
          }),
        })
      );
    });

    it('should count closed cases', async () => {
      const cases = [
        factories.createTestCase({ status: CaseStatus.CLOSED }),
        factories.createTestCase({ status: CaseStatus.IN_PROGRESS }),
      ];

      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.caseVolume({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result.totalClosed).toBe(1);
    });
  });

  describe('responseTimes', () => {
    it('should return average response time by department', async () => {
      const cases = [
        {
          id: 'case-1',
          createdAt: new Date('2024-03-10T08:00:00'),
          firstRespondedAt: new Date('2024-03-10T10:00:00'),
          slaDeadline: new Date(),
          slaBreached: false,
          department: { id: 'dept-1', name: 'Support' },
        },
        {
          id: 'case-2',
          createdAt: new Date('2024-03-10T08:00:00'),
          firstRespondedAt: new Date('2024-03-10T12:00:00'),
          slaDeadline: new Date(),
          slaBreached: false,
          department: { id: 'dept-1', name: 'Support' },
        },
      ];

      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.responseTimes({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result.data).toContainEqual(
        expect.objectContaining({
          department: 'Support',
          avgResponseTimeHours: expect.any(Number),
        })
      );
    });

    it('should calculate SLA compliance rate', async () => {
      const cases = [
        {
          id: 'case-1',
          createdAt: new Date('2024-03-10T08:00:00'),
          firstRespondedAt: new Date('2024-03-10T10:00:00'),
          slaDeadline: new Date(),
          slaBreached: false,
          department: { id: 'dept-1', name: 'Support' },
        },
        {
          id: 'case-2',
          createdAt: new Date('2024-03-10T08:00:00'),
          firstRespondedAt: new Date('2024-03-10T10:00:00'),
          slaDeadline: new Date(),
          slaBreached: true,
          department: { id: 'dept-1', name: 'Support' },
        },
      ];

      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.responseTimes({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result.data[0].slaComplianceRate).toBe(50);
    });

    it('should filter by department', async () => {
      const deptId = 'dept-123';

      ctx.prisma.case.findMany.mockResolvedValue([]);

      await caller.responseTimes({
        startDate: new Date(),
        endDate: new Date(),
        departmentId: deptId,
      });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: deptId,
          }),
        })
      );
    });
  });

  describe('topIssues', () => {
    it('should return top 20 flagged newsletter items', async () => {
      const items = Array(20).fill(null).map((_, i) =>
        ({
          id: `item-${i}`,
          title: `Issue ${i}`,
          flagCount: 20 - i,
          applaudCount: i,
          topicTags: ['test'],
        })
      );

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.topIssues({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toHaveLength(20);
      expect(result[0].flagCount).toBeGreaterThanOrEqual(result[1].flagCount);
    });

    it('should calculate sentiment based on flags vs applauds', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'Issue A',
          flagCount: 10,
          applaudCount: 2,
          topicTags: [],
        },
        {
          id: 'item-2',
          title: 'Issue B',
          flagCount: 3,
          applaudCount: 8,
          topicTags: [],
        },
      ];

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.topIssues({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result[0].sentiment).toBe('negative');
      expect(result[1].sentiment).toBe('positive');
    });
  });

  describe('staffPerformance', () => {
    it('should require MANAGER role', async () => {
      ctx.user.role = 'AGENT';

      await expect(
        caller.staffPerformance({
          startDate: new Date(),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should return per-agent metrics', async () => {
      ctx.user.role = Role.MANAGER;

      const staff = [
        {
          id: 'user-1',
          name: 'Agent Alice',
          email: 'alice@test.local',
          assignedCases: [
            {
              id: 'case-1',
              createdAt: new Date(),
              firstRespondedAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
              status: CaseStatus.CLOSED,
              slaBreached: false,
            },
            {
              id: 'case-2',
              createdAt: new Date(),
              firstRespondedAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
              status: CaseStatus.CLOSED,
              slaBreached: true,
            },
          ],
        },
      ];

      ctx.prisma.user.findMany.mockResolvedValue(staff);

      const result = await caller.staffPerformance({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        staffId: 'user-1',
        staffName: 'Agent Alice',
        staffEmail: 'alice@test.local',
        casesAssigned: 2,
        casesClosed: 2,
        avgResponseTimeHours: expect.any(Number),
        slaComplianceRate: expect.any(Number),
      });
    });

    it('should calculate SLA compliance rate', async () => {
      ctx.user.role = Role.MANAGER;

      const staff = [
        {
          id: 'user-1',
          name: 'Agent',
          email: 'agent@test.local',
          assignedCases: [
            {
              id: 'case-1',
              createdAt: new Date(),
              firstRespondedAt: new Date(),
              status: CaseStatus.CLOSED,
              slaBreached: false,
            },
            {
              id: 'case-2',
              createdAt: new Date(),
              firstRespondedAt: new Date(),
              status: CaseStatus.CLOSED,
              slaBreached: true,
            },
          ],
        },
      ];

      ctx.prisma.user.findMany.mockResolvedValue(staff);

      const result = await caller.staffPerformance({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result[0].slaComplianceRate).toBe(50);
    });

    it('should filter by department if provided', async () => {
      ctx.user.role = Role.MANAGER;
      const deptId = 'dept-123';

      ctx.prisma.user.findMany.mockResolvedValue([]);

      await caller.staffPerformance({
        startDate: new Date(),
        endDate: new Date(),
        departmentId: deptId,
      });

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: deptId,
          }),
        })
      );
    });
  });

  describe('newsletterEngagement', () => {
    it('should return flags and applauds by week', async () => {
      const signals = [
        {
          createdAt: new Date('2024-03-10'),
          signalType: 'FLAG',
          newsletterItem: { topicTags: ['potholes'] },
        },
        {
          createdAt: new Date('2024-03-11'),
          signalType: 'APPLAUD',
          newsletterItem: { topicTags: ['parks'] },
        },
      ];

      ctx.prisma.newsletterSignal.findMany.mockResolvedValue(signals);

      const result = await caller.newsletterEngagement({
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result.byWeek).toBeDefined();
      expect(result.totalFlags).toBeGreaterThanOrEqual(0);
      expect(result.totalApplauds).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate signals by topic', async () => {
      const signals = [
        {
          createdAt: new Date(),
          signalType: 'FLAG',
          newsletterItem: { topicTags: ['traffic', 'safety'] },
        },
        {
          createdAt: new Date(),
          signalType: 'FLAG',
          newsletterItem: { topicTags: ['traffic'] },
        },
      ];

      ctx.prisma.newsletterSignal.findMany.mockResolvedValue(signals);

      const result = await caller.newsletterEngagement({
        startDate: new Date(),
        endDate: new Date(),
      });

      const trafficTopic = result.byTopic.find((t) => t.topic === 'traffic');
      expect(trafficTopic).toBeDefined();
    });
  });

  describe('exportCsv', () => {
    it('should return CSV string for case volume report', async () => {
      const cases = [
        {
          referenceNumber: '2024-ABC123',
          status: CaseStatus.CLOSED,
          priority: 'NORMAL',
          createdAt: new Date('2024-03-10'),
          closedAt: new Date('2024-03-15'),
          constituent: { email: 'user@example.com' },
        },
      ];

      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.exportCsv({
        reportType: 'caseVolume',
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toContain('Reference,Status,Priority,Created,Closed,Constituent');
      expect(result).toContain('2024-ABC123');
      expect(result).toContain('user@example.com');
    });

    it('should filter by department in CSV export', async () => {
      const deptId = 'dept-123';

      ctx.prisma.case.findMany.mockResolvedValue([]);

      await caller.exportCsv({
        reportType: 'caseVolume',
        startDate: new Date(),
        endDate: new Date(),
        departmentId: deptId,
      });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: deptId,
          }),
        })
      );
    });

    it('should format CSV with proper headers', async () => {
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.exportCsv({
        reportType: 'caseVolume',
        startDate: new Date(),
        endDate: new Date(),
      });

      const lines = result.split('\n');
      expect(lines[0]).toContain('Reference');
      expect(lines[0]).toContain('Status');
      expect(lines[0]).toContain('Priority');
    });
  });
});

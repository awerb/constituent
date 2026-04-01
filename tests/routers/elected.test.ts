import { describe, it, expect, vi, beforeEach } from 'vitest';
import { electedRouter } from '@/server/routers/elected';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { CaseStatus, Role } from '@prisma/client';

describe('electedRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext({
      user: { ...createMockContext().user, role: Role.ELECTED_OFFICIAL, ward: 'Ward 1' },
    });
    caller = electedRouter.createCaller(ctx);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDistrictSummary', () => {
    it('should require ELECTED_OFFICIAL role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getDistrictSummary({})).rejects.toThrow();
    });

    it('should use user ward if not provided', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      ctx.prisma.case.count.mockResolvedValue(5);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      await caller.getDistrictSummary({});

      expect(ctx.prisma.newsletterSignal.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            constituent: { ward: 'Ward 1' },
          }),
        })
      );
    });

    it('should use specified ward if provided', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      ctx.prisma.case.count.mockResolvedValue(5);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      await caller.getDistrictSummary({ ward: 'Ward 2' });

      expect(ctx.prisma.newsletterSignal.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            constituent: { ward: 'Ward 2' },
          }),
        })
      );
    });

    it('should return error message if no ward assigned', async () => {
      ctx.user.ward = null;
      ctx.prisma.newsletterSignal.count.mockResolvedValue(0);
      ctx.prisma.case.count.mockResolvedValue(0);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getDistrictSummary({});

      expect(result.error).toBeDefined();
      expect(result.flagsThisWeek).toBe(0);
    });

    it('should return flags from this week', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      ctx.prisma.case.count.mockResolvedValue(0);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getDistrictSummary({});

      expect(result.flagsThisWeek).toBe(5);
    });

    it('should return applauds from this week', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      ctx.prisma.case.count.mockResolvedValue(0);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getDistrictSummary({});

      expect(result.applaudsThisWeek).toBe(3);
    });

    it('should return open cases count', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      ctx.prisma.case.count.mockResolvedValue(7);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getDistrictSummary({});

      expect(result.openCases).toBe(7);
    });

    it('should calculate average response time', async () => {
      const now = new Date('2024-03-15T12:00:00Z');
      const cases = [
        {
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          firstRespondedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
        },
        {
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          firstRespondedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        },
      ];

      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      ctx.prisma.case.count.mockResolvedValue(2);
      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.getDistrictSummary({});

      expect(result.avgResponseTime).toBeGreaterThan(0);
    });

    it('should calculate flags trend comparing this week to previous week', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      ctx.prisma.case.count.mockResolvedValue(0);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getDistrictSummary({});

      expect(result.flagsTrend).toBeDefined();
      expect(typeof result.flagsTrend).toBe('string');
    });

    it('should not expose individual constituent data', async () => {
      ctx.prisma.newsletterSignal.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      ctx.prisma.case.count.mockResolvedValue(0);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getDistrictSummary({});

      expect(result.email).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });
  });

  describe('getTopFlagged', () => {
    it('should require ELECTED_OFFICIAL role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getTopFlagged({})).rejects.toThrow();
    });

    it('should return top flagged items for district', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'Potholes on Main St',
          summary: 'Multiple potholes reported',
          topicTags: ['infrastructure'],
          flagCount: 10,
          applaudCount: 1,
          signals: Array(8).fill({}),
        },
      ];

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.getTopFlagged({});

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Potholes on Main St');
      expect(result[0].flagCount).toBe(10);
    });

    it('should default to 10 items limit', async () => {
      ctx.prisma.newsletterItem.findMany.mockResolvedValue([]);

      await caller.getTopFlagged({});

      expect(ctx.prisma.newsletterItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should respect custom limit', async () => {
      ctx.prisma.newsletterItem.findMany.mockResolvedValue([]);

      await caller.getTopFlagged({ limit: 20 });

      expect(ctx.prisma.newsletterItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should include districtFlags count', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'Issue',
          summary: 'Summary',
          topicTags: [],
          flagCount: 10,
          applaudCount: 1,
          signals: Array(5).fill({}),
        },
      ];

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.getTopFlagged({});

      expect(result[0].districtFlags).toBe(5);
    });

    it('should return empty array if no ward', async () => {
      ctx.user.ward = null;

      const result = await caller.getTopFlagged({});

      expect(result).toEqual([]);
    });

    it('should not expose individual constituent data', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'Issue',
          summary: 'Summary',
          topicTags: [],
          flagCount: 10,
          applaudCount: 1,
          signals: [],
        },
      ];

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.getTopFlagged({});

      expect(result[0].email).toBeUndefined();
      expect(result[0].name).toBeUndefined();
    });
  });

  describe('getTopApplauded', () => {
    it('should require ELECTED_OFFICIAL role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getTopApplauded({})).rejects.toThrow();
    });

    it('should return top applauded items for district', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'New Park Opening',
          summary: 'Grand opening of new community park',
          topicTags: ['parks'],
          flagCount: 1,
          applaudCount: 15,
          signals: Array(12).fill({}),
        },
      ];

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.getTopApplauded({});

      expect(result).toHaveLength(1);
      expect(result[0].applaudCount).toBe(15);
    });

    it('should include districtApplauds count', async () => {
      const items = [
        {
          id: 'item-1',
          title: 'Good news',
          summary: 'Summary',
          topicTags: [],
          flagCount: 0,
          applaudCount: 5,
          signals: Array(3).fill({}),
        },
      ];

      ctx.prisma.newsletterItem.findMany.mockResolvedValue(items);

      const result = await caller.getTopApplauded({});

      expect(result[0].districtApplauds).toBe(3);
    });

    it('should return empty array if no ward', async () => {
      ctx.user.ward = null;

      const result = await caller.getTopApplauded({});

      expect(result).toEqual([]);
    });
  });

  describe('getResponseComparison', () => {
    it('should require ELECTED_OFFICIAL role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getResponseComparison({})).rejects.toThrow();
    });

    it('should return district vs city-wide average response times', async () => {
      const districtCases = [
        {
          createdAt: new Date(),
          firstRespondedAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      ];
      const cityCases = [
        {
          createdAt: new Date(),
          firstRespondedAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      ];

      ctx.prisma.case.findMany
        .mockResolvedValueOnce(districtCases)
        .mockResolvedValueOnce(cityCases);

      const result = await caller.getResponseComparison({});

      expect(result.districtAvg).toBeDefined();
      expect(result.cityAvg).toBeDefined();
      expect(result.difference).toBeDefined();
    });

    it('should calculate performance status when district is better', async () => {
      const districtCases = [
        {
          createdAt: new Date(),
          firstRespondedAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        },
      ];
      const cityCases = [
        {
          createdAt: new Date(),
          firstRespondedAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      ];

      ctx.prisma.case.findMany
        .mockResolvedValueOnce(districtCases)
        .mockResolvedValueOnce(cityCases);

      const result = await caller.getResponseComparison({});

      expect(result.performanceStatus).toBe('better');
    });

    it('should calculate performance status when district is worse', async () => {
      const districtCases = [
        {
          createdAt: new Date(),
          firstRespondedAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
      ];
      const cityCases = [
        {
          createdAt: new Date(),
          firstRespondedAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      ];

      ctx.prisma.case.findMany
        .mockResolvedValueOnce(districtCases)
        .mockResolvedValueOnce(cityCases);

      const result = await caller.getResponseComparison({});

      expect(result.performanceStatus).toBe('worse');
    });

    it('should return zero values if no ward', async () => {
      ctx.user.ward = null;

      const result = await caller.getResponseComparison({});

      expect(result.districtAvg).toBe(0);
      expect(result.cityAvg).toBe(0);
      expect(result.difference).toBe(0);
    });

    it('should not expose individual constituent data', async () => {
      ctx.prisma.case.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await caller.getResponseComparison({});

      expect(result.email).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { superAdminRouter } from '@/server/routers/superAdmin';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { Role, CaseStatus } from '@prisma/client';

describe('superAdminRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext({
      user: { ...createMockContext().user, role: Role.SUPER_ADMIN },
    });
    caller = superAdminRouter.createCaller(ctx);
  });

  describe('listTenants', () => {
    it('should require SUPER_ADMIN role', async () => {
      ctx.user.role = Role.ADMIN;

      await expect(caller.listTenants()).rejects.toThrow();
    });

    it('should return all cities with counts', async () => {
      const cities = [
        {
          id: 'city-1',
          name: 'San Francisco',
          slug: 'san-francisco',
          state: 'CA',
          timezone: 'America/Los_Angeles',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            users: 5,
            cases: 100,
            constituents: 500,
          },
        },
        {
          id: 'city-2',
          name: 'Oakland',
          slug: 'oakland',
          state: 'CA',
          timezone: 'America/Los_Angeles',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            users: 3,
            cases: 50,
            constituents: 250,
          },
        },
      ];

      ctx.prisma.city.findMany.mockResolvedValue(cities);

      const result = await caller.listTenants();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'San Francisco',
        userCount: 5,
        caseCount: 100,
        constituentCount: 500,
      });
    });

    it('should order by createdAt descending', async () => {
      ctx.prisma.city.findMany.mockResolvedValue([]);

      await caller.listTenants();

      expect(ctx.prisma.city.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should work across all tenants', async () => {
      ctx.prisma.city.findMany.mockResolvedValue([]);

      await caller.listTenants();

      expect(ctx.prisma.city.findMany).toHaveBeenCalled();
    });
  });

  describe('createTenant', () => {
    it('should require SUPER_ADMIN role', async () => {
      ctx.user.role = Role.ADMIN;

      await expect(
        caller.createTenant({
          name: 'New City',
          slug: 'new-city',
          state: 'CA',
          timezone: 'America/Los_Angeles',
        })
      ).rejects.toThrow();
    });

    it('should create city record with defaults', async () => {
      const city = {
        id: 'city-new',
        name: 'New City',
        slug: 'new-city',
        state: 'CA',
        timezone: 'America/Los_Angeles',
        settings: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.prisma.city.findUnique.mockResolvedValue(null);
      ctx.prisma.city.create.mockResolvedValue(city);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.createTenant({
        name: 'New City',
        slug: 'new-city',
        state: 'CA',
        timezone: 'America/Los_Angeles',
      });

      expect(result.name).toBe('New City');
      expect(result.isActive).toBe(true);
      expect(result.settings).toEqual({});
    });

    it('should validate slug uniqueness', async () => {
      ctx.prisma.city.findUnique.mockResolvedValue({ id: 'city-1' });

      await expect(
        caller.createTenant({
          name: 'New City',
          slug: 'existing-slug',
          state: 'CA',
          timezone: 'America/Los_Angeles',
        })
      ).rejects.toThrow('CONFLICT');
    });

    it('should create audit log entry', async () => {
      const city = {
        id: 'city-new',
        name: 'New City',
        slug: 'new-city',
        state: 'CA',
        timezone: 'America/Los_Angeles',
        settings: {},
        isActive: true,
        createdAt: new Date(),
      };

      ctx.prisma.city.findUnique.mockResolvedValue(null);
      ctx.prisma.city.create.mockResolvedValue(city);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.createTenant({
        name: 'New City',
        slug: 'new-city',
        state: 'CA',
        timezone: 'America/Los_Angeles',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'CITY',
          }),
        })
      );
    });
  });

  describe('updateTenant', () => {
    it('should require SUPER_ADMIN role', async () => {
      ctx.user.role = Role.ADMIN;

      await expect(
        caller.updateTenant({
          id: 'city-1',
          name: 'Updated Name',
        })
      ).rejects.toThrow();
    });

    it('should update city fields', async () => {
      const city = {
        id: 'city-1',
        name: 'Updated City',
        isActive: false,
      };

      ctx.prisma.city.findUnique.mockResolvedValue({ id: 'city-1' });
      ctx.prisma.city.update.mockResolvedValue(city);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.updateTenant({
        id: 'city-1',
        name: 'Updated City',
        isActive: false,
      });

      expect(result.name).toBe('Updated City');
      expect(result.isActive).toBe(false);
    });

    it('should merge settings with existing settings', async () => {
      const city = {
        id: 'city-1',
        settings: { theme: 'dark', language: 'en' },
      };

      ctx.prisma.city.findUnique.mockResolvedValue({
        id: 'city-1',
        settings: { theme: 'light', language: 'en' },
      });
      ctx.prisma.city.update.mockResolvedValue(city);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.updateTenant({
        id: 'city-1',
        settings: { theme: 'dark' },
      });

      expect(ctx.prisma.city.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            settings: expect.objectContaining({
              theme: 'dark',
              language: 'en',
            }),
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      ctx.prisma.city.findUnique.mockResolvedValue({ id: 'city-1' });
      ctx.prisma.city.update.mockResolvedValue({ id: 'city-1' });
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.updateTenant({
        id: 'city-1',
        name: 'Updated',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            resourceType: 'CITY',
          }),
        })
      );
    });

    it('should throw if city not found', async () => {
      ctx.prisma.city.findUnique.mockResolvedValue(null);

      await expect(
        caller.updateTenant({
          id: 'nonexistent',
          name: 'Updated',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('getTenantStats', () => {
    it('should require SUPER_ADMIN role', async () => {
      ctx.user.role = Role.ADMIN;

      await expect(
        caller.getTenantStats({ cityId: 'city-1' })
      ).rejects.toThrow();
    });

    it('should return detailed tenant stats', async () => {
      const city = {
        id: 'city-1',
        name: 'Test City',
        slug: 'test-city',
        isActive: true,
        createdAt: new Date(),
      };

      ctx.prisma.city.findUnique.mockResolvedValue(city);
      ctx.prisma.user.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      ctx.prisma.case.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(50);
      ctx.prisma.constituent.count.mockResolvedValue(500);
      ctx.prisma.department.count.mockResolvedValue(5);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getTenantStats({ cityId: 'city-1' });

      expect(result.cityName).toBe('Test City');
      expect(result.stats).toMatchObject({
        totalUsers: 10,
        activeUsers: 8,
        totalCases: 100,
        newCasesThisWeek: expect.any(Number),
        totalConstituents: 500,
        totalDepartments: 5,
      });
    });

    it('should calculate average response time over last 30 days', async () => {
      const city = { id: 'city-1' };
      const cases = [
        {
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          firstRespondedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
        },
      ];

      ctx.prisma.city.findUnique.mockResolvedValue(city);
      ctx.prisma.user.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      ctx.prisma.case.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(50);
      ctx.prisma.constituent.count.mockResolvedValue(500);
      ctx.prisma.department.count.mockResolvedValue(5);
      ctx.prisma.case.findMany.mockResolvedValue(cases);

      const result = await caller.getTenantStats({ cityId: 'city-1' });

      expect(result.stats.avgResponseTimeHours).toBeGreaterThan(0);
    });

    it('should count open cases', async () => {
      const city = { id: 'city-1' };

      ctx.prisma.city.findUnique.mockResolvedValue(city);
      ctx.prisma.user.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);
      ctx.prisma.case.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(50);
      ctx.prisma.constituent.count.mockResolvedValue(500);
      ctx.prisma.department.count.mockResolvedValue(5);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getTenantStats({ cityId: 'city-1' });

      expect(result.stats.openCases).toBe(50);
    });

    it('should throw if city not found', async () => {
      ctx.prisma.city.findUnique.mockResolvedValue(null);

      await expect(
        caller.getTenantStats({ cityId: 'nonexistent' })
      ).rejects.toThrow('NOT_FOUND');
    });

    it('should work across all tenants', async () => {
      const city = { id: 'city-1', name: 'City 1' };

      ctx.prisma.city.findUnique.mockResolvedValue(city);
      ctx.prisma.user.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(4);
      ctx.prisma.case.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(20);
      ctx.prisma.constituent.count.mockResolvedValue(250);
      ctx.prisma.department.count.mockResolvedValue(3);
      ctx.prisma.case.findMany.mockResolvedValue([]);

      const result = await caller.getTenantStats({ cityId: 'city-1' });

      expect(result.cityName).toBeDefined();
      expect(result.stats).toBeDefined();
    });
  });
});

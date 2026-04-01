import { describe, it, expect, vi, beforeEach } from 'vitest';
import { constituentsRouter } from '@/server/routers/constituents';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { Role } from '@prisma/client';

describe('constituentsRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext();
    caller = constituentsRouter.createCaller(ctx);
  });

  describe('list', () => {
    it('should list constituents with default pagination', async () => {
      const constituents = [
        factories.createTestConstituent(),
        factories.createTestConstituent(),
      ];
      ctx.prisma.constituent.findMany.mockResolvedValue(constituents);
      ctx.prisma.constituent.count.mockResolvedValue(2);

      const result = await caller.list({});

      expect(result.constituents).toEqual(constituents);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should search by name and email', async () => {
      const constituents = [factories.createTestConstituent()];
      ctx.prisma.constituent.findMany.mockResolvedValue(constituents);
      ctx.prisma.constituent.count.mockResolvedValue(1);

      await caller.list({ search: 'john' });

      expect(ctx.prisma.constituent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ email: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should paginate correctly', async () => {
      const constituents = [factories.createTestConstituent()];
      ctx.prisma.constituent.findMany.mockResolvedValue(constituents);
      ctx.prisma.constituent.count.mockResolvedValue(50);

      const result = await caller.list({ page: 2, limit: 25 });

      expect(ctx.prisma.constituent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        })
      );
      expect(result.totalPages).toBe(2);
    });

    it('should order by createdAt descending', async () => {
      ctx.prisma.constituent.findMany.mockResolvedValue([]);
      ctx.prisma.constituent.count.mockResolvedValue(0);

      await caller.list({});

      expect(ctx.prisma.constituent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return constituent with case history', async () => {
      const constituent = factories.createTestConstituent();
      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);

      const result = await caller.getById({ id: constituent.id });

      expect(result).toEqual(constituent);
      expect(ctx.prisma.constituent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: constituent.id,
            cityId: ctx.cityId,
          },
          include: {
            cases: expect.any(Object),
            newsletterSignals: expect.any(Object),
          },
        })
      );
    });

    it('should include last 10 cases', async () => {
      const constituent = factories.createTestConstituent();
      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);

      await caller.getById({ id: constituent.id });

      expect(ctx.prisma.constituent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            cases: expect.objectContaining({
              take: 10,
            }),
          }),
        })
      );
    });

    it('should include last 10 newsletter signals', async () => {
      const constituent = factories.createTestConstituent();
      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);

      await caller.getById({ id: constituent.id });

      expect(ctx.prisma.constituent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            newsletterSignals: expect.objectContaining({
              take: 10,
            }),
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent constituent', async () => {
      ctx.prisma.constituent.findFirst.mockResolvedValue(null);

      await expect(caller.getById({ id: 'nonexistent' })).rejects.toThrow(
        'NOT_FOUND'
      );
    });
  });

  describe('update', () => {
    it('should update constituent fields', async () => {
      const existing = factories.createTestConstituent();
      const updated = factories.createTestConstituent({
        name: 'Updated Name',
      });

      ctx.prisma.constituent.findFirst.mockResolvedValue(existing);
      ctx.prisma.constituent.update.mockResolvedValue(updated);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.update({
        id: existing.id,
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const existing = factories.createTestConstituent();

      ctx.prisma.constituent.findFirst.mockResolvedValue(existing);
      ctx.prisma.constituent.update.mockResolvedValue(existing);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existing.id,
        name: 'New Name',
        phone: '555-1234',
        address: '456 Oak St',
        ward: 'Ward 2',
        district: 'District B',
        languagePreference: 'es',
      });

      expect(ctx.prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Name',
            phone: '555-1234',
            address: '456 Oak St',
            ward: 'Ward 2',
            district: 'District B',
            languagePreference: 'es',
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const existing = factories.createTestConstituent();

      ctx.prisma.constituent.findFirst.mockResolvedValue(existing);
      ctx.prisma.constituent.update.mockResolvedValue(existing);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existing.id,
        name: 'New Name',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            resourceType: 'CONSTITUENT',
          }),
        })
      );
    });

    it('should throw NOT_FOUND if constituent does not exist', async () => {
      ctx.prisma.constituent.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({
          id: 'nonexistent',
          name: 'New Name',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('requestExport', () => {
    it('should update privacy status to EXPORT_REQUESTED', async () => {
      const constituent = factories.createTestConstituent();
      const updated = factories.createTestConstituent({
        privacyStatus: 'EXPORT_REQUESTED',
      });

      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue(updated);
      ctx.redis.lpush.mockResolvedValue(1);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.requestExport({ id: constituent.id });

      expect(result.privacyStatus).toBe('EXPORT_REQUESTED');
    });

    it('should queue privacy export job', async () => {
      const constituent = factories.createTestConstituent();

      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue(constituent);
      ctx.redis.lpush.mockResolvedValue(1);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.requestExport({ id: constituent.id });

      expect(ctx.redis.lpush).toHaveBeenCalledWith(
        'privacy_queue:export',
        expect.stringContaining(constituent.id)
      );
    });

    it('should create audit log entry', async () => {
      const constituent = factories.createTestConstituent();

      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue(constituent);
      ctx.redis.lpush.mockResolvedValue(1);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.requestExport({ id: constituent.id });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REQUEST_EXPORT',
            resourceType: 'CONSTITUENT',
          }),
        })
      );
    });

    it('should throw NOT_FOUND if constituent does not exist', async () => {
      ctx.prisma.constituent.findFirst.mockResolvedValue(null);

      await expect(caller.requestExport({ id: 'nonexistent' })).rejects.toThrow(
        'NOT_FOUND'
      );
    });
  });

  describe('requestDeletion', () => {
    it('should update privacy status to DELETION_REQUESTED', async () => {
      const constituent = factories.createTestConstituent();
      const updated = factories.createTestConstituent({
        privacyStatus: 'DELETION_REQUESTED',
      });

      ctx.user.role = Role.MANAGER;
      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue(updated);
      ctx.redis.lpush.mockResolvedValue(1);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.requestDeletion({ id: constituent.id });

      expect(result.privacyStatus).toBe('DELETION_REQUESTED');
    });

    it('should queue privacy deletion job', async () => {
      const constituent = factories.createTestConstituent();

      ctx.user.role = Role.MANAGER;
      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue(constituent);
      ctx.redis.lpush.mockResolvedValue(1);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.requestDeletion({ id: constituent.id });

      expect(ctx.redis.lpush).toHaveBeenCalledWith(
        'privacy_queue:delete',
        expect.stringContaining(constituent.id)
      );
    });

    it('should create audit log entry', async () => {
      const constituent = factories.createTestConstituent();

      ctx.user.role = Role.MANAGER;
      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue(constituent);
      ctx.redis.lpush.mockResolvedValue(1);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.requestDeletion({ id: constituent.id });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REQUEST_DELETION',
            resourceType: 'CONSTITUENT',
          }),
        })
      );
    });

    it('should require MANAGER role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.requestDeletion({ id: 'some-id' })
      ).rejects.toThrow();
    });

    it('should throw NOT_FOUND if constituent does not exist', async () => {
      ctx.user.role = Role.MANAGER;
      ctx.prisma.constituent.findFirst.mockResolvedValue(null);

      await expect(
        caller.requestDeletion({ id: 'nonexistent' })
      ).rejects.toThrow('NOT_FOUND');
    });
  });
});

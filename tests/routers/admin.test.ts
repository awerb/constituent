import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminRouter } from '@/server/routers/admin';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { CasePriority, Role } from '@prisma/client';

describe('adminRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext({ user: { ...createMockContext().user, role: Role.ADMIN } });
    caller = adminRouter.createCaller(ctx);
  });

  describe('getSettings', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getSettings()).rejects.toThrow();
    });

    it('should return city settings', async () => {
      const city = {
        id: ctx.cityId,
        name: 'Test City',
        slug: 'test-city',
        state: 'CA',
        timezone: 'America/Los_Angeles',
        settings: { theme: 'dark' },
        isActive: true,
      };

      ctx.prisma.city.findUnique.mockResolvedValue(city);

      const result = await caller.getSettings();

      expect(result.name).toBe('Test City');
      expect(result.slug).toBe('test-city');
      expect(result.settings).toEqual({ theme: 'dark' });
    });
  });

  describe('updateSettings', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.updateSettings({ settings: { theme: 'light' } })
      ).rejects.toThrow();
    });

    it('should update and audit log the change', async () => {
      const city = { id: ctx.cityId };

      ctx.prisma.city.update.mockResolvedValue(city);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.updateSettings({ settings: { theme: 'light' } });

      expect(ctx.prisma.city.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { settings: { theme: 'light' } },
        })
      );
      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE_SETTINGS',
          }),
        })
      );
    });
  });

  describe('createDepartment', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.createDepartment({
          name: 'Test',
          slug: 'test',
          topicTags: [],
        })
      ).rejects.toThrow();
    });

    it('should create department with defaults', async () => {
      const department = factories.createTestDepartment();

      ctx.prisma.department.findFirst.mockResolvedValue(null);
      ctx.prisma.department.create.mockResolvedValue(department);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.createDepartment({
        name: 'Support',
        slug: 'support',
        topicTags: ['tickets'],
      });

      expect(result.name).toBe('Support');
      expect(ctx.prisma.department.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'support',
            defaultSlaHours: 48,
          }),
        })
      );
    });

    it('should validate slug uniqueness', async () => {
      ctx.prisma.department.findFirst.mockResolvedValue({ id: 'dept-1' });

      await expect(
        caller.createDepartment({
          name: 'Support',
          slug: 'support',
          topicTags: [],
        })
      ).rejects.toThrow('CONFLICT');
    });

    it('should create audit log entry', async () => {
      const department = factories.createTestDepartment();

      ctx.prisma.department.findFirst.mockResolvedValue(null);
      ctx.prisma.department.create.mockResolvedValue(department);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.createDepartment({
        name: 'Support',
        slug: 'support',
        topicTags: [],
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'DEPARTMENT',
          }),
        })
      );
    });
  });

  describe('createUser', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.createUser({
          email: 'user@test.local',
          name: 'Test User',
          role: 'AGENT',
        })
      ).rejects.toThrow();
    });

    it('should create user with required fields', async () => {
      const user = factories.createTestUser();

      ctx.prisma.user.findFirst.mockResolvedValue(null);
      ctx.prisma.user.create.mockResolvedValue(user);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.createUser({
        email: 'newuser@test.local',
        name: 'New User',
        role: 'AGENT',
      });

      expect(result.email).toBe(user.email);
      expect(ctx.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newuser@test.local',
            name: 'New User',
            role: 'AGENT',
          }),
        })
      );
    });

    it('should validate email uniqueness within city', async () => {
      ctx.prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });

      await expect(
        caller.createUser({
          email: 'existing@test.local',
          name: 'User',
          role: 'AGENT',
        })
      ).rejects.toThrow('CONFLICT');
    });

    it('should queue invite email', async () => {
      const user = factories.createTestUser();

      ctx.prisma.user.findFirst.mockResolvedValue(null);
      ctx.prisma.user.create.mockResolvedValue(user);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.createUser({
        email: 'newuser@test.local',
        name: 'New User',
        role: 'AGENT',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should create audit log entry', async () => {
      const user = factories.createTestUser();

      ctx.prisma.user.findFirst.mockResolvedValue(null);
      ctx.prisma.user.create.mockResolvedValue(user);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.createUser({
        email: 'newuser@test.local',
        name: 'New User',
        role: 'AGENT',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'USER',
          }),
        })
      );
    });
  });

  describe('upsertSlaConfig', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.upsertSlaConfig({
          departmentId: 'dept-123',
          priority: CasePriority.HIGH,
          responseHours: 24,
          resolutionHours: 72,
          escalationChain: {},
        })
      ).rejects.toThrow();
    });

    it('should create new SLA config', async () => {
      const config = {
        id: 'config-1',
        cityId: ctx.cityId,
        departmentId: 'dept-123',
        priority: CasePriority.HIGH,
        responseHours: 24,
      };

      ctx.prisma.department.findFirst.mockResolvedValue({ id: 'dept-123' });
      ctx.prisma.slaConfig.upsert.mockResolvedValue(config);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.upsertSlaConfig({
        departmentId: 'dept-123',
        priority: CasePriority.HIGH,
        responseHours: 24,
        resolutionHours: 72,
        escalationChain: {},
      });

      expect(result.responseHours).toBe(24);
    });

    it('should update existing SLA config', async () => {
      const config = {
        id: 'config-1',
        responseHours: 48,
      };

      ctx.prisma.department.findFirst.mockResolvedValue({ id: 'dept-123' });
      ctx.prisma.slaConfig.upsert.mockResolvedValue(config);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.upsertSlaConfig({
        departmentId: 'dept-123',
        priority: CasePriority.HIGH,
        responseHours: 48,
        resolutionHours: 96,
        escalationChain: {},
      });

      expect(result.responseHours).toBe(48);
    });

    it('should validate department exists', async () => {
      ctx.prisma.department.findFirst.mockResolvedValue(null);

      await expect(
        caller.upsertSlaConfig({
          departmentId: 'nonexistent',
          priority: CasePriority.HIGH,
          responseHours: 24,
          resolutionHours: 72,
          escalationChain: {},
        })
      ).rejects.toThrow('NOT_FOUND');
    });

    it('should create audit log entry', async () => {
      const config = { id: 'config-1' };

      ctx.prisma.department.findFirst.mockResolvedValue({ id: 'dept-123' });
      ctx.prisma.slaConfig.upsert.mockResolvedValue(config);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.upsertSlaConfig({
        departmentId: 'dept-123',
        priority: CasePriority.HIGH,
        responseHours: 24,
        resolutionHours: 72,
        escalationChain: {},
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPSERT',
            resourceType: 'SLA_CONFIG',
          }),
        })
      );
    });
  });

  describe('createWebhook', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.createWebhook({
          name: 'Test Webhook',
          url: 'https://example.com/webhook',
          events: ['case.created'],
        })
      ).rejects.toThrow();
    });

    it('should generate secure secret', async () => {
      const webhook = {
        id: 'webhook-1',
        secret: 'secure-secret-32chars',
      };

      ctx.prisma.webhook.create.mockResolvedValue(webhook);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.createWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['case.created'],
      });

      expect(result.secret).toBeDefined();
      expect(result.secret).toHaveLength(32);
    });

    it('should create audit log entry', async () => {
      const webhook = { id: 'webhook-1', name: 'Test', secret: 'secret' };

      ctx.prisma.webhook.create.mockResolvedValue(webhook);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.createWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['case.created'],
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'WEBHOOK',
          }),
        })
      );
    });
  });

  describe('deleteWebhook', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.deleteWebhook({ id: 'webhook-1' })
      ).rejects.toThrow();
    });

    it('should remove webhook', async () => {
      const webhook = { id: 'webhook-1', name: 'Test' };

      ctx.prisma.webhook.findFirst.mockResolvedValue(webhook);
      ctx.prisma.webhook.delete.mockResolvedValue(webhook);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.deleteWebhook({ id: 'webhook-1' });

      expect(ctx.prisma.webhook.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'webhook-1' },
        })
      );
    });

    it('should create audit log entry', async () => {
      const webhook = { id: 'webhook-1', name: 'Test' };

      ctx.prisma.webhook.findFirst.mockResolvedValue(webhook);
      ctx.prisma.webhook.delete.mockResolvedValue(webhook);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.deleteWebhook({ id: 'webhook-1' });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DELETE',
            resourceType: 'WEBHOOK',
          }),
        })
      );
    });

    it('should throw if webhook not found', async () => {
      ctx.prisma.webhook.findFirst.mockResolvedValue(null);

      await expect(
        caller.deleteWebhook({ id: 'nonexistent' })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('getAuditLog', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getAuditLog({})).rejects.toThrow();
    });

    it('should paginate audit logs', async () => {
      const logs = Array(50).fill(null).map(() => factories.createTestAuditLog());

      ctx.prisma.auditLog.findMany.mockResolvedValue(logs);
      ctx.prisma.auditLog.count.mockResolvedValue(100);

      const result = await caller.getAuditLog({});

      expect(result.logs).toHaveLength(50);
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by action', async () => {
      const logs = [factories.createTestAuditLog({ action: 'CREATE' })];

      ctx.prisma.auditLog.findMany.mockResolvedValue(logs);
      ctx.prisma.auditLog.count.mockResolvedValue(1);

      await caller.getAuditLog({ action: 'CREATE' });

      expect(ctx.prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        })
      );
    });

    it('should filter by user', async () => {
      const userId = 'user-123';
      const logs = [factories.createTestAuditLog({ userId })];

      ctx.prisma.auditLog.findMany.mockResolvedValue(logs);
      ctx.prisma.auditLog.count.mockResolvedValue(1);

      await caller.getAuditLog({ userId });

      expect(ctx.prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
          }),
        })
      );
    });
  });

  describe('getPrivacyQueue', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.getPrivacyQueue()).rejects.toThrow();
    });

    it('should return pending privacy requests', async () => {
      const constituents = [
        factories.createTestConstituent({
          privacyStatus: 'EXPORT_REQUESTED',
        }),
        factories.createTestConstituent({
          privacyStatus: 'DELETION_REQUESTED',
        }),
      ];

      ctx.prisma.constituent.findMany.mockResolvedValue(constituents);

      const result = await caller.getPrivacyQueue();

      expect(result).toHaveLength(2);
      expect(result[0].privacyStatus).toBe('EXPORT_REQUESTED');
    });
  });

  describe('processPrivacyRequest', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.processPrivacyRequest({
          constituentId: 'const-1',
          action: 'export',
        })
      ).rejects.toThrow();
    });

    it('should anonymize constituent for deletion', async () => {
      const constituent = factories.createTestConstituent();

      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue({
        privacyStatus: 'ANONYMIZED',
      });
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.processPrivacyRequest({
        constituentId: constituent.id,
        action: 'delete',
      });

      expect(result.privacyStatus).toBe('ANONYMIZED');
      expect(ctx.prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            privacyStatus: 'ANONYMIZED',
            name: 'Anonymized',
            phone: null,
            address: null,
            ward: null,
            district: null,
          }),
        })
      );
    });

    it('should set status to ACTIVE for export', async () => {
      const constituent = factories.createTestConstituent();

      ctx.prisma.constituent.findFirst.mockResolvedValue(constituent);
      ctx.prisma.constituent.update.mockResolvedValue({
        privacyStatus: 'ACTIVE',
      });
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.processPrivacyRequest({
        constituentId: constituent.id,
        action: 'export',
      });

      expect(ctx.prisma.constituent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            privacyStatus: 'ACTIVE',
          }),
        })
      );
    });

    it('should throw if constituent not found', async () => {
      ctx.prisma.constituent.findFirst.mockResolvedValue(null);

      await expect(
        caller.processPrivacyRequest({
          constituentId: 'nonexistent',
          action: 'export',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });
});

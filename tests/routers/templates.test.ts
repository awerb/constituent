import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templatesRouter } from '@/server/routers/templates';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { TemplateStatus, Role } from '@prisma/client';

describe('templatesRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext({ user: { ...createMockContext().user, role: Role.ADMIN } });
    caller = templatesRouter.createCaller(ctx);
  });

  describe('list', () => {
    it('should list all templates', async () => {
      const templates = [
        factories.createTestTemplate(),
        factories.createTestTemplate(),
      ];
      ctx.prisma.template.findMany.mockResolvedValue(templates);

      const result = await caller.list({});

      expect(result).toEqual(templates);
    });

    it('should filter templates by department', async () => {
      const deptId = 'dept-123';
      const templates = [
        factories.createTestTemplate({ departmentId: deptId }),
      ];
      ctx.prisma.template.findMany.mockResolvedValue(templates);

      await caller.list({ departmentId: deptId });

      expect(ctx.prisma.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: deptId }),
        })
      );
    });

    it('should filter templates by category', async () => {
      const templates = [
        factories.createTestTemplate({ category: 'acknowledgment' }),
      ];
      ctx.prisma.template.findMany.mockResolvedValue(templates);

      await caller.list({ category: 'acknowledgment' });

      expect(ctx.prisma.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'acknowledgment' }),
        })
      );
    });

    it('should filter templates by status', async () => {
      const templates = [
        factories.createTestTemplate({ status: TemplateStatus.APPROVED }),
      ];
      ctx.prisma.template.findMany.mockResolvedValue(templates);

      await caller.list({ status: TemplateStatus.APPROVED });

      expect(ctx.prisma.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TemplateStatus.APPROVED }),
        })
      );
    });

    it('should include user relations', async () => {
      ctx.prisma.template.findMany.mockResolvedValue([]);

      await caller.list({});

      expect(ctx.prisma.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            createdBy: true,
            approvedBy: true,
            department: true,
          },
        })
      );
    });

    it('should order by createdAt descending', async () => {
      ctx.prisma.template.findMany.mockResolvedValue([]);

      await caller.list({});

      expect(ctx.prisma.template.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return template by id', async () => {
      const template = factories.createTestTemplate();
      ctx.prisma.template.findFirst.mockResolvedValue(template);

      const result = await caller.getById({ id: template.id });

      expect(result).toEqual(template);
    });

    it('should include user relations', async () => {
      const template = factories.createTestTemplate();
      ctx.prisma.template.findFirst.mockResolvedValue(template);

      await caller.getById({ id: template.id });

      expect(ctx.prisma.template.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            createdBy: true,
            approvedBy: true,
            department: true,
          },
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent template', async () => {
      ctx.prisma.template.findFirst.mockResolvedValue(null);

      await expect(caller.getById({ id: 'nonexistent' })).rejects.toThrow(
        'NOT_FOUND'
      );
    });
  });

  describe('create', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.create({
          title: 'Test',
          category: 'response',
          content: 'Content',
          variables: {},
        })
      ).rejects.toThrow();
    });

    it('should create template with required fields', async () => {
      const template = factories.createTestTemplate({
        status: TemplateStatus.DRAFT,
      });

      ctx.prisma.template.create.mockResolvedValue(template);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.create({
        title: 'New Template',
        category: 'response',
        content: 'Template content',
        variables: { name: 'string' },
      });

      expect(result.status).toBe(TemplateStatus.DRAFT);
      expect(ctx.prisma.template.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Template',
            category: 'response',
            content: 'Template content',
            variables: { name: 'string' },
            status: TemplateStatus.DRAFT,
            createdById: ctx.user.id,
          }),
        })
      );
    });

    it('should validate department exists if provided', async () => {
      const deptId = 'dept-123';
      ctx.prisma.department.findFirst.mockResolvedValue(null);

      await expect(
        caller.create({
          title: 'Test',
          category: 'response',
          content: 'Content',
          departmentId: deptId,
          variables: {},
        })
      ).rejects.toThrow('Department not found');
    });

    it('should create audit log entry', async () => {
      const template = factories.createTestTemplate();

      ctx.prisma.template.create.mockResolvedValue(template);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.create({
        title: 'New Template',
        category: 'response',
        content: 'Content',
        variables: {},
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'TEMPLATE',
          }),
        })
      );
    });
  });

  describe('approve', () => {
    it('should require MANAGER role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(caller.approve({ id: 'template-123' })).rejects.toThrow();
    });

    it('should set status to APPROVED and approvedById', async () => {
      ctx.user.role = Role.MANAGER;
      const template = factories.createTestTemplate({
        status: TemplateStatus.DRAFT,
      });
      const approved = factories.createTestTemplate({
        status: TemplateStatus.APPROVED,
        approvedById: ctx.user.id,
      });

      ctx.prisma.template.findFirst.mockResolvedValue(template);
      ctx.prisma.template.update.mockResolvedValue(approved);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.approve({ id: template.id });

      expect(result.status).toBe(TemplateStatus.APPROVED);
      expect(result.approvedById).toBe(ctx.user.id);
      expect(ctx.prisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TemplateStatus.APPROVED,
            approvedById: ctx.user.id,
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      ctx.user.role = Role.MANAGER;
      const template = factories.createTestTemplate();

      ctx.prisma.template.findFirst.mockResolvedValue(template);
      ctx.prisma.template.update.mockResolvedValue(template);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.approve({ id: template.id });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'APPROVE',
            resourceType: 'TEMPLATE',
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent template', async () => {
      ctx.user.role = Role.MANAGER;
      ctx.prisma.template.findFirst.mockResolvedValue(null);

      await expect(caller.approve({ id: 'nonexistent' })).rejects.toThrow(
        'NOT_FOUND'
      );
    });
  });

  describe('archive', () => {
    it('should set status to ARCHIVED', async () => {
      const template = factories.createTestTemplate({
        status: TemplateStatus.APPROVED,
      });
      const archived = factories.createTestTemplate({
        status: TemplateStatus.ARCHIVED,
      });

      ctx.prisma.template.findFirst.mockResolvedValue(template);
      ctx.prisma.template.update.mockResolvedValue(archived);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.archive({ id: template.id });

      expect(result.status).toBe(TemplateStatus.ARCHIVED);
      expect(ctx.prisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TemplateStatus.ARCHIVED,
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const template = factories.createTestTemplate();

      ctx.prisma.template.findFirst.mockResolvedValue(template);
      ctx.prisma.template.update.mockResolvedValue(template);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.archive({ id: template.id });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ARCHIVE',
            resourceType: 'TEMPLATE',
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent template', async () => {
      ctx.prisma.template.findFirst.mockResolvedValue(null);

      await expect(caller.archive({ id: 'nonexistent' })).rejects.toThrow(
        'NOT_FOUND'
      );
    });
  });

  describe('render', () => {
    it('should substitute variables correctly', async () => {
      const template = factories.createTestTemplate({
        content: 'Hello {{constituentName}}, your case {{referenceNumber}} is {{status}}.',
      });

      ctx.prisma.template.findFirst.mockResolvedValue(template);

      const result = await caller.render({
        templateId: template.id,
        variables: {
          constituentName: 'John Doe',
          referenceNumber: '2024-ABC123',
          status: 'open',
        },
      });

      expect(result.rendered).toBe(
        'Hello John Doe, your case 2024-ABC123 is open.'
      );
    });

    it('should handle multiple occurrences of same variable', async () => {
      const template = factories.createTestTemplate({
        content: '{{name}} is a {{name}}.',
      });

      ctx.prisma.template.findFirst.mockResolvedValue(template);

      const result = await caller.render({
        templateId: template.id,
        variables: {
          name: 'citizen',
        },
      });

      expect(result.rendered).toBe('citizen is a citizen.');
    });

    it('should leave unreplaced variables as-is', async () => {
      const template = factories.createTestTemplate({
        content: 'Hello {{name}}, your {{type}} is {{status}}.',
      });

      ctx.prisma.template.findFirst.mockResolvedValue(template);

      const result = await caller.render({
        templateId: template.id,
        variables: {
          name: 'John',
        },
      });

      expect(result.rendered).toBe('Hello John, your {{type}} is {{status}}.');
    });

    it('should return variables used in render', async () => {
      const template = factories.createTestTemplate();

      ctx.prisma.template.findFirst.mockResolvedValue(template);

      const variables = {
        constituentName: 'Jane',
        referenceNumber: '2024-XYZ789',
      };

      const result = await caller.render({
        templateId: template.id,
        variables,
      });

      expect(result.variables).toEqual(variables);
    });

    it('should throw NOT_FOUND for nonexistent template', async () => {
      ctx.prisma.template.findFirst.mockResolvedValue(null);

      await expect(
        caller.render({
          templateId: 'nonexistent',
          variables: {},
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('update', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.update({
          id: 'template-123',
          title: 'New Title',
        })
      ).rejects.toThrow();
    });

    it('should update template fields', async () => {
      const template = factories.createTestTemplate();
      const updated = factories.createTestTemplate({
        title: 'Updated Title',
        version: 2,
      });

      ctx.prisma.template.findFirst.mockResolvedValue(template);
      ctx.prisma.template.update.mockResolvedValue(updated);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.update({
        id: template.id,
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should increment version on update', async () => {
      const template = factories.createTestTemplate();

      ctx.prisma.template.findFirst.mockResolvedValue(template);
      ctx.prisma.template.update.mockResolvedValue(template);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: template.id,
        content: 'New content',
      });

      expect(ctx.prisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: { increment: 1 },
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent template', async () => {
      ctx.prisma.template.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({
          id: 'nonexistent',
          title: 'New Title',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });
});

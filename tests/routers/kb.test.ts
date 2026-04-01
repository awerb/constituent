import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kbRouter } from '@/server/routers/kb';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { Role } from '@prisma/client';

describe('kbRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext({ user: { ...createMockContext().user, role: Role.ADMIN } });
    caller = kbRouter.createCaller(ctx);
  });

  describe('list', () => {
    it('should list all KB articles', async () => {
      const articles = [
        factories.createTestKbArticle(),
        factories.createTestKbArticle(),
      ];
      ctx.prisma.kbArticle.findMany.mockResolvedValue(articles);

      const result = await caller.list({});

      expect(result).toEqual(articles);
    });

    it('should search articles by title', async () => {
      const articles = [
        factories.createTestKbArticle({ title: 'How to submit' }),
      ];
      ctx.prisma.kbArticle.findMany.mockResolvedValue(articles);

      await caller.list({ search: 'submit' });

      expect(ctx.prisma.kbArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
              expect.objectContaining({ content: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should search articles by content', async () => {
      const articles = [
        factories.createTestKbArticle({ content: 'Contains some info' }),
      ];
      ctx.prisma.kbArticle.findMany.mockResolvedValue(articles);

      await caller.list({ search: 'info' });

      expect(ctx.prisma.kbArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter articles by category', async () => {
      const articles = [
        factories.createTestKbArticle({ category: 'faq' }),
      ];
      ctx.prisma.kbArticle.findMany.mockResolvedValue(articles);

      await caller.list({ category: 'faq' });

      expect(ctx.prisma.kbArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'faq' }),
        })
      );
    });

    it('should filter articles by department', async () => {
      const deptId = 'dept-123';
      const articles = [
        factories.createTestKbArticle({ departmentId: deptId }),
      ];
      ctx.prisma.kbArticle.findMany.mockResolvedValue(articles);

      await caller.list({ departmentId: deptId });

      expect(ctx.prisma.kbArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: deptId }),
        })
      );
    });

    it('should include user relations', async () => {
      ctx.prisma.kbArticle.findMany.mockResolvedValue([]);

      await caller.list({});

      expect(ctx.prisma.kbArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            createdBy: true,
            department: true,
          },
        })
      );
    });

    it('should order by createdAt descending', async () => {
      ctx.prisma.kbArticle.findMany.mockResolvedValue([]);

      await caller.list({});

      expect(ctx.prisma.kbArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return KB article by id', async () => {
      const article = factories.createTestKbArticle();
      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);

      const result = await caller.getById({ id: article.id });

      expect(result).toEqual(article);
    });

    it('should include user relations', async () => {
      const article = factories.createTestKbArticle();
      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);

      await caller.getById({ id: article.id });

      expect(ctx.prisma.kbArticle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            createdBy: true,
            department: true,
          },
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent article', async () => {
      ctx.prisma.kbArticle.findFirst.mockResolvedValue(null);

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
          title: 'Article',
          content: 'Content',
          category: 'faq',
        })
      ).rejects.toThrow();
    });

    it('should create KB article with required fields', async () => {
      const article = factories.createTestKbArticle({
        isPublished: true,
      });

      ctx.prisma.kbArticle.create.mockResolvedValue(article);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.create({
        title: 'New Article',
        content: 'Article content here',
        category: 'guide',
      });

      expect(result.isPublished).toBe(true);
      expect(ctx.prisma.kbArticle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Article',
            content: 'Article content here',
            category: 'guide',
            isPublished: true,
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
          title: 'Article',
          content: 'Content',
          category: 'faq',
          departmentId: deptId,
        })
      ).rejects.toThrow('Department not found');
    });

    it('should create audit log entry', async () => {
      const article = factories.createTestKbArticle();

      ctx.prisma.kbArticle.create.mockResolvedValue(article);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.create({
        title: 'New Article',
        content: 'Content',
        category: 'faq',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'KB_ARTICLE',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should require ADMIN role', async () => {
      ctx.user.role = Role.AGENT;

      await expect(
        caller.update({
          id: 'article-123',
          title: 'New Title',
        })
      ).rejects.toThrow();
    });

    it('should update KB article fields', async () => {
      const article = factories.createTestKbArticle();
      const updated = factories.createTestKbArticle({
        title: 'Updated Title',
      });

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(updated);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.update({
        id: article.id,
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should update content', async () => {
      const article = factories.createTestKbArticle();

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(article);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: article.id,
        content: 'New content here',
      });

      expect(ctx.prisma.kbArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'New content here',
          }),
        })
      );
    });

    it('should update category', async () => {
      const article = factories.createTestKbArticle();

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(article);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: article.id,
        category: 'guide',
      });

      expect(ctx.prisma.kbArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'guide',
          }),
        })
      );
    });

    it('should update isPublished status', async () => {
      const article = factories.createTestKbArticle();

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(article);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: article.id,
        isPublished: false,
      });

      expect(ctx.prisma.kbArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublished: false,
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const article = factories.createTestKbArticle();

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(article);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: article.id,
        title: 'New Title',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            resourceType: 'KB_ARTICLE',
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent article', async () => {
      ctx.prisma.kbArticle.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({
          id: 'nonexistent',
          title: 'New Title',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('incrementUseCount', () => {
    it('should increment useCount by 1', async () => {
      const article = factories.createTestKbArticle({ useCount: 5 });
      const updated = factories.createTestKbArticle({ useCount: 6 });

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(updated);

      const result = await caller.incrementUseCount({ id: article.id });

      expect(result.useCount).toBe(6);
      expect(ctx.prisma.kbArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            useCount: { increment: 1 },
          }),
        })
      );
    });

    it('should increment from 0', async () => {
      const article = factories.createTestKbArticle({ useCount: 0 });
      const updated = factories.createTestKbArticle({ useCount: 1 });

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(updated);

      const result = await caller.incrementUseCount({ id: article.id });

      expect(result.useCount).toBe(1);
    });

    it('should include user relations in response', async () => {
      const article = factories.createTestKbArticle();

      ctx.prisma.kbArticle.findFirst.mockResolvedValue(article);
      ctx.prisma.kbArticle.update.mockResolvedValue(article);

      await caller.incrementUseCount({ id: article.id });

      expect(ctx.prisma.kbArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            createdBy: true,
            department: true,
          },
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent article', async () => {
      ctx.prisma.kbArticle.findFirst.mockResolvedValue(null);

      await expect(caller.incrementUseCount({ id: 'nonexistent' })).rejects.toThrow(
        'NOT_FOUND'
      );
    });
  });
});

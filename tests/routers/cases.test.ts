import { describe, it, expect, vi, beforeEach } from 'vitest';
import { casesRouter } from '@/server/routers/cases';
import { createMockContext, createTestDataFactories } from '../helpers/trpc-test-helpers';
import { CaseStatus, CasePriority, CaseSource, AuthorType } from '@prisma/client';

describe('casesRouter', () => {
  let ctx: any;
  let factories: any;
  let caller: any;

  beforeEach(() => {
    factories = createTestDataFactories();
    ctx = createMockContext();
    caller = casesRouter.createCaller(ctx);
  });

  describe('list', () => {
    it('should list cases with default pagination', async () => {
      const testCases = [
        factories.createTestCase({ status: CaseStatus.NEW }),
        factories.createTestCase({ status: CaseStatus.ASSIGNED }),
      ];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(2);

      const result = await caller.list({});

      expect(result.cases).toEqual(testCases);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cityId: ctx.cityId },
          skip: 0,
          take: 20,
        })
      );
    });

    it('should filter cases by status', async () => {
      const testCases = [factories.createTestCase({ status: CaseStatus.NEW })];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({ status: CaseStatus.NEW });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: CaseStatus.NEW }),
        })
      );
    });

    it('should filter cases by priority', async () => {
      const testCases = [factories.createTestCase({ priority: CasePriority.URGENT })];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({ priority: CasePriority.URGENT });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: CasePriority.URGENT }),
        })
      );
    });

    it('should filter cases by department', async () => {
      const deptId = 'dept-123';
      const testCases = [factories.createTestCase({ departmentId: deptId })];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({ departmentId: deptId });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: deptId }),
        })
      );
    });

    it('should filter cases by assignedToId', async () => {
      const userId = 'user-456';
      const testCases = [factories.createTestCase({ assignedToId: userId })];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({ assignedToId: userId });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedToId: userId }),
        })
      );
    });

    it('should filter cases by source', async () => {
      const testCases = [factories.createTestCase({ source: CaseSource.EMAIL })];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({ source: CaseSource.EMAIL });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ source: CaseSource.EMAIL }),
        })
      );
    });

    it('should search cases by reference number, subject, and email', async () => {
      const testCases = [factories.createTestCase()];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({ search: '2024-ABC123' });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ referenceNumber: expect.any(Object) }),
              expect.objectContaining({ subject: expect.any(Object) }),
              expect.objectContaining({ constituent: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should paginate correctly', async () => {
      const testCases = [factories.createTestCase()];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(50);

      const result = await caller.list({ page: 2, limit: 25 });

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        })
      );
      expect(result.totalPages).toBe(2);
    });

    it('should include constituent and department relations', async () => {
      const testCases = [factories.createTestCase()];
      ctx.prisma.case.findMany.mockResolvedValue(testCases);
      ctx.prisma.case.count.mockResolvedValue(1);

      await caller.list({});

      expect(ctx.prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            constituent: true,
            department: true,
            assignedTo: true,
          },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return case with full details', async () => {
      const testCase = factories.createTestCase();
      ctx.prisma.case.findFirst.mockResolvedValue(testCase);

      const result = await caller.getById({ id: testCase.id });

      expect(result).toEqual(testCase);
      expect(ctx.prisma.case.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: testCase.id,
            cityId: ctx.cityId,
          },
          include: {
            constituent: true,
            department: true,
            assignedTo: true,
            messages: expect.any(Object),
            newsletterItem: true,
            newsletterSignals: true,
          },
        })
      );
    });

    it('should return messages in ascending order by createdAt', async () => {
      const testCase = factories.createTestCase();
      ctx.prisma.case.findFirst.mockResolvedValue(testCase);

      await caller.getById({ id: testCase.id });

      expect(ctx.prisma.case.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            messages: expect.objectContaining({
              orderBy: { createdAt: 'asc' },
            }),
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent case', async () => {
      ctx.prisma.case.findFirst.mockResolvedValue(null);

      await expect(caller.getById({ id: 'nonexistent' })).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('create', () => {
    it('should create case and constituent if not found', async () => {
      const constituent = factories.createTestConstituent();
      const testCase = factories.createTestCase();
      const department = factories.createTestDepartment();

      ctx.prisma.constituent.upsert.mockResolvedValue(constituent);
      ctx.prisma.department.findFirst.mockResolvedValue(department);
      ctx.prisma.slaConfig.findFirst.mockResolvedValue(null);
      ctx.prisma.case.create.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.create({
        constituentEmail: 'test@example.com',
        constituentName: 'Test Person',
        subject: 'Test Subject',
        description: 'Test Description',
        source: CaseSource.WEB,
        departmentId: department.id,
      });

      expect(result).toEqual(testCase);
      expect(ctx.prisma.constituent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cityId_email: {
              cityId: ctx.cityId,
              email: 'test@example.com',
            },
          },
          create: expect.objectContaining({
            email: 'test@example.com',
            name: 'Test Person',
            cityId: ctx.cityId,
          }),
        })
      );
    });

    it('should find existing constituent by email', async () => {
      const constituent = factories.createTestConstituent({ email: 'existing@example.com' });
      const testCase = factories.createTestCase();
      const department = factories.createTestDepartment();

      ctx.prisma.constituent.upsert.mockResolvedValue(constituent);
      ctx.prisma.department.findFirst.mockResolvedValue(department);
      ctx.prisma.slaConfig.findFirst.mockResolvedValue(null);
      ctx.prisma.case.create.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.create({
        constituentEmail: 'existing@example.com',
        subject: 'Subject',
        description: 'Description',
        source: CaseSource.WEB,
        departmentId: department.id,
      });

      expect(ctx.prisma.constituent.upsert).toHaveBeenCalled();
    });

    it('should generate reference number with year and nanoid', async () => {
      const constituent = factories.createTestConstituent();
      const testCase = factories.createTestCase();
      const department = factories.createTestDepartment();

      ctx.prisma.constituent.upsert.mockResolvedValue(constituent);
      ctx.prisma.department.findFirst.mockResolvedValue(department);
      ctx.prisma.slaConfig.findFirst.mockResolvedValue(null);
      ctx.prisma.case.create.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.create({
        constituentEmail: 'test@example.com',
        subject: 'Subject',
        description: 'Description',
        source: CaseSource.WEB,
        departmentId: department.id,
      });

      expect(ctx.prisma.case.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referenceNumber: expect.stringMatching(/^\d{4}-[A-Z0-9]{8}$/),
          }),
        })
      );
    });

    it('should set SLA deadline from config or department default', async () => {
      const constituent = factories.createTestConstituent();
      const testCase = factories.createTestCase();
      const department = factories.createTestDepartment({ defaultSlaHours: 72 });
      const slaConfig = {
        responseHours: 24,
      };

      ctx.prisma.constituent.upsert.mockResolvedValue(constituent);
      ctx.prisma.department.findFirst.mockResolvedValue(department);
      ctx.prisma.slaConfig.findFirst.mockResolvedValue(slaConfig);
      ctx.prisma.case.create.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.create({
        constituentEmail: 'test@example.com',
        subject: 'Subject',
        description: 'Description',
        source: CaseSource.WEB,
        departmentId: department.id,
      });

      expect(ctx.prisma.case.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaDeadline: expect.any(Date),
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const constituent = factories.createTestConstituent();
      const testCase = factories.createTestCase();
      const department = factories.createTestDepartment();

      ctx.prisma.constituent.upsert.mockResolvedValue(constituent);
      ctx.prisma.department.findFirst.mockResolvedValue(department);
      ctx.prisma.slaConfig.findFirst.mockResolvedValue(null);
      ctx.prisma.case.create.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.create({
        constituentEmail: 'test@example.com',
        subject: 'Subject',
        description: 'Description',
        source: CaseSource.WEB,
        departmentId: department.id,
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resourceType: 'CASE',
          }),
        })
      );
    });

    it('should throw error if department not found', async () => {
      const constituent = factories.createTestConstituent();

      ctx.prisma.constituent.upsert.mockResolvedValue(constituent);
      ctx.prisma.department.findFirst.mockResolvedValue(null);

      await expect(
        caller.create({
          constituentEmail: 'test@example.com',
          subject: 'Subject',
          description: 'Description',
          source: CaseSource.WEB,
          departmentId: 'nonexistent',
        })
      ).rejects.toThrow('Department not found');
    });
  });

  describe('update', () => {
    it('should update case status', async () => {
      const existingCase = factories.createTestCase({ status: CaseStatus.NEW });
      const updatedCase = factories.createTestCase({ status: CaseStatus.ASSIGNED });

      ctx.prisma.case.findFirst.mockResolvedValue(existingCase);
      ctx.prisma.case.update.mockResolvedValue(updatedCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.update({
        id: existingCase.id,
        status: CaseStatus.ASSIGNED,
      });

      expect(result).toEqual(updatedCase);
      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CaseStatus.ASSIGNED }),
        })
      );
    });

    it('should set resolvedAt when status changes to RESOLVED', async () => {
      const existingCase = factories.createTestCase({ status: CaseStatus.IN_PROGRESS });

      ctx.prisma.case.findFirst.mockResolvedValue(existingCase);
      ctx.prisma.case.update.mockResolvedValue(existingCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existingCase.id,
        status: CaseStatus.RESOLVED,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CaseStatus.RESOLVED,
            resolvedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should set closedAt when status changes to CLOSED', async () => {
      const existingCase = factories.createTestCase({ status: CaseStatus.RESOLVED });

      ctx.prisma.case.findFirst.mockResolvedValue(existingCase);
      ctx.prisma.case.update.mockResolvedValue(existingCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existingCase.id,
        status: CaseStatus.CLOSED,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.anything(),
        })
      );
    });

    it('should auto-set status to ASSIGNED when assignedToId set on NEW case', async () => {
      const existingCase = factories.createTestCase({ status: CaseStatus.NEW });
      const userId = 'user-789';

      ctx.prisma.case.findFirst.mockResolvedValue(existingCase);
      ctx.prisma.case.update.mockResolvedValue(existingCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existingCase.id,
        assignedToId: userId,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedToId: userId,
            status: CaseStatus.ASSIGNED,
          }),
        })
      );
    });

    it('should not change status if assignedToId set on non-NEW case', async () => {
      const existingCase = factories.createTestCase({ status: CaseStatus.IN_PROGRESS });
      const userId = 'user-789';

      ctx.prisma.case.findFirst.mockResolvedValue(existingCase);
      ctx.prisma.case.update.mockResolvedValue(existingCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existingCase.id,
        assignedToId: userId,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignedToId: userId,
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const existingCase = factories.createTestCase();

      ctx.prisma.case.findFirst.mockResolvedValue(existingCase);
      ctx.prisma.case.update.mockResolvedValue(existingCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.update({
        id: existingCase.id,
        priority: CasePriority.HIGH,
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            resourceType: 'CASE',
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent case', async () => {
      ctx.prisma.case.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({
          id: 'nonexistent',
          status: CaseStatus.ASSIGNED,
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('addMessage', () => {
    it('should create STAFF message on case', async () => {
      const testCase = factories.createTestCase();
      const message = {
        id: 'msg-123',
        caseId: testCase.id,
        authorType: AuthorType.STAFF,
        authorId: ctx.user.id,
        content: 'Test response',
        isInternalNote: false,
      };

      ctx.prisma.case.findFirst.mockResolvedValue(testCase);
      ctx.prisma.caseMessage.create.mockResolvedValue(message);
      ctx.prisma.case.update.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.addMessage({
        caseId: testCase.id,
        content: 'Test response',
      });

      expect(result.authorType).toBe(AuthorType.STAFF);
      expect(result.authorId).toBe(ctx.user.id);
    });

    it('should set firstRespondedAt on first non-internal response', async () => {
      const testCase = factories.createTestCase({ firstRespondedAt: null });

      ctx.prisma.case.findFirst.mockResolvedValue(testCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.addMessage({
        caseId: testCase.id,
        content: 'Response',
        isInternalNote: false,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstRespondedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should move status from AWAITING_RESPONSE to IN_PROGRESS on non-internal message', async () => {
      const testCase = factories.createTestCase({ status: CaseStatus.AWAITING_RESPONSE });

      ctx.prisma.case.findFirst.mockResolvedValue(testCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue(testCase);
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.addMessage({
        caseId: testCase.id,
        content: 'Response',
        isInternalNote: false,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CaseStatus.IN_PROGRESS,
          }),
        })
      );
    });

    it('should not update status for internal notes', async () => {
      const testCase = factories.createTestCase({ status: CaseStatus.AWAITING_RESPONSE });

      ctx.prisma.case.findFirst.mockResolvedValue(testCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.addMessage({
        caseId: testCase.id,
        content: 'Internal note',
        isInternalNote: true,
      });

      // Should not call update if no status changes needed
      expect(ctx.prisma.case.update).not.toHaveBeenCalled();
    });

    it('should default isPublicRecordsExcluded to true for internal notes', async () => {
      const testCase = factories.createTestCase();

      ctx.prisma.case.findFirst.mockResolvedValue(testCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.addMessage({
        caseId: testCase.id,
        content: 'Internal',
        isInternalNote: true,
      });

      expect(ctx.prisma.caseMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isInternalNote: true,
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const testCase = factories.createTestCase();

      ctx.prisma.case.findFirst.mockResolvedValue(testCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({ id: 'msg-123' });
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.addMessage({
        caseId: testCase.id,
        content: 'Test',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ADD_MESSAGE',
            resourceType: 'CASE',
          }),
        })
      );
    });

    it('should throw NOT_FOUND for nonexistent case', async () => {
      ctx.prisma.case.findFirst.mockResolvedValue(null);

      await expect(
        caller.addMessage({
          caseId: 'nonexistent',
          content: 'Test',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('merge', () => {
    it('should move all messages from source to target case', async () => {
      const targetCase = factories.createTestCase();
      const sourceCase = factories.createTestCase();

      ctx.prisma.case.findFirst
        .mockResolvedValueOnce(targetCase)
        .mockResolvedValueOnce(sourceCase);
      ctx.prisma.caseMessage.updateMany.mockResolvedValue({ count: 3 });
      ctx.prisma.case.update.mockResolvedValue(sourceCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.merge({
        targetCaseId: targetCase.id,
        sourceCaseId: sourceCase.id,
      });

      expect(ctx.prisma.caseMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { caseId: sourceCase.id },
          data: { caseId: targetCase.id },
        })
      );
    });

    it('should close source case with system message', async () => {
      const targetCase = factories.createTestCase();
      const sourceCase = factories.createTestCase();

      ctx.prisma.case.findFirst
        .mockResolvedValueOnce(targetCase)
        .mockResolvedValueOnce(sourceCase);
      ctx.prisma.caseMessage.updateMany.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue(sourceCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.merge({
        targetCaseId: targetCase.id,
        sourceCaseId: sourceCase.id,
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CaseStatus.CLOSED,
            closedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should create system message on target case', async () => {
      const targetCase = factories.createTestCase();
      const sourceCase = factories.createTestCase();

      ctx.prisma.case.findFirst
        .mockResolvedValueOnce(targetCase)
        .mockResolvedValueOnce(sourceCase);
      ctx.prisma.caseMessage.updateMany.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue(sourceCase);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.merge({
        targetCaseId: targetCase.id,
        sourceCaseId: sourceCase.id,
      });

      expect(ctx.prisma.caseMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            caseId: targetCase.id,
            authorType: AuthorType.SYSTEM,
            isInternalNote: true,
          }),
        })
      );
    });

    it('should require MANAGER role', async () => {
      ctx.user.role = 'AGENT';

      await expect(
        caller.merge({
          targetCaseId: 'case-1',
          sourceCaseId: 'case-2',
        })
      ).rejects.toThrow();
    });

    it('should throw if cases not found', async () => {
      ctx.prisma.case.findFirst.mockResolvedValue(null);

      await expect(
        caller.merge({
          targetCaseId: 'case-1',
          sourceCaseId: 'case-2',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('batchRespond', () => {
    it('should create messages on multiple cases', async () => {
      const caseIds = ['case-1', 'case-2', 'case-3'];
      const cases = caseIds.map((id) => factories.createTestCase({ id }));

      ctx.prisma.case.findMany.mockResolvedValue(cases);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      const result = await caller.batchRespond({
        caseIds,
        content: 'Batch response',
      });

      expect(result.messageCount).toBe(3);
      expect(ctx.prisma.caseMessage.create).toHaveBeenCalledTimes(3);
    });

    it('should update cases to IN_PROGRESS status', async () => {
      const cases = [factories.createTestCase(), factories.createTestCase()];

      ctx.prisma.case.findMany.mockResolvedValue(cases);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.batchRespond({
        caseIds: cases.map((c) => c.id),
        content: 'Response',
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledTimes(2);
      expect(ctx.prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CaseStatus.IN_PROGRESS,
          }),
        })
      );
    });

    it('should set firstRespondedAt if not already set', async () => {
      const caseWithoutResponse = factories.createTestCase({ firstRespondedAt: null });
      const caseWithResponse = factories.createTestCase({ firstRespondedAt: new Date() });
      const cases = [caseWithoutResponse, caseWithResponse];

      ctx.prisma.case.findMany.mockResolvedValue(cases);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.batchRespond({
        caseIds: cases.map((c) => c.id),
        content: 'Response',
      });

      expect(ctx.prisma.case.update).toHaveBeenCalledTimes(2);
    });

    it('should create audit log with case count and IDs', async () => {
      const cases = [factories.createTestCase(), factories.createTestCase()];

      ctx.prisma.case.findMany.mockResolvedValue(cases);
      ctx.prisma.caseMessage.create.mockResolvedValue({});
      ctx.prisma.case.update.mockResolvedValue({});
      ctx.prisma.auditLog.create.mockResolvedValue({});

      await caller.batchRespond({
        caseIds: cases.map((c) => c.id),
        content: 'Response',
      });

      expect(ctx.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'BATCH_RESPOND',
            details: expect.objectContaining({
              caseCount: 2,
            }),
          }),
        })
      );
    });

    it('should throw if no cases found', async () => {
      ctx.prisma.case.findMany.mockResolvedValue([]);

      await expect(
        caller.batchRespond({
          caseIds: ['nonexistent'],
          content: 'Response',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('getViewers', () => {
    it('should return list of user IDs viewing case', async () => {
      const viewers = ['user-1', 'user-2', 'user-3'];
      ctx.redis.smembers.mockResolvedValue(viewers);

      const result = await caller.getViewers({ caseId: 'case-123' });

      expect(result.viewers).toEqual(viewers);
      expect(ctx.redis.smembers).toHaveBeenCalledWith('case:case-123:viewers');
    });

    it('should return empty array if no viewers', async () => {
      ctx.redis.smembers.mockResolvedValue([]);

      const result = await caller.getViewers({ caseId: 'case-123' });

      expect(result.viewers).toEqual([]);
    });
  });

  describe('setViewing', () => {
    it('should add user to viewing set with TTL', async () => {
      ctx.redis.sadd.mockResolvedValue(1);
      ctx.redis.expire.mockResolvedValue(1);

      const result = await caller.setViewing({ caseId: 'case-123' });

      expect(result.success).toBe(true);
      expect(ctx.redis.sadd).toHaveBeenCalledWith('case:case-123:viewers', ctx.user.id);
      expect(ctx.redis.expire).toHaveBeenCalledWith('case:case-123:viewers', 300);
    });
  });
});

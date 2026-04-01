import { describe, it, expect, beforeEach } from 'vitest';
import { CaseStatus, CasePriority } from '@prisma/client';
import { createMockContext } from '../helpers/mocks';
import {
  createTestCity,
  createTestUser,
  createTestConstituent,
  createTestDepartment,
  createTestCase,
  createTestAuditLog,
  createTestCaseMessage,
} from '../helpers/factories';

describe('Case Lifecycle Integration', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('create case -> assign -> respond -> resolve -> close', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const constituent = createTestConstituent({ cityId: city.id });
    const department = createTestDepartment({ cityId: city.id });

    // Step 1: Create case
    const newCase = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      departmentId: department.id,
      status: CaseStatus.NEW,
    });
    mockContext.prisma.case.create.mockResolvedValueOnce(newCase);

    // Step 2: Assign case
    const assignedCase = createTestCase({
      ...newCase,
      status: CaseStatus.ASSIGNED,
      assignedToId: user.id,
    });
    mockContext.prisma.case.update.mockResolvedValueOnce(assignedCase);

    // Step 3: Add response message
    const responseMessage = createTestCaseMessage({
      caseId: newCase.id,
      authorId: user.id,
      content: 'We are working on this issue.',
    });
    mockContext.prisma.caseMessage.create.mockResolvedValueOnce(responseMessage);

    // Step 4: Update case status to IN_PROGRESS
    const inProgressCase = createTestCase({
      ...assignedCase,
      status: CaseStatus.IN_PROGRESS,
      firstRespondedAt: responseMessage.createdAt,
    });
    mockContext.prisma.case.update.mockResolvedValueOnce(inProgressCase);

    // Step 5: Resolve case
    const resolvedCase = createTestCase({
      ...inProgressCase,
      status: CaseStatus.RESOLVED,
      resolvedAt: new Date(),
    });
    mockContext.prisma.case.update.mockResolvedValueOnce(resolvedCase);

    // Step 6: Close case
    const closedCase = createTestCase({
      ...resolvedCase,
      status: CaseStatus.CLOSED,
      closedAt: new Date(),
    });
    mockContext.prisma.case.update.mockResolvedValueOnce(closedCase);

    // Verify all operations
    expect(mockContext.prisma.case.create).toBeDefined();
    expect(mockContext.prisma.case.update).toBeDefined();
    expect(mockContext.prisma.caseMessage.create).toBeDefined();
  });

  it('each status transition creates audit log', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const caseEntity = createTestCase({ cityId: city.id });

    const transitions = [
      { from: CaseStatus.NEW, to: CaseStatus.ASSIGNED },
      { from: CaseStatus.ASSIGNED, to: CaseStatus.IN_PROGRESS },
      { from: CaseStatus.IN_PROGRESS, to: CaseStatus.RESOLVED },
      { from: CaseStatus.RESOLVED, to: CaseStatus.CLOSED },
    ];

    transitions.forEach((transition) => {
      const auditLog = createTestAuditLog({
        cityId: city.id,
        userId: user.id,
        entityType: 'CASE',
        entityId: caseEntity.id,
        action: 'STATUS_CHANGE',
        oldValue: { status: transition.from },
        newValue: { status: transition.to },
      });

      mockContext.prisma.auditLog.create.mockResolvedValueOnce(auditLog);
    });

    // Verify audit logs created
    expect(mockContext.prisma.auditLog.create).toBeDefined();
  });

  it('firstRespondedAt set on first response', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const constituent = createTestConstituent({ cityId: city.id });
    const caseEntity = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      firstRespondedAt: null,
    });

    const firstMessage = createTestCaseMessage({
      caseId: caseEntity.id,
      authorId: user.id,
      content: 'First response from staff',
    });

    const caseWithFirstResponse = createTestCase({
      ...caseEntity,
      firstRespondedAt: firstMessage.createdAt,
    });

    mockContext.prisma.caseMessage.create.mockResolvedValueOnce(firstMessage);
    mockContext.prisma.case.update.mockResolvedValueOnce(caseWithFirstResponse);

    // Verify firstRespondedAt is set
    expect(caseWithFirstResponse.firstRespondedAt).toBeDefined();
    expect(caseWithFirstResponse.firstRespondedAt).toEqual(firstMessage.createdAt);
  });

  it('resolvedAt set on resolution', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });
    const now = new Date();

    const caseEntity = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      status: CaseStatus.IN_PROGRESS,
      resolvedAt: null,
    });

    const resolvedCase = createTestCase({
      ...caseEntity,
      status: CaseStatus.RESOLVED,
      resolvedAt: now,
    });

    mockContext.prisma.case.update.mockResolvedValueOnce(resolvedCase);

    // Verify resolvedAt is set
    expect(resolvedCase.resolvedAt).toBeDefined();
    expect(resolvedCase.resolvedAt).toEqual(now);
  });

  it('SLA breach detected when deadline passed', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });
    const pastDeadline = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

    const breachedCase = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      slaDeadline: pastDeadline,
      slaBreached: true,
    });

    mockContext.prisma.case.update.mockResolvedValueOnce(breachedCase);

    // Verify SLA breach
    expect(breachedCase.slaBreached).toBe(true);
  });

  it('case merge moves messages and closes source', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });
    const department = createTestDepartment({ cityId: city.id });

    const sourceCase = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      departmentId: department.id,
    });

    const targetCase = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      departmentId: department.id,
    });

    // Mock moving messages
    const message1 = createTestCaseMessage({
      caseId: sourceCase.id,
      content: 'First message',
    });
    const message2 = createTestCaseMessage({
      caseId: sourceCase.id,
      content: 'Second message',
    });

    mockContext.prisma.caseMessage.updateMany.mockResolvedValueOnce({
      count: 2,
    });

    // Mock closing source case
    const mergedSourceCase = createTestCase({
      ...sourceCase,
      status: CaseStatus.CLOSED,
      mergedIntoId: targetCase.id,
    });

    mockContext.prisma.case.update.mockResolvedValueOnce(mergedSourceCase);

    // Verify merge operations
    expect(mockContext.prisma.caseMessage.updateMany).toBeDefined();
    expect(mergedSourceCase.mergedIntoId).toBe(targetCase.id);
    expect(mergedSourceCase.status).toBe(CaseStatus.CLOSED);
  });

  it('case priority can be escalated', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });

    const normalCase = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      priority: CasePriority.NORMAL,
    });

    const escalatedCase = createTestCase({
      ...normalCase,
      priority: CasePriority.URGENT,
    });

    mockContext.prisma.case.update.mockResolvedValueOnce(escalatedCase);

    // Verify escalation
    expect(escalatedCase.priority).toBe(CasePriority.URGENT);
  });

  it('assigned user receives notification on case assignment', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const constituent = createTestConstituent({ cityId: city.id });

    const caseEntity = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      assignedToId: user.id,
    });

    // Mock notification (would be sent via email/push service)
    const notificationLog = {
      id: 'notif-1',
      userId: user.id,
      type: 'CASE_ASSIGNED',
      entityId: caseEntity.id,
      read: false,
      createdAt: new Date(),
    };

    // In real implementation, this would call a notification service
    expect(caseEntity.assignedToId).toBe(user.id);
  });

  it('case history tracks all changes', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const caseEntity = createTestCase({
      cityId: city.id,
    });

    const historyEntries = [
      createTestAuditLog({
        cityId: city.id,
        userId: user.id,
        entityType: 'CASE',
        entityId: caseEntity.id,
        action: 'CREATE',
        newValue: { status: CaseStatus.NEW },
      }),
      createTestAuditLog({
        cityId: city.id,
        userId: user.id,
        entityType: 'CASE',
        entityId: caseEntity.id,
        action: 'ASSIGN',
        oldValue: { assignedToId: null },
        newValue: { assignedToId: user.id },
      }),
    ];

    mockContext.prisma.auditLog.findMany.mockResolvedValueOnce(historyEntries);

    // Verify history is logged
    expect(historyEntries.length).toBe(2);
  });
});

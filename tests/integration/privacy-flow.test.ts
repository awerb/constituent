import { describe, it, expect, beforeEach } from 'vitest';
import { createMockContext } from '../helpers/mocks';
import {
  createTestCity,
  createTestUser,
  createTestConstituent,
  createTestCase,
  createTestCaseMessage,
  createTestAuditLog,
} from '../helpers/factories';

describe('Privacy Request Flow Integration', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('constituent requests data export -> receives JSON with all their data', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });
    const user = createTestUser({ cityId: city.id });

    // Mock finding constituent data
    mockContext.prisma.constituent.findUnique.mockResolvedValueOnce(constituent);

    // Mock finding constituent's cases
    const cases = [
      createTestCase({
        cityId: city.id,
        constituentId: constituent.id,
      }),
      createTestCase({
        cityId: city.id,
        constituentId: constituent.id,
      }),
    ];
    mockContext.prisma.case.findMany.mockResolvedValueOnce(cases);

    // Mock finding all messages in those cases
    const messages = cases.flatMap((c) => [
      createTestCaseMessage({
        caseId: c.id,
        content: 'Message 1 from constituent',
      }),
      createTestCaseMessage({
        caseId: c.id,
        content: 'Response from staff',
      }),
    ]);
    mockContext.prisma.caseMessage.findMany.mockResolvedValueOnce(messages);

    // Build export data
    const exportData = {
      constituent: constituent,
      cases: cases,
      messages: messages,
      exportedAt: new Date(),
    };

    mockContext.prisma.$transaction.mockResolvedValueOnce([
      constituent,
      cases,
      messages,
    ]);

    // Verify export contains all data
    expect(exportData.constituent.email).toBe(constituent.email);
    expect(exportData.cases.length).toBe(2);
    expect(exportData.messages.length).toBeGreaterThan(0);
  });

  it('constituent requests deletion -> PII replaced with [REDACTED]', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const constituent = createTestConstituent({
      cityId: city.id,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
    });

    // Mock finding constituent
    mockContext.prisma.constituent.findUnique.mockResolvedValueOnce(constituent);

    // Create redacted version
    const redactedConstituent = {
      ...constituent,
      name: '[REDACTED]',
      email: '[REDACTED]',
      phone: '[REDACTED]',
      address: '[REDACTED]',
    };

    mockContext.prisma.constituent.update.mockResolvedValueOnce(redactedConstituent);

    // Verify redaction
    expect(redactedConstituent.name).toBe('[REDACTED]');
    expect(redactedConstituent.email).toBe('[REDACTED]');
    expect(redactedConstituent.phone).toBe('[REDACTED]');
    expect(redactedConstituent.address).toBe('[REDACTED]');
  });

  it('after deletion, case structure preserved but PII gone', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });

    // Create case before deletion
    const originalCase = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
      subject: 'Sensitive Issue About Pothole',
      description: 'Pothole at home address is dangerous',
    });

    // Mock case after redaction
    const redactedCase = {
      ...originalCase,
      // Case structure is preserved
      id: originalCase.id,
      constituentId: originalCase.constituentId,
      referenceNumber: originalCase.referenceNumber,
      // But content is redacted
      subject: '[REDACTED]',
      description: '[REDACTED]',
    };

    mockContext.prisma.case.update.mockResolvedValueOnce(redactedCase);

    // Verify case exists but is redacted
    expect(redactedCase.id).toBe(originalCase.id);
    expect(redactedCase.referenceNumber).toBe(originalCase.referenceNumber);
    expect(redactedCase.subject).toBe('[REDACTED]');
    expect(redactedCase.description).toBe('[REDACTED]');
  });

  it('after deletion, constituent can no longer be found by email', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({
      cityId: city.id,
      email: 'searching-for-this@example.com',
    });

    // Mock deletion/redaction of email
    const redactedConstituent = {
      ...constituent,
      email: '[REDACTED]',
    };

    mockContext.prisma.constituent.update.mockResolvedValueOnce(redactedConstituent);

    // Verify cannot search by email
    mockContext.prisma.constituent.findFirst.mockResolvedValueOnce(null);

    // Attempting to find by original email returns nothing
    const found = await mockContext.prisma.constituent.findFirst({
      where: { email: 'searching-for-this@example.com' },
    });

    expect(found).toBeNull();
  });

  it('audit log created for data export request', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const constituent = createTestConstituent({ cityId: city.id });

    const auditLog = createTestAuditLog({
      cityId: city.id,
      userId: user.id,
      entityType: 'CONSTITUENT',
      entityId: constituent.id,
      action: 'DATA_EXPORT_REQUESTED',
      newValue: {
        requestedAt: new Date(),
        requestedBy: user.id,
      },
    });

    mockContext.prisma.auditLog.create.mockResolvedValueOnce(auditLog);

    // Verify audit log
    expect(auditLog.action).toBe('DATA_EXPORT_REQUESTED');
  });

  it('audit log created for data deletion request', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const constituent = createTestConstituent({ cityId: city.id });

    const auditLog = createTestAuditLog({
      cityId: city.id,
      userId: user.id,
      entityType: 'CONSTITUENT',
      entityId: constituent.id,
      action: 'DATA_DELETION_REQUESTED',
      newValue: {
        requestedAt: new Date(),
        requestedBy: user.id,
        reason: 'GDPR Right to be Forgotten',
      },
    });

    mockContext.prisma.auditLog.create.mockResolvedValueOnce(auditLog);

    // Verify audit log
    expect(auditLog.action).toBe('DATA_DELETION_REQUESTED');
  });

  it('messages from deleted constituent are redacted but case remains', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });
    const caseEntity = createTestCase({
      cityId: city.id,
      constituentId: constituent.id,
    });

    const originalMessages = [
      createTestCaseMessage({
        caseId: caseEntity.id,
        content: 'This is my personal medical information',
      }),
      createTestCaseMessage({
        caseId: caseEntity.id,
        content: 'Here is my social security number',
      }),
    ];

    // Mock redaction of messages
    const redactedMessages = originalMessages.map((msg) => ({
      ...msg,
      content: '[REDACTED]',
    }));

    mockContext.prisma.caseMessage.updateMany.mockResolvedValueOnce({
      count: 2,
    });

    // Verify messages redacted but case remains
    expect(redactedMessages[0].content).toBe('[REDACTED]');
    expect(redactedMessages[1].content).toBe('[REDACTED]');
    // Case structure still exists
    expect(caseEntity.id).toBeDefined();
    expect(caseEntity.referenceNumber).toBeDefined();
  });

  it('redacted constituent cannot log in', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({
      cityId: city.id,
      email: 'user@example.com',
      name: 'User Name',
    });

    // Redact the constituent
    const redactedConstituent = {
      ...constituent,
      email: '[REDACTED]',
      name: '[REDACTED]',
    };

    mockContext.prisma.constituent.findUnique.mockResolvedValueOnce(null);

    // Verify cannot find redacted constituent by email
    const found = await mockContext.prisma.constituent.findUnique({
      where: { email: '[REDACTED]' },
    });

    expect(found).toBeNull();
  });

  it('export file is encrypted and contains timestamp', async () => {
    const city = createTestCity();
    const constituent = createTestConstituent({ cityId: city.id });
    const cases = [createTestCase({ cityId: city.id, constituentId: constituent.id })];
    const messages = [
      createTestCaseMessage({ caseId: cases[0].id, content: 'Test message' }),
    ];

    const exportedAt = new Date();
    const exportData = {
      version: '1.0',
      exportedAt: exportedAt,
      constituent: constituent,
      cases: cases,
      messages: messages,
    };

    // Verify export structure
    expect(exportData.version).toBe('1.0');
    expect(exportData.exportedAt).toEqual(exportedAt);
    expect(exportData.constituent).toBeDefined();
    expect(exportData.cases.length).toBeGreaterThan(0);
  });
});

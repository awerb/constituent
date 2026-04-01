import { CaseStatus, CasePriority, CaseSource, Role, AuthorType, TemplateStatus } from '@prisma/client';

// Helper to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper to generate unique emails
function generateEmail(): string {
  return `test-${generateId()}@example.com`;
}

// City
export function createTestCity(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    name: overrides?.name || 'Test City',
    state: overrides?.state || 'CA',
    timezone: overrides?.timezone || 'America/Los_Angeles',
    primaryColor: overrides?.primaryColor || '#3b82f6',
    fromEmail: overrides?.fromEmail || 'noreply@test.city.gov',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// User
export function createTestUser(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    email: overrides?.email || generateEmail(),
    name: overrides?.name || 'Test User',
    role: overrides?.role || Role.AGENT,
    departmentId: overrides?.departmentId || null,
    ward: overrides?.ward || null,
    isActive: overrides?.isActive !== false,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// Constituent
export function createTestConstituent(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    email: overrides?.email || generateEmail(),
    name: overrides?.name || 'Test Constituent',
    phone: overrides?.phone || '+1-555-0123',
    address: overrides?.address || '123 Main St',
    ward: overrides?.ward || '1',
    privacyLevel: overrides?.privacyLevel || 'PUBLIC',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// Department
export function createTestDepartment(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    name: overrides?.name || 'Test Department',
    description: overrides?.description || 'A test department',
    topics: overrides?.topics || ['general'],
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// Case
export function createTestCase(overrides?: any) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    constituentId: overrides?.constituentId || generateId(),
    referenceNumber: overrides?.referenceNumber || `REF-${generateId().substring(0, 8).toUpperCase()}`,
    subject: overrides?.subject || 'Test Case',
    description: overrides?.description || 'This is a test case',
    status: overrides?.status || CaseStatus.NEW,
    priority: overrides?.priority || CasePriority.NORMAL,
    source: overrides?.source || CaseSource.WEB,
    departmentId: overrides?.departmentId || generateId(),
    assignedToId: overrides?.assignedToId || null,
    slaDeadline: overrides?.slaDeadline || sevenDaysFromNow,
    slaBreached: overrides?.slaBreached !== undefined ? overrides.slaBreached : false,
    firstRespondedAt: overrides?.firstRespondedAt || null,
    resolvedAt: overrides?.resolvedAt || null,
    closedAt: overrides?.closedAt || null,
    mergedIntoId: overrides?.mergedIntoId || null,
    createdAt: overrides?.createdAt || now,
    updatedAt: overrides?.updatedAt || now,
  };
}

// Case Message
export function createTestCaseMessage(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    caseId: overrides?.caseId || generateId(),
    authorId: overrides?.authorId || generateId(),
    authorType: overrides?.authorType || AuthorType.CONSTITUENT,
    content: overrides?.content || 'This is a test message',
    isInternalNote: overrides?.isInternalNote !== undefined ? overrides.isInternalNote : false,
    isPublicRecordsExcluded: overrides?.isPublicRecordsExcluded !== undefined ? overrides.isPublicRecordsExcluded : false,
    contentLanguage: overrides?.contentLanguage || 'en',
    attachments: overrides?.attachments || null,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// Newsletter Item
export function createTestNewsletterItem(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    constituentEmail: overrides?.constituentEmail || generateEmail(),
    constituentName: overrides?.constituentName || 'Test Constituent',
    subject: overrides?.subject || 'Test Newsletter Issue',
    description: overrides?.description || 'A test newsletter item',
    flag: overrides?.flag !== undefined ? overrides.flag : true,
    flagExpiresAt: overrides?.flagExpiresAt || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// Signal
export function createTestSignal(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    constituentId: overrides?.constituentId || generateId(),
    type: overrides?.type || 'FLAG',
    caseId: overrides?.caseId || null,
    newsletterItemId: overrides?.newsletterItemId || null,
    metadata: overrides?.metadata || {},
    createdAt: overrides?.createdAt || new Date(),
  };
}

// Template
export function createTestTemplate(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    name: overrides?.name || 'Test Template',
    content: overrides?.content || 'Dear [CONSTITUENT_NAME],\n\nThank you for contacting us.',
    category: overrides?.category || 'general',
    description: overrides?.description || 'A test template',
    variables: overrides?.variables || ['CONSTITUENT_NAME', 'CASE_REF'],
    status: overrides?.status || TemplateStatus.ACTIVE,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// SLA Config
export function createTestSlaConfig(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    departmentId: overrides?.departmentId || generateId(),
    priority: overrides?.priority || CasePriority.NORMAL,
    firstResponseHours: overrides?.firstResponseHours || 24,
    resolutionHours: overrides?.resolutionHours || 168,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
}

// Audit Log
export function createTestAuditLog(overrides?: any) {
  return {
    id: overrides?.id || generateId(),
    cityId: overrides?.cityId || generateId(),
    userId: overrides?.userId || generateId(),
    entityType: overrides?.entityType || 'CASE',
    entityId: overrides?.entityId || generateId(),
    action: overrides?.action || 'CREATE',
    oldValue: overrides?.oldValue || null,
    newValue: overrides?.newValue || {},
    createdAt: overrides?.createdAt || new Date(),
  };
}

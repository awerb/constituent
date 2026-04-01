import { vi } from 'vitest';
import type { TRPCContext } from '@/server/context';
import type { Prisma, User as PrismaUser, Case, Constituent, Department, Template, KbArticle, AuditLog } from '@prisma/client';
import { CaseStatus, CasePriority, CaseSource, TemplateStatus, Role } from '@prisma/client';

export interface MockContext {
  user: PrismaUser;
  cityId: string;
  prisma: any;
  redis: any;
  req?: any;
}

export interface TestDataFactories {
  createTestUser: (overrides?: Partial<PrismaUser>) => PrismaUser;
  createTestConstituent: (overrides?: Partial<Constituent>) => Constituent;
  createTestCase: (overrides?: Partial<Case>) => Case;
  createTestDepartment: (overrides?: Partial<Department>) => Department;
  createTestTemplate: (overrides?: Partial<Template>) => Template;
  createTestKbArticle: (overrides?: Partial<KbArticle>) => KbArticle;
  createTestAuditLog: (overrides?: Partial<AuditLog>) => AuditLog;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateEmail(): string {
  return `user-${generateId()}@test.local`;
}

export function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  const defaultUser: PrismaUser = {
    id: generateId(),
    cityId: 'test-city-id',
    email: generateEmail(),
    name: 'Test User',
    role: Role.AGENT,
    departmentId: null,
    ward: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultContext: MockContext = {
    user: { ...defaultUser, ...overrides.user },
    cityId: overrides.cityId || 'test-city-id',
    prisma: createMockPrisma(),
    redis: createMockRedis(),
    ...overrides,
  };

  return defaultContext;
}

export function createMockPrisma() {
  return {
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    case: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    constituent: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    template: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    kbArticle: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    caseMessage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    city: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    slaConfig: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    webhook: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    newsletterItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    newsletterSignal: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
}

export function createMockRedis() {
  return {
    smembers: vi.fn().mockResolvedValue([]),
    sadd: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    lpush: vi.fn().mockResolvedValue(1),
    rpop: vi.fn().mockResolvedValue(null),
    lrange: vi.fn().mockResolvedValue([]),
    del: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  };
}

export function createTestDataFactories(): TestDataFactories {
  return {
    createTestUser: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      email: generateEmail(),
      name: 'Test User',
      role: Role.AGENT,
      departmentId: null,
      ward: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as PrismaUser),

    createTestConstituent: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      email: generateEmail(),
      name: 'Test Constituent',
      phone: '555-0100',
      address: '123 Main St',
      ward: 'Ward 1',
      district: 'District A',
      languagePreference: 'en',
      privacyStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Constituent),

    createTestCase: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      referenceNumber: `2024-${generateId().substring(0, 8)}`,
      constituentId: generateId(),
      departmentId: generateId(),
      subject: 'Test Case Subject',
      description: 'Test case description',
      priority: CasePriority.NORMAL,
      status: CaseStatus.NEW,
      source: CaseSource.WEB,
      assignedToId: null,
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      slaBreached: false,
      firstRespondedAt: null,
      resolvedAt: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Case),

    createTestDepartment: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      name: 'Test Department',
      slug: 'test-department',
      description: 'Test department description',
      topicTags: ['test', 'topic'],
      defaultSlaHours: 48,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Department),

    createTestTemplate: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      title: 'Test Template',
      category: 'response',
      content: 'Hello {{constituentName}}, your case {{referenceNumber}} has been received.',
      variables: {
        constituentName: 'string',
        referenceNumber: 'string',
      },
      departmentId: null,
      createdById: generateId(),
      approvedById: null,
      status: TemplateStatus.DRAFT,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Template),

    createTestKbArticle: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      title: 'Test KB Article',
      content: 'This is test KB content.',
      category: 'faq',
      departmentId: null,
      createdById: generateId(),
      isPublished: true,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as KbArticle),

    createTestAuditLog: (overrides = {}) => ({
      id: generateId(),
      cityId: 'test-city-id',
      userId: generateId(),
      action: 'CREATE',
      resourceType: 'CASE',
      resourceId: generateId(),
      details: {},
      createdAt: new Date(),
      ...overrides,
    } as AuditLog),
  };
}

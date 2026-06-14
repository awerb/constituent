import { vi } from 'vitest';
import { CaseStatus, CasePriority, CaseSource, Role, TemplateStatus } from '@prisma/client';

function createModelMock() {
  return {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

export function createMockPrisma() {
  const models = [
    'city',
    'user',
    'department',
    'constituent',
    'case',
    'caseMessage',
    'newsletterItem',
    'newsletterSignal',
    'signal',
    'template',
    'slaConfig',
    'kbArticle',
    'webhook',
    'auditLog',
  ];

  const prisma: any = {};
  for (const model of models) {
    prisma[model] = createModelMock();
  }

  prisma.$transaction = vi.fn((arg: any) =>
    typeof arg === 'function' ? arg(prisma) : Promise.all(arg)
  );
  prisma.$queryRaw = vi.fn();
  prisma.$executeRaw = vi.fn();

  return prisma;
}

export function createMockRedis() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    decr: vi.fn(),
    lpush: vi.fn(),
    rpop: vi.fn(),
    lrange: vi.fn(),
    sadd: vi.fn(),
    smembers: vi.fn(),
    srem: vi.fn(),
    hset: vi.fn(),
    hget: vi.fn(),
    hgetall: vi.fn(),
    hdel: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
    flushdb: vi.fn(),
    ping: vi.fn(),
  };
}

export function createMockContext(overrides?: any) {
  return {
    user: {
      id: 'test-user-id',
      cityId: 'test-city-id',
      email: 'test@example.com',
      name: 'Test User',
      role: Role.AGENT,
      departmentId: null,
      ward: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides?.user,
    },
    cityId: overrides?.cityId || 'test-city-id',
    prisma: createMockPrisma(),
    redis: createMockRedis(),
    req: {
      headers: {},
      ...overrides?.req,
    },
    ...overrides,
  };
}

export function createMockTRPCContext() {
  return createMockContext();
}

export function createMockQueryClient() {
  return {
    fetchQuery: vi.fn(),
    prefetchQuery: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
  };
}

export function createMockTRPCClient() {
  return {
    case: {
      list: {
        query: vi.fn(),
        useQuery: vi.fn(),
      },
      get: {
        query: vi.fn(),
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
      update: {
        useMutation: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
    },
    constituent: {
      list: {
        query: vi.fn(),
        useQuery: vi.fn(),
      },
      get: {
        query: vi.fn(),
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
    },
    template: {
      list: {
        query: vi.fn(),
        useQuery: vi.fn(),
      },
      get: {
        query: vi.fn(),
        useQuery: vi.fn(),
      },
    },
  };
}

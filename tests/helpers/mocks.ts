import { vi } from 'vitest';
import { CaseStatus, CasePriority, CaseSource, Role, TemplateStatus } from '@prisma/client';

export function createMockPrisma() {
  return {
    city: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
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
      aggregate: vi.fn(),
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
      count: vi.fn(),
    },
    caseMessage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    newsletterItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    signal: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    slaConfig: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn()),
  };
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

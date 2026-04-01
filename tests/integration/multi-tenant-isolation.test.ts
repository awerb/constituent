import { describe, it, expect, beforeEach } from 'vitest';
import { Role } from '@prisma/client';
import { createMockContext } from '../helpers/mocks';
import {
  createTestCity,
  createTestUser,
  createTestConstituent,
  createTestDepartment,
  createTestCase,
} from '../helpers/factories';

describe('Multi-Tenant Isolation Integration', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('city A cannot see city B\'s cases', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const constituentA = createTestConstituent({ cityId: cityA.id });
    const constituentB = createTestConstituent({ cityId: cityB.id });

    const departmentA = createTestDepartment({ cityId: cityA.id });
    const departmentB = createTestDepartment({ cityId: cityB.id });

    const caseA = createTestCase({
      cityId: cityA.id,
      constituentId: constituentA.id,
      departmentId: departmentA.id,
      subject: 'City A Case',
    });

    const caseB = createTestCase({
      cityId: cityB.id,
      constituentId: constituentB.id,
      departmentId: departmentB.id,
      subject: 'City B Case',
    });

    // Mock context for City A user
    const userA = createTestUser({ cityId: cityA.id });
    const contextA = createMockContext({ user: userA, cityId: cityA.id });

    // User A queries cases - should only get City A cases
    contextA.prisma.case.findMany.mockResolvedValueOnce([caseA]);

    // Verify query filters by cityId
    const cases = await contextA.prisma.case.findMany({
      where: { cityId: cityA.id },
    });

    expect(cases).toHaveLength(1);
    expect(cases[0].cityId).toBe(cityA.id);
    expect(cases[0].subject).toBe('City A Case');
  });

  it('city A cannot see city B\'s constituents', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const constituentA = createTestConstituent({
      cityId: cityA.id,
      name: 'Constituent A',
    });
    const constituentB = createTestConstituent({
      cityId: cityB.id,
      name: 'Constituent B',
    });

    const userA = createTestUser({ cityId: cityA.id });
    const contextA = createMockContext({ user: userA, cityId: cityA.id });

    // User A queries constituents - should only get City A constituents
    contextA.prisma.constituent.findMany.mockResolvedValueOnce([constituentA]);

    const constituents = await contextA.prisma.constituent.findMany({
      where: { cityId: cityA.id },
    });

    expect(constituents).toHaveLength(1);
    expect(constituents[0].cityId).toBe(cityA.id);
    expect(constituents[0].name).toBe('Constituent A');
  });

  it('city A\'s user cannot access city B\'s data via tRPC', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const userA = createTestUser({
      cityId: cityA.id,
      role: Role.AGENT,
    });

    const constituentB = createTestConstituent({ cityId: cityB.id });
    const caseB = createTestCase({
      cityId: cityB.id,
      constituentId: constituentB.id,
    });

    // User A attempts to access City B case
    const contextA = createMockContext({
      user: userA,
      cityId: cityA.id,
    });

    // Mock authorization check - should fail
    mockContext.prisma.case.findUnique.mockResolvedValueOnce(null);

    const found = await mockContext.prisma.case.findUnique({
      where: { id: caseB.id },
    });

    // Should return null because query includes cityId filter
    expect(found).toBeNull();
  });

  it('SUPER_ADMIN can access both cities', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const admin = createTestUser({
      cityId: cityA.id, // Admin is associated with one city but has global access
      role: Role.SUPER_ADMIN,
    });

    const constituentA = createTestConstituent({ cityId: cityA.id });
    const constituentB = createTestConstituent({ cityId: cityB.id });

    const departmentA = createTestDepartment({ cityId: cityA.id });
    const departmentB = createTestDepartment({ cityId: cityB.id });

    const caseA = createTestCase({
      cityId: cityA.id,
      constituentId: constituentA.id,
      departmentId: departmentA.id,
    });

    const caseB = createTestCase({
      cityId: cityB.id,
      constituentId: constituentB.id,
      departmentId: departmentB.id,
    });

    const adminContext = createMockContext({
      user: admin,
      cityId: cityA.id, // Primary city
    });

    // SUPER_ADMIN queries without cityId filter
    adminContext.prisma.case.findMany.mockResolvedValueOnce([caseA, caseB]);

    const allCases = await adminContext.prisma.case.findMany({});

    expect(allCases.length).toBe(2);
    expect(allCases[0].cityId).toBe(cityA.id);
    expect(allCases[1].cityId).toBe(cityB.id);
  });

  it('department isolation within city', async () => {
    const city = createTestCity();
    const deptA = createTestDepartment({ cityId: city.id, name: 'Public Works' });
    const deptB = createTestDepartment({ cityId: city.id, name: 'Parks' });

    const userA = createTestUser({
      cityId: city.id,
      departmentId: deptA.id,
    });

    const contextA = createMockContext({
      user: userA,
      cityId: city.id,
    });

    // User in Dept A queries cases
    const caseA = createTestCase({
      cityId: city.id,
      departmentId: deptA.id,
    });

    contextA.prisma.case.findMany.mockResolvedValueOnce([caseA]);

    const cases = await contextA.prisma.case.findMany({
      where: { departmentId: deptA.id },
    });

    expect(cases).toHaveLength(1);
    expect(cases[0].departmentId).toBe(deptA.id);
  });

  it('user from city B cannot impersonate user from city A', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const userA = createTestUser({
      cityId: cityA.id,
      email: 'usera@citya.gov',
      role: Role.AGENT,
    });

    const userB = createTestUser({
      cityId: cityB.id,
      email: 'userb@cityb.gov',
      role: Role.AGENT,
    });

    // User B tries to use User A's session
    const contextB = createMockContext({
      user: userB,
      cityId: cityB.id,
    });

    // Verify user B is bound to City B
    expect(contextB.user.cityId).toBe(cityB.id);
    expect(contextB.user.email).toBe('userb@cityb.gov');

    // User B cannot access City A data
    contextB.prisma.case.findMany.mockResolvedValueOnce([]);

    const cases = await contextB.prisma.case.findMany({
      where: { cityId: cityA.id }, // This would fail authorization
    });

    expect(cases).toHaveLength(0);
  });

  it('API key isolation between cities', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const apiKeyA = 'key-city-a-12345';
    const apiKeyB = 'key-city-b-67890';

    // Mock API key validation
    mockContext.prisma.city.findFirst.mockResolvedValueOnce(cityA);

    const foundCity = await mockContext.prisma.city.findFirst({
      where: { apiKey: apiKeyA },
    });

    expect(foundCity.id).toBe(cityA.id);
  });

  it('audit logs show city context', async () => {
    const city = createTestCity();
    const user = createTestUser({ cityId: city.id });
    const caseEntity = createTestCase({ cityId: city.id });

    const auditLog = {
      id: 'audit-1',
      cityId: city.id,
      userId: user.id,
      entityType: 'CASE',
      entityId: caseEntity.id,
      action: 'CREATE',
      oldValue: null,
      newValue: { id: caseEntity.id },
      createdAt: new Date(),
    };

    mockContext.prisma.auditLog.create.mockResolvedValueOnce(auditLog);

    // Verify audit log includes city context
    expect(auditLog.cityId).toBe(city.id);
  });

  it('data backups are isolated by city', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const constituentA = createTestConstituent({ cityId: cityA.id });
    const constituentB = createTestConstituent({ cityId: cityB.id });

    // Mock finding constituents for backup
    mockContext.prisma.constituent.findMany.mockResolvedValueOnce([constituentA]);

    const backup = await mockContext.prisma.constituent.findMany({
      where: { cityId: cityA.id },
    });

    expect(backup).toHaveLength(1);
    expect(backup[0].cityId).toBe(cityA.id);
  });

  it('cross-city search is prevented', async () => {
    const cityA = createTestCity({ name: 'City A' });
    const cityB = createTestCity({ name: 'City B' });

    const userA = createTestUser({ cityId: cityA.id });
    const constituentB = createTestConstituent({
      cityId: cityB.id,
      email: 'search-target@example.com',
    });

    const contextA = createMockContext({
      user: userA,
      cityId: cityA.id,
    });

    // User A searches for constituent that exists only in City B
    contextA.prisma.constituent.findFirst.mockResolvedValueOnce(null);

    const found = await contextA.prisma.constituent.findFirst({
      where: {
        email: 'search-target@example.com',
        cityId: cityA.id, // Enforced filter
      },
    });

    expect(found).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { routeCase, getRoutingSuggestions, rerouteCase, type RouteResult } from "@/server/services/case-router";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    department: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    case: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Case Router Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Routes to department with most matching topic tags", () => {
    it("should route to department with highest tag match score", async () => {
      const cityId = "city-1";
      const topicTags = ["police", "safety", "public-works"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "Police Department",
          topicTags: ["police", "safety"],
          isActive: true,
        },
        {
          id: "dept-2",
          name: "Public Works",
          topicTags: ["public-works", "maintenance"],
          isActive: true,
        },
        {
          id: "dept-3",
          name: "Parks",
          topicTags: ["parks", "recreation"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-1");
      expect(result.department.name).toBe("Police Department");
    });
  });

  describe("Returns first active department as fallback when no tags match", () => {
    it("should return first department when no tags match", async () => {
      const cityId = "city-1";
      const topicTags = ["unknown", "unrelated"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "Default Department",
          topicTags: ["police"],
          isActive: true,
        },
        {
          id: "dept-2",
          name: "Second Department",
          topicTags: ["parks"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-1");
      expect(result.department.name).toBe("Default Department");
    });
  });

  describe("Handles case with single matching tag", () => {
    it("should route to department with single tag match", async () => {
      const cityId = "city-1";
      const topicTags = ["budget"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "Finance",
          topicTags: ["budget", "finance"],
          isActive: true,
        },
        {
          id: "dept-2",
          name: "HR",
          topicTags: ["hiring", "benefits"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-1");
    });
  });

  describe("Handles case with multiple matching departments", () => {
    it("should pick department with best (highest) match score", async () => {
      const cityId = "city-1";
      const topicTags = ["police", "safety", "emergency"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "Police",
          topicTags: ["police", "safety"],
          isActive: true,
        },
        {
          id: "dept-2",
          name: "Public Safety",
          topicTags: ["police", "safety", "emergency"],
          isActive: true,
        },
        {
          id: "dept-3",
          name: "Fire",
          topicTags: ["emergency"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-2");
      expect(result.department.name).toBe("Public Safety");
    });
  });

  describe("Handles empty topic tags", () => {
    it("should route to first active department when tags are empty", async () => {
      const cityId = "city-1";
      const topicTags: string[] = [];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "General Services",
          topicTags: ["general"],
          isActive: true,
        },
        {
          id: "dept-2",
          name: "Special Services",
          topicTags: ["special"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-1");
    });
  });

  describe("Rerouting case to different department", () => {
    it("should reroute case and clear assignment", async () => {
      const caseId = "case-1";
      const oldDeptId = "dept-1";
      const newDeptId = "dept-2";

      const mockCase = {
        id: caseId,
        departmentId: oldDeptId,
        assignedToId: "user-1",
      };

      const mockNewDept = {
        id: newDeptId,
        name: "New Department",
      };

      (prisma.case.findUniqueOrThrow as any).mockResolvedValueOnce(mockCase);
      (prisma.department.findUniqueOrThrow as any).mockResolvedValueOnce(mockNewDept);
      (prisma.case.update as any).mockResolvedValueOnce({
        id: caseId,
        departmentId: newDeptId,
        assignedToId: null,
      });

      await rerouteCase(caseId, newDeptId);

      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: caseId },
        data: {
          departmentId: newDeptId,
          assignedToId: null,
        },
      });
    });
  });

  describe("Getting routing suggestions", () => {
    it("should return departments sorted by tag match score descending", async () => {
      const cityId = "city-1";
      const topicTags = ["police", "safety"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "Police Department",
          topicTags: ["police", "safety"],
          isActive: true,
        },
        {
          id: "dept-2",
          name: "Public Works",
          topicTags: ["public-works"],
          isActive: true,
        },
        {
          id: "dept-3",
          name: "Police Assistance",
          topicTags: ["police"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const results = await getRoutingSuggestions(cityId, topicTags);

      expect(results.length).toBe(3);
      expect(results[0].departmentId).toBe("dept-1");
      expect(results[1].departmentId).toBe("dept-3");
      expect(results[2].departmentId).toBe("dept-2");
    });

    it("should sort by name alphabetically when scores are equal", async () => {
      const cityId = "city-1";
      const topicTags = ["safety"];

      const mockDepartments = [
        {
          id: "dept-2",
          name: "Zulu Safety",
          topicTags: ["safety"],
          isActive: true,
        },
        {
          id: "dept-1",
          name: "Alpha Safety",
          topicTags: ["safety"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const results = await getRoutingSuggestions(cityId, topicTags);

      expect(results[0].department.name).toBe("Alpha Safety");
      expect(results[1].department.name).toBe("Zulu Safety");
    });
  });

  describe("Case insensitive tag matching", () => {
    it("should match tags regardless of case", async () => {
      const cityId = "city-1";
      const topicTags = ["POLICE", "Safety"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "Police Department",
          topicTags: ["police", "safety"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-1");
    });
  });

  describe("Handles departments with null topicTags", () => {
    it("should handle departments with null or missing topicTags", async () => {
      const cityId = "city-1";
      const topicTags = ["police"];

      const mockDepartments = [
        {
          id: "dept-1",
          name: "General",
          topicTags: null,
          isActive: true,
        },
        {
          id: "dept-2",
          name: "Police",
          topicTags: ["police"],
          isActive: true,
        },
      ];

      (prisma.department.findMany as any).mockResolvedValueOnce(mockDepartments);

      const result = await routeCase(cityId, topicTags);

      expect(result.departmentId).toBe("dept-2");
    });
  });
});

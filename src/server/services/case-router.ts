import { prisma } from "@/lib/db";

export interface RouteResult {
  departmentId: string;
  department: any;
}

/**
 * Route a case to the best-matching department based on topic tags
 * Uses tag matching with scoring to find the most relevant department
 */
export async function routeCase(cityId: string, topicTags: string[]): Promise<RouteResult> {
  try {
    console.log(`Routing case with tags: ${topicTags.join(", ")}`);

    // Get all active departments for the city
    const departments = await prisma.department.findMany({
      where: {
        cityId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    if (departments.length === 0) {
      throw new Error(`No active departments found for city ${cityId}`);
    }

    // Score each department based on tag matches
    let bestDepartment = departments[0]; // Default to first department
    let bestScore = 0;

    for (const dept of departments) {
      const deptTags = new Set(
        (dept.topicTags || []).map((tag: string) => tag.toLowerCase())
      );
      const inputTags = new Set(topicTags.map((tag) => tag.toLowerCase()));

      // Calculate intersection
      const matches = Array.from(inputTags).filter((tag) => deptTags.has(tag));
      const score = matches.length;

      console.log(
        `Department ${dept.name} scored ${score} (tags: ${dept.topicTags.join(", ")})`
      );

      if (score > bestScore) {
        bestScore = score;
        bestDepartment = dept;
      }
    }

    // If no matches, use default routing logic
    if (bestScore === 0) {
      console.log(
        `No tag matches found, using first active department: ${bestDepartment.name}`
      );
    } else {
      console.log(`Best match: ${bestDepartment.name} (score: ${bestScore})`);
    }

    return {
      departmentId: bestDepartment.id,
      department: bestDepartment,
    };
  } catch (error) {
    console.error("Error routing case:", error);
    throw error;
  }
}

/**
 * Reroute a case to a different department
 */
export async function rerouteCase(
  caseId: string,
  newDepartmentId: string
): Promise<void> {
  try {
    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
    });

    const newDept = await prisma.department.findUniqueOrThrow({
      where: { id: newDepartmentId },
    });

    console.log(
      `Rerouting case ${caseId} from ${caseRecord.departmentId} to ${newDepartmentId}`
    );

    await prisma.case.update({
      where: { id: caseId },
      data: {
        departmentId: newDepartmentId,
        assignedToId: null, // Clear assignment when rerouting
      },
    });

    console.log(`Case rerouted successfully`);
  } catch (error) {
    console.error("Error rerouting case:", error);
    throw error;
  }
}

/**
 * Get routing suggestions for a case based on current tags
 */
export async function getRoutingSuggestions(
  cityId: string,
  topicTags: string[]
): Promise<RouteResult[]> {
  try {
    const departments = await prisma.department.findMany({
      where: {
        cityId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    // Score all departments
    const scored = departments.map((dept) => {
      const deptTags = new Set(
        (dept.topicTags || []).map((tag: string) => tag.toLowerCase())
      );
      const inputTags = new Set(topicTags.map((tag) => tag.toLowerCase()));

      const matches = Array.from(inputTags).filter((tag) => deptTags.has(tag));
      const score = matches.length;

      return { dept, score };
    });

    // Sort by score (descending) then by name
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.dept.name.localeCompare(b.dept.name);
    });

    return scored.map((item) => ({
      departmentId: item.dept.id,
      department: item.dept,
    }));
  } catch (error) {
    console.error("Error getting routing suggestions:", error);
    throw error;
  }
}

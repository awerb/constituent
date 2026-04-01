/**
 * Simple Mode Configuration
 * Enables simplified interface for small city teams with < 5 departments
 * Hides advanced features, reduces navigation complexity, and streamlines workflows
 */

export interface SimpleModeConfig {
  enabled: boolean;
  maxDepartments: number;
  visibleFeatures: VisibleFeatures;
  caseStatusFlow: string[];
  hideFeatures: string[];
}

export interface VisibleFeatures {
  dashboard: boolean;
  cases: boolean;
  templates: boolean;
  constituents: boolean;
  reports: boolean;
  knowledgeBase: boolean;
  newsletter: boolean;
  settings: boolean;
  users: boolean;
  departments: boolean;
  integrations: boolean;
  multiTenant: boolean;
  collisionDetection: boolean;
  advancedRouting: boolean;
}

const SIMPLE_MODE_DEFAULTS: SimpleModeConfig = {
  enabled: process.env.SIMPLE_MODE === "true",
  maxDepartments: 5,
  visibleFeatures: {
    dashboard: true,
    cases: true,
    templates: true,
    constituents: true,
    reports: false,
    knowledgeBase: false,
    newsletter: false,
    settings: true,
    users: true,
    departments: false,
    integrations: false,
    multiTenant: false,
    collisionDetection: false,
    advancedRouting: false,
  },
  caseStatusFlow: ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  hideFeatures: [
    "kb",
    "reports",
    "newsletter",
    "multiTenant",
    "advancedRouting",
    "collisionDetection",
    "slaConfiguration",
    "roleManagement",
    "departmentRouting",
    "nlpSorting",
  ],
};

/**
 * Check if simple mode is enabled
 * Simple mode is enabled if:
 * - SIMPLE_MODE env var is true, OR
 * - City has fewer than 5 departments
 */
export function isSimpleMode(departmentCount: number = 0): boolean {
  const envEnabled = process.env.SIMPLE_MODE === "true";
  const autoEnabledByDepartmentCount = departmentCount < 5 && departmentCount > 0;
  return envEnabled || autoEnabledByDepartmentCount;
}

/**
 * Get the simple mode configuration
 */
export function getSimpleModeConfig(departmentCount: number = 0): SimpleModeConfig {
  if (!isSimpleMode(departmentCount)) {
    // Return full-featured config
    return {
      ...SIMPLE_MODE_DEFAULTS,
      enabled: false,
      visibleFeatures: {
        ...SIMPLE_MODE_DEFAULTS.visibleFeatures,
        reports: true,
        knowledgeBase: true,
        newsletter: true,
        departments: true,
        integrations: true,
        multiTenant: true,
        collisionDetection: true,
        advancedRouting: true,
      },
      hideFeatures: [],
    };
  }

  return SIMPLE_MODE_DEFAULTS;
}

/**
 * Get visible navigation items based on simple mode
 */
export function getVisibleNavItems(
  departmentCount: number = 0,
  hasNewsletterIntegration: boolean = false
): string[] {
  const config = getSimpleModeConfig(departmentCount);

  const items: string[] = [];

  if (config.visibleFeatures.dashboard) items.push("dashboard");
  if (config.visibleFeatures.cases) items.push("cases");
  if (config.visibleFeatures.constituents) items.push("constituents");
  if (config.visibleFeatures.templates) items.push("templates");
  if (config.visibleFeatures.reports) items.push("reports");
  if (config.visibleFeatures.knowledgeBase) items.push("kb");
  if (config.visibleFeatures.newsletter && hasNewsletterIntegration) items.push("newsletter");
  if (config.visibleFeatures.settings) items.push("settings");
  if (config.visibleFeatures.users) items.push("users");
  if (config.visibleFeatures.departments) items.push("departments");
  if (config.visibleFeatures.integrations) items.push("integrations");

  return items;
}

/**
 * Get simplified case status flow for small mode
 */
export function getSimpleCaseStatusFlow(departmentCount: number = 0): string[] {
  const config = getSimpleModeConfig(departmentCount);
  return config.caseStatusFlow;
}

/**
 * Check if a specific feature should be hidden in simple mode
 */
export function isFeatureHidden(featureName: string, departmentCount: number = 0): boolean {
  const config = getSimpleModeConfig(departmentCount);
  return config.hideFeatures.includes(featureName);
}

/**
 * Get simplified dashboard config (fewer metrics, simpler layout)
 */
export function getSimplifiedDashboardConfig() {
  return {
    showCharts: false,
    showDetailedMetrics: false,
    showCaseList: true,
    showCaseCount: true,
    showRecentActivity: true,
    showAverageResolutionTime: false,
    showSLAMetrics: false,
    showTrendAnalysis: false,
  };
}

/**
 * Get default department for simple mode
 * When in simple mode with no explicit department, use "General"
 */
export function getDefaultSimpleModeSection(): { id: string; name: string } {
  return {
    id: "general",
    name: "General",
  };
}

/**
 * Get AI draft limits for cost control in simple mode
 */
export function getAIDraftLimits(
  departmentCount: number = 0
): { monthlyLimit: number; costPerDraft: number } {
  const config = getSimpleModeConfig(departmentCount);

  if (!config.enabled) {
    // Full system: unlimited unless configured
    const limitStr = process.env.AI_MONTHLY_DRAFT_LIMIT || "0";
    return {
      monthlyLimit: parseInt(limitStr, 10),
      costPerDraft: 0.01,
    };
  }

  // Simple mode: suggest conservative limits
  return {
    monthlyLimit: parseInt(process.env.AI_MONTHLY_DRAFT_LIMIT || "100", 10),
    costPerDraft: 0.01,
  };
}

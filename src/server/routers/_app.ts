import { router } from "@/server/trpc";
import { casesRouter } from "./cases";
import { constituentsRouter } from "./constituents";
import { templatesRouter } from "./templates";
import { kbRouter } from "./kb";
import { dashboardRouter } from "./dashboard";
import { reportsRouter } from "./reports";
import { electedRouter } from "./elected";
import { adminRouter } from "./admin";
import { superAdminRouter } from "./superAdmin";

/**
 * This is the primary router for your tRPC API.
 * Includes all routers for case management, constituent management,
 * templates, knowledge base, dashboard, reports, elected officials,
 * admin functions, and super admin functions.
 */

export const appRouter = router({
  cases: casesRouter,
  constituents: constituentsRouter,
  templates: templatesRouter,
  kb: kbRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  elected: electedRouter,
  admin: adminRouter,
  superAdmin: superAdminRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

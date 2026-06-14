# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT `LICENSE` file.
- This `CHANGELOG.md`.
- `docs/MONITORING.md` (health checks, logging, alerting, troubleshooting).
- GitHub Actions CI workflow (lint, typecheck, build, tests).
- Committed `package-lock.json` for reproducible installs.
- `typecheck` and `test` npm scripts.
- Missing test dependencies: `@vitejs/plugin-react`, `jsdom`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Missing runtime/build dependencies: `next-themes`, `@radix-ui/react-radio-group`, `tailwindcss-animate`.
- `src/components/ui/radio-group.tsx` (was imported but missing) and `src/components/layout/Footer.tsx` (was imported but missing).

### Fixed
- **`npm run build` now succeeds** (was failing at several stages). See below.
- Removed duplicate `@types/node` entry in `devDependencies`.
- Corrected unresolvable dependency versions: `@radix-ui/react-slot` (`^2.0.2` -> `^1.1.0`).
- Aligned `next-auth` to v4 (`^4.24.0`). The entire auth layer uses the v4 API (`NextAuthOptions`, `getServerSession`, `NextAuth(authOptions)` handler); the package had been mis-specified as v5.
- Removed a malformed duplicate route-group directory (literally named `\(admin\)`) that caused a build NormalizeError.
- Renamed route groups to literal path segments to match the app's own redirect targets: `(dashboard)` -> `dashboard`, `(elected)` -> `elected`, `(auth)` -> `auth`. This fixed a "two parallel pages resolve to `/`" build error and aligned broken links (`/dashboard`, `/auth/login`).
- Corrected the `SetupWizard` import path (`@/components/SetupWizard` -> `@/components/admin/SetupWizard`).
- Moved `SessionProvider` from the root Server Component layout into the client providers wrapper (fixed "React Context is unavailable in Server Components" at prerender).
- Marked the app `dynamic = "force-dynamic"` at the root layout (it requires a database and Redis at runtime, so it should not be statically prerendered at build).
- Registered the `@typescript-eslint` plugin in `.eslintrc.json` (a rule referenced it without the plugin loaded).
- Prisma schema: removed orphan `caseMessages` relation on `Constituent` that had no opposite field, which blocked `prisma generate`.
- `vitest.config.ts`: corrected `setupFiles` path (`./src/test/setup.ts` -> `./tests/setup.ts`). The test suite now runs (was unable to start).
- `tsconfig.json`: added `moduleResolution: "bundler"` (was defaulting to `classic`, breaking JSON and path-alias resolution).

### Type baseline (in progress)
- Reduced `npm run typecheck` errors from ~322 to ~110 via structural fixes:
  - Removed a redundant tenant middleware and inlined role guards on
    `protectedProcedure` so the narrowed context (non-null `user`, non-null
    `cityId`) stops being widened back to nullable. This alone cleared the
    `ctx.user is possibly null` errors and the `string | null` cityId errors
    across every router (e.g. `admin.ts` went from 32 errors to 0).
  - Aligned tRPC client calls to real router procedure names
    (`listCases` -> `list`, `getCaseById` -> `getById`, etc.).
  - Added `src/types/next-auth.d.ts` to augment the session/JWT with
    `id`, `role`, `cityId`.
  - Relaxed `noUnusedLocals`/`noUnusedParameters` in `tsconfig.json` (unused
    code is a lint concern; `@typescript-eslint/no-unused-vars` still tracks it).
- Remaining ~110 errors are a heterogeneous long tail (BullMQ event typing in
  `lib/queue.ts`, component prop types, per-router specifics). The production
  build still does not block on type/lint errors (`next.config.mjs`); remove
  those flags once `npm run typecheck` is clean.
- Several frontend pages call tRPC procedures that do not exist on any router
  and need backend work or a product decision: `cases.createFromContact`
  (public submit flow), `cases.createManual`, `reports.generateReport`,
  `elected.getDashboard`, `admin.prepareDataExport`.
- Part of the test suite fails (211 of 780; incomplete Prisma mocks, error-code
  vs message assertions).

## [0.1.0] - 2026-06-14

### Added
- Initial scaffold: Next.js 15 / React 19 app with tRPC, Prisma, NextAuth v4,
  BullMQ workers, OpenAI + Anthropic integration, and i18n.
- Public submission, staff dashboard, admin, elected, and super-admin areas.
- Initial test suite under `tests/`.

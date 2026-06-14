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

### Fixed
- Removed duplicate `@types/node` entry in `devDependencies`.
- Corrected unresolvable dependency versions: `@radix-ui/react-slot` (`^2.0.2` -> `^1.1.0`) and `next-auth` (`^5.0.0` -> `5.0.0-beta.31`).
- Prisma schema: removed orphan `caseMessages` relation on `Constituent` that had no opposite field, which blocked `prisma generate`.
- `vitest.config.ts`: corrected `setupFiles` path (`./src/test/setup.ts` -> `./tests/setup.ts`). The test suite now runs (was unable to start).
- `tsconfig.json`: added `moduleResolution: "bundler"` (was defaulting to `classic`, breaking JSON and path-alias resolution).

### Known issues (tracked, not yet fixed)
- `npm run typecheck` reports type errors in the scaffolded server routers (mostly `string | null` vs `undefined`, possibly-null `ctx.user`).
- Part of the test suite fails (incomplete Prisma mocks, error-code vs message assertions).
- `npm run build` fails on an `(admin)` route-group normalization error.
- CI runs these as non-blocking until resolved.

## [0.1.0] - 2026-06-14

### Added
- Initial scaffold: Next.js 15 / React 19 app with tRPC, Prisma, NextAuth v5,
  BullMQ workers, OpenAI + Anthropic integration, and i18n.
- Public submission, staff dashboard, admin, elected, and super-admin areas.
- Initial test suite under `tests/`.

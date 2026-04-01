# Developer Guide

This guide covers development setup, project structure, code standards, and contribution process.

## Local Development Setup

### Prerequisites

- Node.js 20+ (check with `node --version`)
- PostgreSQL 16+ (local or Docker)
- Redis 7+ (local or Docker)
- Git
- Code editor (VS Code recommended)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/constituent-response.git
cd constituent-response

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local

# Edit .env.local with local values (see CONFIGURATION.md)
nano .env.local

# 4. Start database and Redis
docker-compose -f docker-compose.dev.yml up postgres redis -d

# 5. Initialize database
npm run db:push
npm run db:seed

# 6. Start development server
npm run dev

# 7. Open http://localhost:3000
```

### Docker Development Environment

```bash
# Start everything
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app

# Access database
docker-compose exec postgres psql -U postgres -d constituent_response

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Project Structure

```
constituent-response/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (dashboard)/        # Main dashboard pages
│   │   ├── admin/              # Admin UI pages
│   │   ├── api/                # API routes
│   │   │   ├── v1/            # Public API v1
│   │   │   │   ├── signals/    # Newsletter signals
│   │   │   │   ├── contact/    # Contact form
│   │   │   │   ├── cases/      # Case status
│   │   │   │   ├── privacy/    # GDPR/CCPA
│   │   │   │   └── webhooks/   # Inbound/outbound
│   │   │   └── trpc/           # tRPC endpoint
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── ui/                # Reusable UI (Radix + Tailwind)
│   │   ├── cases/             # Case-specific components
│   │   ├── forms/             # Forms
│   │   └── ...
│   ├── lib/                   # Utilities
│   │   ├── db.ts              # Prisma singleton
│   │   ├── redis.ts           # Redis client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── queue.ts           # BullMQ setup
│   │   ├── rate-limit.ts      # Rate limiting
│   │   └── ...
│   ├── server/                # Backend code
│   │   ├── middleware/        # Auth, tenant isolation
│   │   ├── routers/           # tRPC routers
│   │   ├── services/          # Business logic
│   │   └── context.ts         # tRPC context
│   ├── client/                # Client utilities
│   ├── types/                 # TypeScript types
│   └── utils/                 # Helpers
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── scripts/                   # Utility scripts
│   └── seed.js               # Database seeding
├── docker-compose.dev.yml    # Dev overrides
├── docker-compose.yml        # Production config
├── Dockerfile               # Docker image
├── next.config.mjs          # Next.js config
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind config
├── Makefile                 # Dev shortcuts
└── README.md
```

## Code Standards

### TypeScript

Strict mode enabled (no `any` allowed):

```typescript
// Bad ❌
function processCase(data: any) {
  return data.id;
}

// Good ✓
interface Case {
  id: string;
  status: 'NEW' | 'RESOLVED';
}

function processCase(data: Case): string {
  return data.id;
}
```

### File Organization

```typescript
// 1. Imports (external, internal)
import { prisma } from '@/lib/db';
import { Case } from '@/types';

// 2. Types/Interfaces (alphabetically)
interface Props {
  id: string;
  name: string;
}

// 3. Constants
const DEFAULT_TIMEOUT = 30000;

// 4. Main function/component
export default function MyComponent(props: Props) {
  // Implementation
}

// 5. Helper functions
function helperFunction() {
  // Implementation
}
```

### Naming Conventions

```
Functions: camelCase
  ✓ processSignal, getUserById

Variables: camelCase
  ✓ constituentsCount, responseDraft

Constants: UPPER_SNAKE_CASE
  ✓ DEFAULT_SLA_HOURS, MAX_RETRIES

Components: PascalCase
  ✓ CaseDetail, RespondToCase

Types/Interfaces: PascalCase
  ✓ Case, SignalPayload

Database tables: PascalCase (Prisma convention)
  ✓ City, Case, Constituent
```

### Formatting

Uses Prettier (auto-format on save):

```bash
# Format all files
npm run format

# Or for a file
npx prettier --write src/app/page.tsx
```

Config: `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

### Linting

ESLint with Next.js + TypeScript config:

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

Config: `.eslintrc.json`

## Testing

### Unit Tests

Using Vitest:

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

Example test:

```typescript
// lib/sla.test.ts
import { calculateSlaDeadline } from './sla';
import { describe, it, expect } from 'vitest';

describe('calculateSlaDeadline', () => {
  it('should add hours to current date', () => {
    const deadline = calculateSlaDeadline(48);
    expect(deadline.getTime()).toBeGreaterThan(Date.now());
  });

  it('should handle edge cases', () => {
    const deadline = calculateSlaDeadline(0);
    expect(deadline.getTime()).toBeCloseTo(Date.now(), -3);
  });
});
```

## Git Workflow

### Branch Naming

```
feature/short-description      # New feature
fix/issue-number               # Bug fix
refactor/what-changed          # Code cleanup
docs/what-was-added            # Documentation

Examples:
  feature/newsletter-integration
  fix/rate-limit-bypass-issue
  refactor/api-response-handling
```

### Commits

```bash
# Good commit message
git commit -m "Add newsletter signal processing

- Parse webhook payload from Transparent City
- Validate HMAC signature
- Queue signal for background processing
- Send acknowledgment email to constituent"

# Bad commit message
git commit -m "updates"
```

Structure:
```
<type>(<scope>): <subject>

<body>

<footer>

Type: feat, fix, refactor, docs, test, chore
Scope: area of code (api, ui, db, etc.)
Subject: imperative, present tense
Body: explain what and why (not how)
Footer: references (Closes #123)
```

### Pull Requests

1. **Create branch**: `git checkout -b feature/description`
2. **Make changes** and commit
3. **Push**: `git push origin feature/description`
4. **Create PR** on GitHub

PR Template:

```markdown
## Description
What does this change do?

## Changes
- List specific changes
- Each bullet is a change

## Testing
- How was this tested?
- What edge cases were considered?

## Screenshots (if UI change)
[Attach before/after]

## Checklist
- [ ] Tests pass (npm test)
- [ ] Linter passes (npm run lint)
- [ ] Database migrations added (if needed)
- [ ] Documentation updated
- [ ] No hardcoded secrets
```

### Code Review

Before merging, ensure:
- [ ] Tests pass
- [ ] Linter passes
- [ ] At least 1 approval from team
- [ ] No merge conflicts

## Architecture Decisions

Document significant decisions in `ADR/` (Architecture Decision Records):

```markdown
# ADR 001: Use Prisma instead of Raw SQL

## Status
Accepted

## Context
We need an ORM for database access.

## Decision
Use Prisma

## Rationale
- Type-safe queries
- Auto-generated migrations
- Visual schema editor (Prisma Studio)
- Good TypeScript support

## Consequences
- Vendor lock-in to Prisma (could migrate if needed)
- Slight performance overhead (minimal)
- Better developer experience
```

Store in `docs/adr/001-use-prisma.md`

## Common Tasks

### Add New API Endpoint

1. Create route file:
```typescript
// src/app/api/v1/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validate
  // Process
  return NextResponse.json({ result: '...' }, { status: 200 });
}
```

2. Add validation:
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  // ... more fields
});

const payload = schema.parse(body);
```

3. Add tests
4. Document in API.md

### Add New tRPC Endpoint

1. Create router:
```typescript
// src/server/routers/my-router.ts
import { publicProcedure, router } from '@/server/trpc';

export const myRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.myTable.findMany();
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.myTable.create({
        data: input,
      });
    }),
});
```

2. Add to main router:
```typescript
// src/server/routers/_app.ts
import { myRouter } from './my-router';

export const appRouter = router({
  // ...
  my: myRouter,
});
```

3. Use in component:
```typescript
// Client component
const { data } = trpc.my.list.useQuery();
const createMutation = trpc.my.create.useMutation();
```

### Add Database Migration

```bash
# Make schema change in prisma/schema.prisma

# Generate migration
npm run db:migrate

# Migration created, review it:
cat prisma/migrations/[timestamp]_[name]/migration.sql

# Apply to database
npm run db:push

# Or just push without migration file:
npm run db:push
```

### Add Component

```typescript
// src/components/cases/CaseDetail.tsx
'use client'; // If using hooks

import { ReactNode } from 'react';

interface Props {
  caseId: string;
  children?: ReactNode;
}

export function CaseDetail({ caseId, children }: Props) {
  return (
    <div>
      {/* Implementation */}
      {children}
    </div>
  );
}
```

## Debugging

### Browser DevTools

```
F12 → Open DevTools
Console: See logs, errors
Network: See API calls
Performance: Measure load time
```

### Server Logs

```bash
# View app logs
npm run dev
# Logs appear in terminal

# Or in Docker
docker-compose logs -f app

# Filter by keyword
docker-compose logs app | grep error
```

### Database Inspection

```bash
# Use Prisma Studio
npm run db:studio
# Opens http://localhost:5555

# Or connect with psql
docker-compose exec postgres psql \
  -U postgres \
  -d constituent_response
```

### Redis Inspection

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# View all keys
KEYS *

# Check queue status
LLEN bull:cases:jobs
```

## Performance Optimization

### Code Splitting

Next.js auto-splits code, but optimize:

```typescript
// Bad: Heavy import at module level
import HeavyComponent from './heavy'; // Imported even if not used

// Good: Dynamic import (code-split)
const HeavyComponent = dynamic(() => import('./heavy'));
```

### Database Queries

```typescript
// Bad: N+1 queries
const cases = await prisma.case.findMany();
for (const c of cases) {
  const responses = await prisma.response.findMany({
    where: { caseId: c.id }
  });
}

// Good: Use relations
const cases = await prisma.case.findMany({
  include: { responses: true }
});
```

### Caching

```typescript
// Cache in Redis
const cached = await redis.get(`case:${id}`);
if (cached) return JSON.parse(cached);

const data = await prisma.case.findUnique({ where: { id } });
await redis.setex(`case:${id}`, 3600, JSON.stringify(data));
return data;
```

## Release Process

1. **Bump version** in `package.json`
2. **Update CHANGELOG.md**
3. **Create commit**: `git commit -m "Release v1.2.0"`
4. **Tag**: `git tag v1.2.0`
5. **Push**: `git push origin main --tags`
6. **Build**: `npm run build`
7. **Deploy**: Follow DEPLOYMENT.md

## Getting Help

- **Questions**: Ask in Slack or GitHub discussions
- **Bug report**: Create GitHub issue with reproduction steps
- **Security issue**: Email security@city.gov
- **Documentation**: Update docs or ask for clarification

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [tRPC Docs](https://trpc.io)
- [Tailwind CSS](https://tailwindcss.com)

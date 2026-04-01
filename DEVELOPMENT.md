# Development Guide

This document provides guidance for developers working on the Constituent Response project.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your local settings
nano .env.local
```

### 3. Database Setup

```bash
# Push Prisma schema to database
npm run db:push

# Optionally seed with sample data
npm run db:seed

# Or open Prisma Studio
npm run db:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

## Code Organization

### Directory Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/server/` - Server-side code (tRPC routers, middleware, utilities)
- `src/client/` - Client-side code
- `src/lib/` - Shared utilities and helpers
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations

### Naming Conventions

- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Files**: kebab-case (e.g., `user-card.tsx`)
- **Functions**: camelCase (e.g., `getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types**: PascalCase (e.g., `UserData`)

## TypeScript

Project uses strict TypeScript mode. Always:

- Type all function parameters and return values
- Avoid `any` type - use `unknown` if necessary
- Use proper typing for React components
- Ensure no unused variables or imports

## Component Development

### Functional Components

All components should be functional components with hooks:

```typescript
import { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

const MyComponent: FC<Props> = ({ children, variant = 'primary' }) => {
  return <div>{children}</div>;
};

export default MyComponent;
```

### Using Shadcn/UI

Install components with shadcn CLI:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

Then import and use:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

## tRPC API Routes

### Creating Procedures

Procedures are defined in `src/server/api/routers/`.

```typescript
import { procedure, router } from '@/server/api/trpc';
import { z } from 'zod';

export const exampleRouter = router({
  hello: procedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: procedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Create item in database
      return await ctx.db.item.create({
        data: { name: input.name },
      });
    }),
});
```

### Using in Components

```typescript
'use client';

import { api } from '@/trpc/react';

export function MyComponent() {
  const hello = api.example.hello.useQuery({ text: 'World' });
  const createItem = api.example.create.useMutation();

  return (
    <div>
      {hello.data?.greeting}
      <button onClick={() => createItem.mutate({ name: 'New Item' })}>
        Create
      </button>
    </div>
  );
}
```

## Database Management

### Adding a Model

1. Update `prisma/schema.prisma`:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

2. Push to database:

```bash
npm run db:push
```

Or create a migration:

```bash
npm run db:migrate
```

### Accessing Database

Use Prisma Client in server code:

```typescript
import { db } from '@/server/db';

const users = await db.user.findMany();
```

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

Use Vitest + React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Docker Development

### Using Docker Compose for Development

```bash
# Start containers with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

The development override:
- Mounts `src/` for hot reload
- Runs `npm run dev` instead of production build
- Sets `LOG_LEVEL=debug`
- Disables separate worker service (runs inline)

### Accessing Services

- App: http://localhost:3000
- Database: localhost:5432
- Redis: localhost:6379

## Git Workflow

### Branches

- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Before Committing

1. Run linter: `npm run lint`
2. Run tests: `npm test`
3. Format code: `npm run format`

## Performance

### Code Splitting

Use dynamic imports for large components:

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### Database Queries

- Use select to fetch only needed fields
- Use include/where for relations
- Consider pagination for large datasets

```typescript
await db.user.findMany({
  select: { id: true, email: true },
  where: { active: true },
  take: 10,
  skip: 0,
});
```

## Debugging

### Next.js Debug Mode

```bash
NODE_OPTIONS='--inspect' npm run dev
```

Then open chrome://inspect in Chrome DevTools.

### Console Logging

Use the logger utility:

```typescript
import { logger } from '@/server/logger';

logger.info('User created', { userId: user.id });
logger.error('Database error', { error });
```

### Prisma Debug

```bash
DEBUG=* npm run dev
```

## Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables set
- [ ] Database migrated: `npm run db:push`
- [ ] Prisma client generated: `npx prisma generate`

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Try connecting with psql directly

### Node Modules Issues

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Next.js Cache Issues

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

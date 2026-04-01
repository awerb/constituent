# Core Infrastructure Documentation

This document describes the production-ready core infrastructure files for the Constituent-Response project.

## File Structure

### Server Middleware (`src/server/middleware/`)

#### `tenant.ts` - Multi-Tenant Data Isolation
- **Purpose**: Automatic tenant (city) isolation at the database layer
- **Key Functions**:
  - `getTenantContext()`: Retrieve current tenant from async context
  - `setTenantContext(cityId, callback)`: Execute code within a tenant context
  - `applytTenantMiddleware(prisma, userRole, userCityId)`: Apply Prisma middleware for automatic cityId injection
  - `getCurrentCityId(userCityId)`: Get the active cityId with fallback chain
  - `initializeSingleTenantMode(prisma)`: Detect and cache single-tenant deployments

**Features**:
- AsyncLocalStorage-based context (thread-safe)
- Automatic cityId injection on all tenant models
- SUPER_ADMIN bypass for cross-tenant operations
- Single-tenant optimization with caching
- Covers: City, Constituent, Department, User, Case, NewsletterItem, NewsletterSignal, Template, SlaConfig, KbArticle, Webhook, AuditLog

#### `auth.ts` - Role-Based Authorization
- **Role Hierarchy**: SUPER_ADMIN > ADMIN > MANAGER > AGENT > ELECTED_OFFICIAL
- **Key Functions**:
  - `hasMinimumRole(userRole, requiredRole)`: Check if user meets role requirement
  - `checkRole(userRole, requiredRole)`: Throw AuthorizationError if insufficient role
  - `createRoleGuard(requiredRole)`: Create a guard function for a role

**Special Case**: ELECTED_OFFICIAL is a terminal role (doesn't follow hierarchy)

### Server Core (`src/server/`)

#### `context.ts` - tRPC Context Creation
Creates the context object passed to all tRPC procedures.

**Context Object**:
```typescript
{
  user: { id, email, name, role, cityId } | null
  cityId: string | null
  prisma: PrismaClient
  redis: Redis
  req?: Request
}
```

**Responsibilities**:
- Fetch user session from NextAuth
- Resolve cityId from user record or database default
- Cache single-tenant cityId
- Initialize single-tenant mode

#### `trpc.ts` - tRPC Server Setup
Initializes tRPC with all procedure types.

**Procedures Available**:
- `publicProcedure`: No authentication required
- `protectedProcedure`: User must be authenticated
- `adminProcedure`: Requires ADMIN or higher role
- `managerProcedure`: Requires MANAGER or higher role
- `agentProcedure`: Requires AGENT or higher role
- `electedProcedure`: Only ELECTED_OFFICIAL role
- `superAdminProcedure`: Only SUPER_ADMIN role

All use superjson transformer for complex type serialization.

#### `routers/_app.ts` - Main Router
Entry point for all tRPC procedures. Add routers here:
```typescript
export const appRouter = router({
  cases: casesRouter(),
  constituents: constituentsRouter(),
  signals: signalsRouter(),
  // ... more routers
});
```

### Database Layer (`src/lib/`)

#### `db.ts` - Prisma Client
- Singleton pattern (global instance in development)
- Tenant middleware applied automatically
- Logging configured by NODE_ENV

#### `redis.ts` - Redis Client
- Singleton Redis connection
- Configurable via REDIS_URL env
- Automatic reconnection handling
- Error logging

#### `auth.ts` - NextAuth Configuration
**Providers**:
- CredentialsProvider: Email/password authentication
- EmailProvider: Magic link authentication (optional, requires EMAIL_FROM env)

**Features**:
- PrismaAdapter for session/account storage
- JWT strategy with 30-day expiry
- Callbacks that include user role and cityId in session
- Password hashing with bcryptjs
- Audit logging on sign-in
- Sign-in validation against database

**Environment Variables**:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
EMAIL_FROM=noreply@example.com
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=password
```

### Queue Layer (`src/lib/queue.ts`)
BullMQ-based job queue system with 6 queue types:
- `emailQueue`: Send emails and notifications
- `signalQueue`: Process newsletter signals
- `slaCheckQueue`: Monitor SLA deadlines
- `webhookQueue`: Send webhook events
- `privacyQueue`: Handle privacy requests (export/delete)
- `reportQueue`: Generate reports

**Functions**:
- `createWorker(queueName, handler, options)`: Create a worker for a queue
- `closeAllQueues()`: Gracefully close all queues
- `checkQueueHealth()`: Get health status of all queues

**Configuration**:
```
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=5
```

### AI Integration (`src/lib/ai.ts`)
Abstract AI client with multiple implementations.

**AIClient Interface**:
```typescript
interface AIClient {
  draft(prompt, context?): Promise<string>
  detectLanguage(text): Promise<string>
  isAvailable(): Promise<boolean>
}
```

**Implementations**:
- OpenAIClient: Uses gpt-4-turbo (configurable)
- AnthropicClient: Uses claude-3-sonnet (configurable)

**Factory Function**:
```typescript
const client = getAIClient(); // Selects based on AI_PROVIDER env
```

**Configuration**:
```
AI_PROVIDER=openai|anthropic
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### Business Logic Layer

#### `sla.ts` - SLA Management
Calculates SLA deadlines respecting business hours.

**Functions**:
- `calculateSlaDeadline(startTime, hours, config)`: Calculate deadline
- `isWithinBusinessHours(time, config)`: Check if time is during business hours
- `getTimeRemainingInBusinessHours(deadline, config)`: Calculate remaining time

**Features**:
- Business hour configuration (start, end times)
- Weekend/holiday handling
- Timezone support (date-fns-tz)
- Example: 4pm Friday + 4 hour SLA = 10am Monday

**Config Interface**:
```typescript
interface SLAConfig {
  businessHoursStart: string    // "08:00"
  businessHoursEnd: string      // "17:00"
  businessDays: string[]        // ["MON", "TUE", "WED", "THU", "FRI"]
  timezone: string              // "America/New_York"
}
```

#### `ref-number.ts` - Reference Number Generation
Generates case reference numbers in format: `CR-{YEAR}-{SEQUENCE}`

**Functions**:
- `generateReferenceNumber(cityId, prisma)`: Generate next number
- `validateReferenceNumber(refNumber)`: Check format validity
- `parseReferenceNumber(refNumber)`: Extract year and sequence

**Features**:
- Thread-safe via database transaction
- City and year scoped
- 5-digit zero-padded sequence

#### `language.ts` - Language Support
Detects language and manages supported languages.

**Functions**:
- `detectLanguage(text)`: AI-powered detection
- `getSupportedLanguages()`: Array of language codes
- `getSupportedLanguagesWithNames()`: Array with display names
- `getLanguageName(code)`: Get display name
- `isSupportedLanguage(code)`: Type-safe validator
- `normalizeLanguagePreference(preference)`: Parse user input

**Supported Languages**: en, es, fr, zh, vi, ar, ko, tl, de, ja, pt, it, ru, pl, tr

#### `notifications.ts` - Notification System
Multi-channel notification dispatch system.

**Notification Events** (12 types):
- case.created, case.assigned, case.status_changed, case.resolved, case.closed
- message.added
- sla.warning, sla.breached
- constituent.replied
- template.approved
- signal.flagged
- user.invited

**Channels**: email, in_app, sms, push

**Functions**:
- `sendNotification(userId, event, data, metadata)`: Dispatch notification
- `getNotificationTemplate(event)`: Get pre-built template

**Features**:
- User preference respecting
- Event-specific preferences
- Channel-specific dispatch
- Template system with subjects

### Type Definitions (`src/types/`)

#### `index.ts` - Core Types
Extended Prisma types and common app types:
- `User`, `CaseWithRelations`, `ConstituentWithCases`, `CaseMessage`
- `DashboardStats`, `PaginationParams`, `PaginatedResponse`
- `CaseFilterOptions`, `SortOptions`
- `APIResponse<T>`, `ErrorDetails`
- Re-exports all Prisma enum types

#### `case.ts` - Case Types (17 types)
- `CaseDetail`: Full case with all relations
- `CaseListItem`: Minimal data for lists
- `CaseMessageDetail`: Message with author info
- `CreateCaseInput`, `UpdateCaseInput`, `UpdateCaseStatusInput`
- `AddMessageInput`
- `CaseSearchFilters`, `CaseMetrics`, `CaseStats`
- `BulkUpdateCasesInput`
- `CaseAuditInfo`, `CaseHistoryEntry`

#### `constituent.ts` - Constituent Types (12 types)
- `ConstituentDetail`, `ConstituentListItem`
- `CreateConstituentInput`, `UpdateConstituentInput`
- `ConstituentSearchFilters`, `ConstituentWithCaseHistory`
- `PrivacyRequest`, `ExportDataRequest`
- `ConstituentStats`, `ContactPreferences`, `ConstituentProfile`
- `BulkUpdateConstituentsInput`

#### `signal.ts` - Signal Types (12 types)
- `NewsletterSignalDetail`, `SignalSummary`
- `CreateSignalInput`, `UpdateSignalInput`
- `SignalWithCaseConversion`
- `SignalAnalytics`, `NewsletterItemWithSignals`
- `SignalAggregation`, `SignalSearchFilters`
- `BulkCreateSignalsInput`, `BulkConvertSignalsInput`
- `SignalNotification`

### Client Layer (`src/lib/trpc.ts`)
Exported React hooks for using tRPC in components:
```typescript
export const trpc = createTRPCReact<AppRouter>();
```

### API Routes (`src/app/api/trpc/[trpc]/route.ts`)
Next.js App Router handler for tRPC endpoints.
- GET and POST support
- Fetch adapter integration
- Error logging

## Usage Examples

### In a tRPC Procedure
```typescript
export const casesRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // ctx.user is authenticated
      // ctx.cityId is automatically set
      // ctx.prisma queries are tenant-isolated
      return ctx.prisma.case.findMany({
        where: { status: input.status },
      });
    }),
});
```

### In a Server Function
```typescript
import { setTenantContext } from '@/server/middleware/tenant';
import { prisma } from '@/lib/db';

setTenantContext(cityId, async () => {
  // All prisma queries within this block are scoped to cityId
  const cases = await prisma.case.findMany();
});
```

### In a React Component
```typescript
import { trpc } from '@/lib/trpc';

export function CaseList() {
  const { data, isLoading } = trpc.cases.list.useQuery({});
  // ...
}
```

### Queue Processing
```typescript
import { emailQueue, createWorker } from '@/lib/queue';

const worker = createWorker('email', async (job) => {
  console.log(`Processing email: ${job.id}`);
  // Send email logic here
});

// In your code:
await emailQueue.add('send', { to: 'user@example.com' });
```

### AI Operations
```typescript
import { getAIClient } from '@/lib/ai';

const aiClient = getAIClient();
const draft = await aiClient.draft('Write a response to...', {
  systemPrompt: 'You are a helpful...'
});
const language = await aiClient.detectLanguage(text);
```

### SLA Calculations
```typescript
import { calculateSlaDeadline, isWithinBusinessHours } from '@/lib/sla';

const deadline = calculateSlaDeadline(now, 48, {
  businessHoursStart: '08:00',
  businessHoursEnd: '17:00',
  businessDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  timezone: 'America/New_York',
});
```

### Reference Numbers
```typescript
import { generateReferenceNumber } from '@/lib/ref-number';

const refNum = await generateReferenceNumber(cityId, prisma);
// Returns: "CR-2024-00001"
```

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Run `npm install && npm run db:migrate`
- [ ] Seed database with initial city/user data
- [ ] Test authentication flow
- [ ] Configure Redis connection
- [ ] Start queue worker: `npm run worker`
- [ ] Verify AI provider credentials
- [ ] Test email notifications
- [ ] Run build: `npm run build`
- [ ] Start server: `npm run start`

## Troubleshooting

### Tenant Context Issues
- Ensure `createTRPCContext` is called before procedures
- Check that user.cityId is set in NextAuth session
- For single-tenant mode, verify only one City record exists

### SLA Calculation Off
- Verify timezone string is valid IANA format
- Check businessDays array uses "MON", "TUE", etc.
- Ensure times are in "HH:mm" format

### Queue Jobs Not Processing
- Verify Redis connection with `redis-cli ping`
- Check `WORKER_CONCURRENCY` setting
- Review queue event logs for errors
- Ensure worker process is running (`npm run worker`)

### Authentication Issues
- Verify NEXTAUTH_SECRET is set and consistent
- Check NextAuth callbacks are returning correct role/cityId
- Review browser cookies for NextAuth tokens

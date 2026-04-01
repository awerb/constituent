# Architecture Guide

## System Overview

Constituent Response is built as a modern web application with these core components:

- **Frontend**: Next.js 15 with React 19 (Server + Client components)
- **Backend API**: tRPC for internal APIs + REST for public APIs
- **Database**: PostgreSQL with Prisma ORM
- **Real-time/Caching**: Redis + BullMQ for background jobs
- **Authentication**: NextAuth.js with session persistence
- **AI Integration**: OpenAI or Anthropic for response drafting

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Web Client                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    ┌───▼─────┐              ┌───────▼────┐
    │ tRPC    │              │ REST API   │
    │ (Auth)  │              │ (Public)   │
    └───┬─────┘              └───────┬────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │     Next.js Application      │
        │  (App Router + API Routes)   │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴────────────┬─────────────┐
        │                           │             │
    ┌───▼────────┐        ┌────────▼──┐    ┌────▼────┐
    │ Prisma     │        │   Redis   │    │   AI    │
    │ Database   │        │   Queue   │    │  APIs   │
    │            │        │(BullMQ)   │    │         │
    └─────────────┘        └───────┬──┘    └─────────┘
                                   │
                         ┌─────────▼──────┐
                         │  Background    │
                         │  Job Worker    │
                         └────────────────┘
```

## Technology Choices

### Next.js 15 + App Router

**Why**: Modern React framework with:
- File-based routing (no config)
- Server/Client components for optimal performance
- Built-in API routes
- Streaming and partial pre-rendering
- Zero-config deployment

### TypeScript (Strict Mode)

**Why**: Type safety catches errors at compile time:
- Fewer runtime bugs
- Better IDE autocomplete
- Self-documenting code
- Refactoring confidence

### Prisma ORM

**Why**:
- Database-agnostic migrations
- Type-safe queries with auto-complete
- Visual Prisma Studio for data inspection
- Automatic schema generation

### tRPC

**Why**:
- End-to-end type safety (frontend knows exact API shape)
- No OpenAPI needed - types auto-generated from backend
- React Query integration for caching and refetching
- Automatic error handling

### PostgreSQL

**Why**:
- ACID guarantees for data consistency
- Excellent for complex queries (case status, reporting)
- Advanced features: JSONB, full-text search, roles/permissions
- Mature ecosystem and operational knowledge

### BullMQ + Redis

**Why**:
- Reliable background job processing
- Retry logic with exponential backoff
- Job persistence across restarts
- Pub/Sub for real-time updates
- Easy monitoring and debugging

## Multi-Tenant Architecture

Data isolation happens at three levels:

### 1. Database Level (Prisma Middleware)

All queries automatically add `cityId` filter:

```typescript
// In src/server/middleware/tenant.ts
const applyTenantMiddleware = (prisma, userId, cityId) => {
  prisma.$use(async (params, next) => {
    // For models with cityId field, auto-add it to WHERE clause
    if (params.model in TENANT_MODELS && params.action === 'findUnique') {
      params.where = { ...params.where, cityId }
    }
    return next(params)
  })
}
```

### 2. Application Level (tRPC Context)

Every tRPC procedure receives context with user's cityId:

```typescript
// In src/server/context.ts
export const createTRPCContext = async (opts: { req: Request }) => {
  const session = await getSession(opts.req)
  const cityId = session?.user?.cityId || DEFAULT_CITY_ID

  return {
    user: session?.user || null,
    cityId,
    prisma,
    redis
  }
}
```

### 3. API Level

Public APIs must specify city in request:

```bash
# Signal endpoint requires citySlug
POST /api/v1/signals
X-TC-Api-Key: city-api-key
{
  "citySlug": "sf",  # Must match city in database
  ...
}
```

## Data Flow: Newsletter Signal to Case

Here's how a constituent's newsletter signal becomes a support case:

```
1. Transparent City Newsletter
   └─> Constituent clicks "Flag this item"

2. Townhall API sends webhook
   └─> POST /api/v1/webhooks/newsletter
       {
         "signalType": "FLAG",
         "constituentEmail": "alice@example.com",
         "newsletterExternalId": "bill-123",
         "topicTags": ["pothole", "public-works"],
         ...
       }

3. API validates HMAC signature and API key
   └─> Rejects if signature invalid or API key wrong

4. Signal queued in Redis
   └─> BullMQ job: "process-signal-flag"

5. Background Worker processes signal
   └─> Check: Does constituent exist?
       ├─> No: Create constituent record
       └─> Yes: Update last_contacted_at

       ├─> Check: Has duplicate signal in last 24 hours?
       ├─> No: Create Case record
       │   ├─ Set status = "NEW"
       │   ├─ Calculate SLA deadline
       │   ├─ Assign to department
       │   └─ Send acknowledgment email
       │
       └─> Yes: Update existing case

6. Admin Dashboard shows new case
   └─> Staff assign to themselves
   └─> Staff click "Generate AI Draft"
   └─> Use Claude/GPT to write response
   └─> Staff edits and sends response
   └─> Case marked "RESOLVED"

7. Constituent receives email with response
   └─> Can click link to view case status
   └─> Status endpoint: GET /api/v1/cases/CR-2024-00123/status

8. Elected Official Dashboard
   └─> Can see: "3 public works flags this week"
   └─> Can see: "Avg response time: 18 hours"
   └─> Cannot see: Names, emails, case details
```

## Background Job Processing

Jobs flow through Redis and BullMQ:

### Job Types

| Job | Trigger | Processing |
|-----|---------|-----------|
| `process-signal-flag` | Webhook from newsletter | Create/update case |
| `process-signal-applaud` | Webhook from newsletter | Create positive feedback record |
| `send-acknowledgment` | New case created | Email constituent with reference # |
| `send-response` | Staff sends response | Email constituent and archive in audit log |
| `generate-ai-draft` | Staff requests draft | Call OpenAI/Claude, return suggestions |
| `export-cases` | Admin exports data | Generate CSV/ZIP, store URL |
| `sync-with-311` | Outbound webhook | Send case update to 311 system |

### Job Retry Logic

```typescript
// Jobs retry with exponential backoff
const job = await queue.add('send-email', data, {
  attempts: 3,        // Try up to 3 times
  backoff: {
    type: 'exponential',
    delay: 2000       // Start at 2 seconds
  },
  removeOnComplete: true  // Clean up when successful
})

// Retry schedule: 2s, 4s, 8s (exponential)
```

### Processing Order

Jobs are processed in FIFO order by the worker:

```bash
# Start worker separately
npm run worker
# or in Docker:
docker-compose up worker

# All BullMQ jobs processed here
# Check Redis for queue status:
docker-compose exec redis redis-cli KEYS "bull:*"
```

## AI Integration Architecture

### Prompt Pipeline

```
1. Constituent's message
   └─> Clean/sanitize (DOMPurify)

2. Look up any relevant templates
   └─> "Response to pothole complaint"
   └─> Extract style guide and tone

3. Build prompt for AI
   └─> "You are a city staff member responding to..."
   └─> Include department context
   └─> Include constituent language preference
   └─> Include tone setting (formal/friendly/etc)

4. Call AI API
   ├─> OpenAI: gpt-4-turbo
   └─> Anthropic: claude-3-sonnet

5. Validate response
   └─> Check length (50-500 words)
   └─> Check for profanity
   └─> Check that it actually addresses the issue

6. Return suggestions to staff
   └─> Show 3 alternatives
   └─> Highlight key phrases
   └─> Staff edits and sends or regenerates
```

### Cost Optimization

```
Without AI caching:
- 100 cases/day × $0.01-0.05 per draft = $1-5/day = $30-150/month

With response templates (recommended):
- 30% of cases use template → $20-105/month
- Staff still gets AI for complex cases

Cost control:
- Disable AI for simple issues (already resolved)
- Use cheaper model (gpt-3.5-turbo) for routine items
- Cache templates for common issues
```

## Authentication Flow

### Session Management

```
1. User logs in at /login
   └─> Credentials checked against database
   └─> NextAuth creates session

2. Session stored in database (Prisma adapter)
   └─> Encrypted with NEXTAUTH_SECRET
   └─> Stored in sessions table

3. Browser cookie set with session ID
   └─> HttpOnly, Secure, SameSite=Lax

4. On page load
   └─> getSession() retrieves session from database
   └─> If session expired, user redirected to login

5. For API calls
   └─> tRPC middleware checks session
   └─> Attaches user info to context
```

### Role Hierarchy

```
SUPER_ADMIN
    ↓
ADMIN (manage city config, users, departments)
    ↓
MANAGER (manage cases, staff, templates)
    ↓
AGENT (respond to cases, create responses)
    ↓
(No role / public user)

ELECTED_OFFICIAL (sibling, not below AGENT)
    └─> View aggregated district data only
    └─> Cannot manage anything
```

## API Authentication Methods

### tRPC (Internal)

Uses NextAuth session:
```typescript
protected.query(async ({ ctx }) => {
  if (!ctx.user) throw new Error('Not authenticated')
  // User is authenticated
})
```

### REST API (Public)

Uses API keys and HMAC signatures:

```bash
curl -X POST /api/v1/signals \
  -H "X-TC-Api-Key: abc123" \
  -H "X-TC-Signature: sha256=..." \
  -d '{"citySlug": "sf", ...}'
```

Signature verification:
```typescript
const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(requestBody)
  .digest('hex')

// Compare with X-TC-Signature header
```

## Scaling Considerations

### Single City (Single-Tenant)

- Simple deployment
- PostgreSQL: 1 instance
- Redis: 1 instance
- Suitable for: 10K-100K cases/year

### Multiple Cities (Multi-Tenant)

- Shared database with city isolation
- Connection pooling (PgBouncer) after 10 cities
- Redis: Shared cache + separate queue
- Suitable for: 100K-1M cases/year

### High Volume (100K+ cases/month)

- Database read replicas
- Redis clustering
- Separate queue instances
- CDN for static assets
- Separate API server

## Security Architecture

### Data Protection

- **Passwords**: bcryptjs (cost 10)
- **Sessions**: HMAC-SHA256 (NextAuth)
- **API signatures**: HMAC-SHA256 with timing-safe compare
- **Audit logs**: Immutable, all mutations logged
- **HTTPS**: Enforced in production

### Access Control

- **Row-level**: cityId filtering via Prisma middleware
- **Endpoint-level**: tRPC procedure types (protected, admin, etc.)
- **UI-level**: Role-based component hiding
- **API-level**: API key + signature verification

### Compliance

- **FOIA**: Internal notes excluded from exports
- **Audit trail**: All changes logged with user + timestamp
- **Data retention**: Configurable per city
- **Privacy**: No PII in logs, email addresses hashed in analytics

## Error Handling

### User-Facing Errors

```typescript
// Don't expose internal details
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'You do not have access to this case'
})

// Good ✓
// Bad ✗ database error: unique constraint violated: users_email_idx
```

### Error Logging

```typescript
// Log everything internally
logger.error('Failed to send email', {
  caseId: '123',
  email: 'alice@example.com',
  error: error.message,
  stack: error.stack
})
```

### Graceful Degradation

- AI drafting fails → show template suggestions instead
- Email sending fails → queue for retry, notify admin
- Database connection lost → return cached data if available
- Redis unavailable → process synchronously (slow but works)

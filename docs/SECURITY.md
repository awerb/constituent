# Security Guide

Security practices for deployment and operations.

## Authentication

### User Authentication

NextAuth.js handles all login logic:

1. **Email/Password Login**
   - Email verified to exist in system
   - Password compared against bcryptjs hash
   - Session created if match
   - Session stored in database with encryption

2. **Session Expiration**
   - Sessions valid for 30 days (configurable)
   - Auto-logout after inactivity
   - Manual logout clears session

3. **Password Security**
   - Minimum 8 characters (enforced on reset)
   - Bcryptjs cost 10 (industry standard)
   - Passwords hashed, never stored in plaintext
   - Password reset emails expire after 24 hours

### API Authentication

Public APIs use two-factor authentication:

1. **API Key**
   - Identifies which city is making request
   - Sent in X-TC-Api-Key header
   - Stored in database, not logged

2. **HMAC Signature**
   - Request body signed with webhook secret
   - Signature in X-TC-Signature header
   - Verified using timing-safe comparison
   - Prevents request tampering

```typescript
// Verification in code
const computed = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

// Timing-safe comparison (prevents timing attacks)
return crypto.timingSafeEqual(
  Buffer.from(computed),
  Buffer.from(signature)
);
```

## Authorization

### Role-Based Access Control (RBAC)

Five roles with different permissions:

```
SUPER_ADMIN
├─ Manage all cities
├─ Manage super admin users
└─ Override any city settings

ADMIN (per-city)
├─ Manage city users and roles
├─ Manage departments
├─ Set SLA policies
├─ View audit logs
├─ Configure integrations

MANAGER (per-city)
├─ Assign cases to staff
├─ Generate reports
├─ Manage templates
├─ View case analytics

AGENT (per-city)
├─ Respond to assigned cases
├─ Add internal notes
├─ View case history

ELECTED_OFFICIAL (per-city)
├─ View district dashboard (read-only)
└─ Cannot create/modify anything
```

### Data Access Control

**Multi-Tenant Isolation**

Every user has `cityId`. Queries automatically filtered:

```typescript
// In middleware
const caseRecords = await prisma.case.findMany();
// Becomes:
// SELECT * FROM "Case" WHERE "cityId" = $1 AND ...
```

No SQL injection possible (Prisma uses parameterized queries).

**Row-Level Security**

Extra checks in application:

```typescript
const caseRecord = await prisma.case.findUnique({
  where: { id: input.caseId }
});

if (caseRecord?.cityId !== ctx.cityId) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}
```

## Data Protection

### Encryption

**In Transit**:
- All connections HTTPS only (enforced in production)
- TLS 1.2+ (automatic with Let's Encrypt)
- No cleartext HTTP allowed

**At Rest**:
- Database passwords encrypted in environment
- API keys stored with encryption
- Session tokens hashed before storage
- PII not encrypted in database (assumes physical security)

### Secrets Management

**Never commit secrets**:
```bash
# .gitignore includes:
.env
.env.local
*.key
*.pem
```

**Storage**:
```bash
# Development: .env.local (local machine only)
# Production: Use secret manager:
#  - AWS Secrets Manager
#  - Google Secret Manager
#  - Azure Key Vault
#  - HashiCorp Vault
```

**Generation**:
```bash
# Secrets should be:
# - Random (use cryptographically secure RNG)
# - Long (32+ characters)
# - Unique (one per environment)
# - Rotated regularly (every 90 days)

openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -hex 32     # JWT_SECRET
```

## Audit Logging

All significant actions logged:

```
TABLE: audit_log
Columns:
  - action: USER_LOGIN, CASE_CREATED, RESPONSE_SENT, etc.
  - userId: Who did it
  - cityId: Which city
  - entityType: User, Case, Template, etc.
  - entityId: Which entity affected
  - changes: What changed (old → new)
  - timestamp: When
  - ipAddress: From where
```

Example:
```
action: RESPONSE_SENT
userId: james@city.gov
caseId: case-123
changes: {
  status: "NEW" → "ASSIGNED",
  responseText: "..." (first 100 chars)
}
timestamp: 2024-01-16T14:45:00Z
ipAddress: 192.168.1.100
```

### Access Audit Logs

Go to `/admin/audit-logs`:

- Filter by date, user, action
- Export to CSV for analysis
- Logs retention: 1 year minimum
- Logs are immutable (can't be edited/deleted)

## CSRF Protection

Every form submission requires CSRF token:

```html
<!-- Automatically added by framework -->
<form method="POST">
  <input type="hidden" name="csrf" value="token-here">
  <!-- form fields -->
</form>
```

Tokens:
- Generated per session
- Tied to user's session
- Verified on submission
- Prevent cross-site requests

## XSS Prevention

All user input sanitized:

```typescript
// Using DOMPurify
import DOMPurify from 'isomorphic-dompurify';

const cleanContent = DOMPurify.sanitize(userInput);
// Removes <script>, onclick=, etc. but keeps safe HTML
```

**Content Security Policy**:
```
Content-Security-Policy: default-src 'self'
  script-src 'self' 'unsafe-inline'
  style-src 'self' 'unsafe-inline'
  img-src 'self' data:
  connect-src 'self'
```

Prevents inline scripts and external resource loading.

## SQL Injection Prevention

Prisma prevents injection automatically:

```typescript
// Bad (vulnerable to injection):
prisma.$queryRaw`SELECT * FROM cases WHERE id = ${input.id}`

// Good (safe):
prisma.case.findUnique({ where: { id: input.id } })
```

All queries use parameterized statements.

## Rate Limiting

**API Endpoints**:

```
POST /api/v1/signals: 10 req/min per IP
POST /api/v1/contact: 5 req/min per IP
GET /api/v1/cases/[ref]/status: 30 req/min per IP
```

Limits prevent:
- Brute force attacks
- DDoS attacks
- Credential stuffing
- Data scraping

**Implementation**:
```typescript
const rateLimitResult = await rateLimit(ip, 10, 60 * 1000);

if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: 'rate_limit_exceeded', ... },
    { status: 429, headers: getRateLimitHeaders(result) }
  );
}
```

## Input Validation

All inputs validated with Zod:

```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  subject: z.string().min(5).max(500),
});

const result = schema.parse(input);
// Throws error if invalid
```

Validates:
- Type (string, number, etc.)
- Format (email, URL, etc.)
- Length (min/max)
- Pattern (regex)
- Enum values

## Password Policy

**Requirements**:
- Minimum 8 characters
- Must include at least one letter
- Should include number or special character (recommended)

**Reset Flow**:
```
1. User clicks "Forgot Password"
2. Email sent with reset link
3. Link valid for 24 hours
4. Link contains single-use token
5. Password changed, old sessions invalidated
```

**Password Hashing**:
```typescript
const hash = await bcrypt.hash(password, 10);
// 10 rounds = ~100ms per hash (slow = harder to crack)
```

## Third-Party Security

**API Key Handling**:
- Keep in environment variables only
- Never commit to git
- Never log or display in UI
- Rotate every 90 days
- Use minimal-permission keys

**Webhook Security**:
- All webhooks signed (HMAC-SHA256)
- IP whitelisting (optional)
- Endpoint must be HTTPS
- Retries use exponential backoff (not immediate)

**Dependencies**:
```bash
# Check for vulnerabilities
npm audit

# Update regularly
npm update

# Subscribe to security advisories
# npm security advisory email updates
```

## Compliance

### GDPR (EU Users)

- **Data Processing Agreement**: Required from cloud provider
- **Right to Delete**: Privacy requests processed within 30 days
- **Right to Export**: Data exports available
- **Privacy Policy**: Posted on website
- **Consent**: Optional for non-essential cookies

### CCPA (California Users)

- **Privacy Notice**: Posted on website
- **Right to Know**: Constituents can request their data
- **Right to Delete**: Implement privacy request feature
- **Right to Opt-Out**: Sales/tracking opt-outs
- **Non-Discrimination**: Same service if they exercise rights

### Public Records (FOIA/CPRA)

- **Audit Trail**: All actions logged
- **Export Capability**: Full data exports available
- **Internal Notes**: Excluded from public records
- **Retention**: Comply with document retention laws

## Incident Response

### Security Incident Plan

If breach suspected:

1. **Isolate**: Take affected systems offline
2. **Assess**: Determine scope and severity
3. **Notify**: Alert IT leadership and legal
4. **Investigate**: Identify root cause
5. **Remediate**: Fix vulnerability
6. **Communicate**: Notify affected users if required
7. **Document**: Post-mortem and lessons learned

### Response Time SLA

- **Critical**: 1 hour (data breach, system down)
- **High**: 4 hours (vulnerability, auth bypass)
- **Medium**: 24 hours (non-critical issue)

### Communication

If users affected:
- Email within 24 hours explaining:
  - What happened
  - What data was exposed
  - What we're doing
  - What they should do
- Transparent about timeline
- Include credit monitoring (if passwords exposed)

## Infrastructure Security

### Database

- **PostgreSQL**: Enable SSL connections
- **Backups**: Encrypted, stored off-site
- **Credentials**: Separate read-only user for app
- **Patches**: Update security patches within 48 hours

### Server

- **OS Hardening**: SSH key-only, no passwords
- **Firewall**: Only ports 80, 443 open
- **Monitoring**: Automated alerts for suspicious activity
- **Updates**: Security patches within 48 hours

### Docker

```dockerfile
# Best practices:
# - Use minimal base image (alpine)
# - Single process per container
# - Read-only filesystem where possible
# - Non-root user
# - No secrets in image
```

## Security Checklist

### Pre-Launch

- [ ] NEXTAUTH_SECRET is 32+ random characters
- [ ] JWT_SECRET is 32+ random characters
- [ ] All API keys rotated
- [ ] Database backup tested
- [ ] SSL certificate valid
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] CORS configured
- [ ] Security headers set
- [ ] Audit logging enabled

### Post-Launch

- [ ] Monitor audit logs daily
- [ ] Check security advisories weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Test backup restoration quarterly
- [ ] Review access logs monthly
- [ ] Penetration test annually

## Getting Security Help

- **Report vulnerability**: security@city.gov
- **Do not**: Post on GitHub issues, public forums
- **Response**: Within 48 hours acknowledgment
- **Timeline**: 90 days to fix before disclosure

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Your contact info (optional)

No penalties for responsible disclosure.

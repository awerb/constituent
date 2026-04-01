# Configuration Reference

**Complete reference for all environment variables and configuration options.**

**Quick Links:** [Core Settings](#core-settings) | [Database & Cache](#database--cache) | [Authentication](#authentication) | [Email](#email--smtp) | [AI Integration](#ai-integration) | [Transparent City](#transparent-city-integration) | [Feature Flags](#feature-flags)

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Generating Secrets](#generating-secrets)
3. [Environment-Specific Examples](#environment-specific-examples)
4. [Feature Flags](#feature-flags)
5. [Validation & Startup](#validation--startup-checks)
6. [Common Mistakes](#common-mistakes)

---

## Environment Variables

### Core Settings

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `NODE_ENV` | `production` \| `development` \| `staging` | `development` | No | Deployment environment. Sets logging, error handling, etc. | `production` | Dev mode; detailed errors shown |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` | `info` | No | Logging verbosity. Use `debug` for troubleshooting, `error` for noise reduction. | `info` | Defaults to `info`; moderate logging |
| `DEPLOYMENT_MODE` | `single-tenant` \| `multi-tenant` | `single-tenant` | No | Operating mode. Single-tenant = one city. Multi-tenant = many cities, one deployment. | `single-tenant` | Single-tenant assumed |
| `APP_URL` | URL string | `http://localhost:3000` | No | Public base URL. Used in emails, redirects, API responses. Must match NEXTAUTH_URL in browser. | `https://respond.sf.gov` | Email links broken; API calls fail |
| `PORT` | Integer 1-65535 | `3000` | No | Port the app listens on (inside container). Change only in docker-compose.yml. | `3000` | Defaults to 3000 |

**Notes:**
- `NODE_ENV=production` disables hot-reload, minimizes logs, optimizes build
- `LOG_LEVEL=debug` outputs everything (query parameters, headers, full stack traces); never in production
- `DEPLOYMENT_MODE` affects database schema, DNS routing, UI routing
- `APP_URL` must be HTTPS in production; HTTP ok for development

---

### Database & Cache

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | — | **Yes** | Full PostgreSQL connection URI. Format: `postgresql://user:password@host:port/dbname?schema=public` | `postgresql://postgres:securepass@postgres:5432/constituent_response?schema=public` | **App won't start. Database connection failed.** |
| `DB_USER` | String | `postgres` | No | Database username (Docker Compose only). Ignored if DATABASE_URL is set. | `postgres` | Uses `postgres` user |
| `DB_PASSWORD` | String | `postgres` | No | Database password (Docker Compose only). **Never use default in production!** | `YourSecurePassword123!` | Uses `postgres` password |
| `DB_NAME` | String | `constituent_response` | No | Database name (Docker Compose only). Ignored if DATABASE_URL is set. | `constituent_response` | Uses default name |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` | No | Redis connection string. Format: `redis://[:password@]host:port[/db]` | `redis://:securepass@redis:6379/0` | Background jobs won't process; queues fail |
| `REDIS_PASSWORD` | String | — | No | Redis password (Docker Compose only). Ignored if REDIS_URL is set. | `RedisPassword123!` | No authentication (ok for Docker internal) |

**Notes:**
- `DATABASE_URL` takes precedence over `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- PostgreSQL connection must include `?schema=public` at end
- Redis password must match `REDIS_PASSWORD` if using external Redis
- Connection pooling recommended for multi-tenant (see DEPLOYMENT-MULTITENANT.md)

---

### Authentication

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `NEXTAUTH_SECRET` | Base64 string (32+ bytes) | — | **Yes** | Secret for NextAuth session encryption. Generate with: `openssl rand -base64 32` | `abc123base64stringhere...` | **App won't start. Auth will fail.** |
| `NEXTAUTH_URL` | URL string | `http://localhost:3000` | **Yes** | Application's public URL for auth callbacks. MUST match domain users access. Must include protocol (http/https). | `https://respond.yourdomain.com` | **Auth callbacks fail. Users cannot log in.** |
| `SESSION_EXPIRY_DAYS` | Integer (days) | `30` | No | Session duration. User auto-logs out after this many days of activity. | `30` | Sessions expire after 30 days |
| `JWT_SECRET` | Hex string (32+ bytes) | — | No | Secret for JWT tokens in API. Generate with: `openssl rand -hex 32` | `abc123hexstringhere...` | No impact if not using JWT API tokens |

**Notes:**
- `NEXTAUTH_SECRET` must be unique. **Never commit to version control.** Store in secrets manager.
- `NEXTAUTH_URL` must match exactly what users type in browser (including https/http)
- `SESSION_EXPIRY_DAYS`: Shorter is more secure, longer is more convenient
- For multi-tenant: NEXTAUTH_URL should be base domain (e.g., `https://respond.yourdomain.com`)

**How to Generate Secrets:**

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# JWT_SECRET
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Email / SMTP

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `SMTP_HOST` | Hostname or IP | `smtp.gmail.com` | **Yes** | SMTP server hostname. | `smtp.gmail.com` | **Email won't send. Cases can't acknowledge.** |
| `SMTP_PORT` | Integer 1-65535 | `587` | **Yes** | SMTP port. Usually 587 (TLS) or 465 (SSL). | `587` | Defaults to 587 (TLS) |
| `SMTP_USER` | Email address | — | **Yes** | SMTP username (usually email address). | `your-email@gmail.com` | **Auth will fail. Email won't send.** |
| `SMTP_PASS` | String (password) | — | **Yes** | SMTP password or app-specific password. **For Gmail: use App Password, not Gmail password!** | `your-app-password-here` | **Auth will fail. Email won't send.** |
| `SMTP_FROM` | Email address | `noreply@yourdomain.com` | **Yes** | Sender email address in outgoing emails. Should be from your domain. | `noreply@yourdomain.com` | Uses default; emails from wrong address |
| `SMTP_TLS` | `true` \| `false` | `true` | No | Use TLS encryption. Keep as `true` for security. | `true` | Uses TLS (recommended) |
| `SMTP_REJECT_UNAUTHORIZED` | `true` \| `false` | `true` | No | Verify SSL certificate. Set to `false` only for testing with self-signed certs. | `true` | Verifies SSL cert (recommended) |

**Notes:**
- **Gmail users:** Generate App Password at https://support.google.com/accounts/answer/185833 (not your Gmail password)
- **SendGrid:** SMTP_USER = `apikey`, SMTP_PASS = your SendGrid API key
- **AWS SES:** Use SES SMTP credentials, not IAM keys
- `SMTP_FROM` should be a verified sender address in your SMTP provider
- Test email: `docker-compose exec app npm run test:email --to=test@example.com`

**Common SMTP Providers:**

| Provider | SMTP Host | Port | Notes |
|----------|-----------|------|-------|
| **Gmail** | `smtp.gmail.com` | 587 | Requires App Password |
| **SendGrid** | `smtp.sendgrid.net` | 587 | User = `apikey` |
| **AWS SES** | `email-smtp.[region].amazonaws.com` | 587 | Region-specific |
| **Mailgun** | `smtp.mailgun.org` | 587 | Custom domain verification required |
| **Postmark** | `smtp.postmarkapp.com` | 587 | High deliverability |

---

### AI Integration

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `AI_PROVIDER` | `openai` \| `anthropic` | `openai` | **Yes** | Which AI provider to use. OpenAI or Anthropic Claude. | `openai` | **App requires choice. Defaults to OpenAI.** |
| `OPENAI_API_KEY` | String starting with `sk-` | — | Conditional | OpenAI API key. **Required if AI_PROVIDER=openai.** Get at https://platform.openai.com/api-keys | `sk-proj-abc123...` | **AI drafting won't work if using OpenAI.** |
| `OPENAI_MODEL` | Model string | `gpt-4-turbo` | No | OpenAI model to use. Recommended: `gpt-4-turbo` (good speed/cost/quality). | `gpt-4-turbo` | Uses `gpt-4-turbo` |
| `ANTHROPIC_API_KEY` | String starting with `sk-ant-` | — | Conditional | Anthropic API key. **Required if AI_PROVIDER=anthropic.** Get at https://console.anthropic.com | `sk-ant-abc123...` | **AI drafting won't work if using Anthropic.** |
| `ANTHROPIC_MODEL` | Model string | `claude-3-sonnet` | No | Anthropic model. Recommended: `claude-3-sonnet` (balanced). | `claude-3-sonnet` | Uses `claude-3-sonnet` |
| `AI_DISABLED` | `true` \| `false` | `false` | No | Disable AI entirely. Set to `true` to hide AI features, save costs. | `false` | AI enabled (if keys configured) |

**Notes:**
- Leave API keys blank to disable AI features (staff won't see "Generate Draft" button)
- Cost comparison: GPT-4-turbo ($0.01/draft), Claude-3-sonnet ($0.003/draft), GPT-3.5-turbo ($0.001/draft)
- Models: Prefer turbo/sonnet versions (faster, cheaper) unless you need maximum quality
- Test AI: `docker-compose exec app npm run test:ai --prompt="Test prompt"` (requires API key)
- AI requests include: constituent message, department context, tone setting. **No PII sent to provider.**

**Cost Estimation:**

```
100 cases/day × 5 drafts/case = 500 drafts/month

OpenAI gpt-4-turbo:   500 × $0.01 = $5/month
Anthropic sonnet:     500 × $0.003 = $1.50/month
OpenAI gpt-3.5-turbo: 500 × $0.001 = $0.50/month

Plus API call overhead (minimal)
```

---

### Transparent City Integration

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `TC_API_KEY` | String | — | No | Transparent City API key. Used for TC integration. | `tc-abc123...` | TC integration disabled |
| `TC_WEBHOOK_SECRET` | String | — | No | Webhook secret from TC for signature verification. | `whs-abc123...` | **Webhook signatures won't verify. Signals rejected.** |
| `TC_WEBHOOK_URL` | URL string | `{APP_URL}/api/v1/webhooks/newsletter` | No | URL where TC sends webhooks. Usually auto-constructed from APP_URL. | `https://respond.sf.gov/api/v1/webhooks/newsletter` | Auto-constructed from APP_URL |

**Notes:**
- Both `TC_API_KEY` and `TC_WEBHOOK_SECRET` must be set for signals to work
- Get values from Transparent City dashboard > Integrations
- Webhook signature verification uses HMAC-SHA256 with TC_WEBHOOK_SECRET
- Signals endpoint: `/api/v1/webhooks/newsletter` (auto-registered)

---

### Advanced / Optional

| Variable | Type | Default | Required | Description | Example | If Missing |
|----------|------|---------|----------|-------------|---------|-----------|
| `WEBHOOK_RETRY_ATTEMPTS` | Integer | `3` | No | How many times to retry failed webhook dispatches. | `3` | Retries 3 times |
| `WEBHOOK_RETRY_BACKOFF_MS` | Integer | `5000` | No | Milliseconds to wait between webhook retries (exponential). | `5000` | Waits 5 seconds between attempts |
| `JOB_CONCURRENCY` | Integer | `5` | No | Max concurrent background jobs (BullMQ worker threads). Increase for high volume. | `5` | Processes 5 jobs concurrently |
| `CASE_SLA_DEFAULT_HOURS` | Integer | `48` | No | Default SLA for cases (can be overridden per department). | `48` | 48-hour default SLA |
| `ENABLE_AUDIT_LOGGING` | `true` \| `false` | `true` | No | Log all user actions for audit trail. Keep as `true` for compliance. | `true` | Audit logging enabled |
| `DATA_RETENTION_DAYS` | Integer | `2555` (7 years) | No | Auto-delete closed cases after this many days. Set per-city in admin UI. | `2555` | Keeps data 7 years |
| `ENABLE_ANONYMOUS_ANALYTICS` | `true` \| `false` | `true` | No | Send anonymized usage stats to developers (helps improve platform). | `true` | Analytics enabled |

---

## Generating Secrets

### NEXTAUTH_SECRET

```bash
# Option 1: Using OpenSSL (Linux/Mac)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Then add to .env:
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

### JWT_SECRET

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Passwords

```bash
# Generate strong random password
openssl rand -base64 20

# Or using Python
python3 -c "import secrets; print(secrets.token_urlsafe(20))"

# Use for DB_PASSWORD and REDIS_PASSWORD
```

---

## Environment-Specific Examples

### Development (localhost, no HTTPS, test data)

```bash
# .env.local
NODE_ENV=development
LOG_LEVEL=debug
DEPLOYMENT_MODE=single-tenant

# Database (local or Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/constituent_response?schema=public
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=your-dev-secret-key-at-least-32-characters-long-here
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Email (optional for development; can use mock)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=dev@localhost

# AI (optional)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-dev-key-here

# Transparent City (optional)
TC_API_KEY=tc-dev-key-here
TC_WEBHOOK_SECRET=whs-dev-secret-here
```

### Staging (staging domain, HTTPS, real data, slower AI model)

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
DEPLOYMENT_MODE=single-tenant

# Database (managed or self-hosted, with backups)
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres.example.com:5432/constituent_response_staging?schema=public
REDIS_URL=redis://:STRONG_PASSWORD@redis.example.com:6379/0

# Auth
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate fresh
NEXTAUTH_URL=https://staging.respond.yourdomain.com
APP_URL=https://staging.respond.yourdomain.com

# Email (real SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# AI (cheaper model for testing costs)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-staging-key-here
OPENAI_MODEL=gpt-3.5-turbo  # Cheaper than gpt-4-turbo

# Transparent City (real keys)
TC_API_KEY=tc-your-real-api-key-here
TC_WEBHOOK_SECRET=whs-your-real-webhook-secret-here
```

### Production (real domain, HTTPS, real data, production AI)

```bash
# .env.production (managed with secrets, NEVER committed to git!)
NODE_ENV=production
LOG_LEVEL=warn
DEPLOYMENT_MODE=single-tenant

# Database (managed service with backups, SSL)
DATABASE_URL=postgresql://postgres:VERY_STRONG_PASSWORD_32_CHARS_MIN@prod-postgres.example.com:5432/constituent_response?schema=public&sslmode=require
REDIS_URL=redis://:VERY_STRONG_PASSWORD_32_CHARS_MIN@prod-redis.example.com:6379/0

# Auth
NEXTAUTH_SECRET=GENERATE_WITH_OPENSSL_RAND_BASE64_32
NEXTAUTH_URL=https://respond.yourdomain.com
APP_URL=https://respond.yourdomain.com

# Email (production SMTP)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # AWS SES
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=VERY_LONG_SES_PASSWORD
SMTP_FROM=noreply@yourdomain.com
SMTP_TLS=true
SMTP_REJECT_UNAUTHORIZED=true

# AI (production model)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-production-key-here
OPENAI_MODEL=gpt-4-turbo  # Best quality

# Transparent City (real keys)
TC_API_KEY=tc-your-real-production-api-key
TC_WEBHOOK_SECRET=whs-your-real-production-webhook-secret

# Backups & retention
DATA_RETENTION_DAYS=2555  # 7 years per legal requirement

# Monitoring
ENABLE_AUDIT_LOGGING=true
```

### Multi-Tenant (single deployment, many cities)

```bash
# .env
NODE_ENV=production
LOG_LEVEL=info
DEPLOYMENT_MODE=multi-tenant

# Shared database and Redis
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres.example.com:5432/constituent_response_multi?schema=public
REDIS_URL=redis://:STRONG_PASSWORD@redis.example.com:6379/0

# Auth (base domain)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://respond.yourdomain.com
APP_URL=https://respond.yourdomain.com

# SMTP, AI, etc. (same as single-tenant)
SMTP_HOST=...
# ...
```

---

## Feature Flags

### Enabling/Disabling Features

Feature flags are managed via city-level settings in the database:

```sql
-- Enable feature for specific city
UPDATE "City" SET
  settings = jsonb_set(settings, '{featureFlags,aiDrafting}', 'true')
WHERE slug = 'sf';

-- Disable feature for specific city
UPDATE "City" SET
  settings = jsonb_set(settings, '{featureFlags,aiDrafting}', 'false')
WHERE slug = 'sf';
```

### Available Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `aiDrafting` | `true` | Enable/disable AI draft generation |
| `multilingual` | `true` | Enable/disable multi-language support |
| `electedOfficialDashboard` | `true` | Enable/disable elected official reports |
| `webhookIntegration` | `true` | Enable/disable outbound webhooks to 311 |
| `signalIntegration` | `true` | Enable/disable newsletter signal processing |
| `privacyRequests` | `true` | Enable/disable GDPR/CCPA deletion requests |

---

## Validation & Startup Checks

The app validates configuration on startup:

```
Starting Constituent Response...

Checking configuration...
✓ NODE_ENV = production
✓ NEXTAUTH_SECRET is set
✓ NEXTAUTH_URL matches APP_URL
✓ DATABASE_URL is valid format
✗ SMTP_HOST is set but SMTP_PASS is missing
✓ REDIS_URL is reachable

Warnings:
  - LOG_LEVEL=warn will reduce troubleshooting visibility
  - TC_API_KEY not set; newsletter integration disabled

Connecting to services...
✓ Database: constituent_response (connected)
✓ Redis: 1 connection (connected)
✓ SMTP: smtp.gmail.com:587 (reachable)
✓ AI Provider: OpenAI gpt-4-turbo (reachable)

Ready!
```

If validation fails, app exits with error:

```
ERROR: Required environment variable missing: NEXTAUTH_SECRET

Fix by running:
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env
```

---

## Common Mistakes

### 1. NEXTAUTH_URL Doesn't Match Browser URL

**Problem:**
```
NEXTAUTH_URL=http://localhost:3000
# But user goes to http://127.0.0.1:3000
# → Auth callback fails
```

**Solution:**
```bash
# Set NEXTAUTH_URL to exactly what users type
NEXTAUTH_URL=http://127.0.0.1:3000  # If users use IP
# Or better: use domain names, not IPs
NEXTAUTH_URL=https://respond.yourdomain.com
```

### 2. DATABASE_URL Missing Schema

**Problem:**
```bash
DATABASE_URL=postgresql://postgres:pass@postgres:5432/constituent_response
# Missing ?schema=public at end
```

**Solution:**
```bash
DATABASE_URL=postgresql://postgres:pass@postgres:5432/constituent_response?schema=public
```

### 3. Using Gmail Password Instead of App Password

**Problem:**
```bash
SMTP_PASS=my_actual_gmail_password_123
# Google rejects this
```

**Solution:**
```bash
# Generate App Password: https://support.google.com/accounts/answer/185833
SMTP_PASS=abcd efgh ijkl mnop  # 16 character app password
```

### 4. Committing Secrets to Git

**Problem:**
```bash
# In repository .env file
NEXTAUTH_SECRET=super_secret_here
# Now it's in git history forever!
```

**Solution:**
```bash
# Use .env.example with placeholders
NEXTAUTH_SECRET=your-secret-here-replace-in-production

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore

# Use secrets management in production
# - Docker Compose: use docker secrets
# - Kubernetes: use k8s secrets
# - AWS: use Parameter Store or Secrets Manager
# - GitHub: use repository secrets
```

### 5. LOG_LEVEL=debug in Production

**Problem:**
```bash
NODE_ENV=production
LOG_LEVEL=debug  # Way too verbose!
# Logs will contain passwords, tokens, PII
```

**Solution:**
```bash
LOG_LEVEL=warn  # Only warnings and errors
# Or LOG_LEVEL=info for moderate verbosity
```

### 6. Not Setting SESSION_EXPIRY_DAYS

**Problem:**
```bash
# Default 30-day sessions
# But your security policy requires 7-day sessions
```

**Solution:**
```bash
SESSION_EXPIRY_DAYS=7
```

---

## Validation Commands

Test your configuration:

```bash
# Test database connection
docker-compose exec app npm run test:database

# Test email/SMTP
docker-compose exec app npm run test:email --to=test@example.com

# Test AI provider
docker-compose exec app npm run test:ai --prompt="Test prompt"

# Test Redis connection
docker-compose exec app npm run test:redis

# Test all configuration at once
docker-compose exec app npm run test:config
```

---

## Next Steps

1. **Copy .env.example to .env**
2. **Generate secrets** (see [Generating Secrets](#generating-secrets) above)
3. **Fill in required variables** from your setup
4. **Run validation tests** (see [Validation Commands](#validation-commands))
5. **Start application** and test features

**Related:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - How to deploy
- [ADMIN-GUIDE.md](./ADMIN-GUIDE.md) - First-time setup
- [SECURITY.md](./SECURITY.md) - Security best practices

---

**Last Updated:** March 2026

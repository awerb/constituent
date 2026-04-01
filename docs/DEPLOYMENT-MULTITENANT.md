# Multi-Tenant Deployment Guide

## Overview

Multi-tenant mode allows a single Constituent Response deployment to serve multiple cities with complete data isolation. Each city has its own:

- Cases and constituents
- Departments and staff
- Templates and configurations
- Webhooks and integrations
- Audit logs

Staff only see data for their assigned city. Admins manage users and settings per city. Super admins oversee the entire system.

## Enable Multi-Tenant Mode

### Set Environment Variable

```bash
# In .env
DEPLOYMENT_MODE=multi-tenant
```

### Database Initialization

Multi-tenant mode uses the same database schema as single-tenant, but with city isolation at the application layer.

```bash
# Run migrations (same as single-tenant)
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed
```

### Create Cities

```bash
# Using Prisma Studio
npm run db:studio

# Navigate to City table and create:
# - name: "San Francisco"
# - slug: "sf"
# - state: "CA"
# (slug must be unique and lowercase)

# Or via SQL
docker-compose exec postgres psql -U postgres -d constituent_response
INSERT INTO "City" (id, name, slug, state) VALUES
  (gen_random_uuid(), 'San Francisco', 'sf', 'CA'),
  (gen_random_uuid(), 'Oakland', 'oakland', 'CA');
```

## DNS Setup for Multi-Tenant

### Wildcard Subdomain Method (Recommended)

Each city gets its own subdomain:
- `sf.respond.transparentcity.co` -> San Francisco
- `oakland.respond.transparentcity.co` -> Oakland
- `demo.respond.transparentcity.co` -> Demo city

### 1. Create Wildcard DNS Record

```bash
# In your DNS provider (Route53, Cloudflare, GoDaddy, etc.)
# Create wildcard A record:

Type: A
Name: *.respond.transparentcity.co
Value: 1.2.3.4 (your server IP)
TTL: 300

# Or CNAME if using Caddy/load balancer:
Type: CNAME
Name: *.respond.transparentcity.co
Value: respond.transparentcity.co
```

### 2. Update Caddy Configuration

```bash
# /etc/caddy/Caddyfile

# Wildcard pattern for all subdomains
*.respond.transparentcity.co {
    reverse_proxy localhost:3000

    encode gzip

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}

# Keep main domain too if needed
respond.transparentcity.co {
    reverse_proxy localhost:3000
    encode gzip
}
```

### 3. Update .env

```bash
# Multi-tenant applications use subdomain to detect city
# The app automatically detects city from subdomain

DEPLOYMENT_MODE=multi-tenant
NEXTAUTH_URL=https://respond.transparentcity.co  # Base domain for auth
```

### 4. Test DNS Resolution

```bash
# Verify DNS works
dig sf.respond.transparentcity.co
dig oakland.respond.transparentcity.co

# Should return your server IP
```

## Tenant Provisioning

### Automatic Tenant Setup Script

```bash
# Create provisioning script
cat > /usr/local/bin/provision-tenant.sh << 'EOF'
#!/bin/bash

# Usage: ./provision-tenant.sh <city-name> <city-slug> <state-code>
# Example: ./provision-tenant.sh "San Francisco" "sf" "CA"

CITY_NAME=$1
CITY_SLUG=$2
STATE_CODE=$3

if [ -z "$CITY_NAME" ] || [ -z "$CITY_SLUG" ] || [ -z "$STATE_CODE" ]; then
    echo "Usage: $0 <city-name> <city-slug> <state-code>"
    echo "Example: $0 'San Francisco' 'sf' 'CA'"
    exit 1
fi

CD_PATH="/home/ubuntu/constituent-response"

# Create city in database
docker-compose -f "$CD_PATH/docker-compose.yml" exec -T postgres psql \
    -U postgres \
    -d constituent_response \
    -c "INSERT INTO \"City\" (id, name, slug, state, \"createdAt\") VALUES (gen_random_uuid(), '$CITY_NAME', '$CITY_SLUG', '$STATE_CODE', now());"

# Create default admin department
CITY_ID=$(docker-compose -f "$CD_PATH/docker-compose.yml" exec -T postgres psql \
    -U postgres \
    -d constituent_response \
    -t -c "SELECT id FROM \"City\" WHERE slug = '$CITY_SLUG';")

docker-compose -f "$CD_PATH/docker-compose.yml" exec -T postgres psql \
    -U postgres \
    -d constituent_response \
    -c "INSERT INTO \"Department\" (id, \"cityId\", name, slug, description, \"defaultSlaHours\", \"isActive\", \"createdAt\") VALUES (gen_random_uuid(), '$CITY_ID', 'Administration', 'admin', 'Main department', 48, true, now());"

echo "City '$CITY_NAME' ($CITY_SLUG) provisioned successfully"
echo "Access at: https://${CITY_SLUG}.respond.transparentcity.co"
EOF

chmod +x /usr/local/bin/provision-tenant.sh

# Provision a new city
/usr/local/bin/provision-tenant.sh "San Francisco" "sf" "CA"
```

### Manual Provisioning

```bash
# 1. Create city record
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
INSERT INTO "City" (id, name, slug, state, "createdAt")
VALUES (gen_random_uuid(), 'San Francisco', 'sf', 'CA', now());
EOF

# 2. Get the city ID
CITY_ID=$(docker-compose exec -T postgres psql \
    -U postgres \
    -d constituent_response \
    -t -c "SELECT id FROM \"City\" WHERE slug = 'sf';")

# 3. Create default department
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
INSERT INTO "Department" (id, "cityId", name, slug, description, "defaultSlaHours", "isActive", "createdAt")
VALUES (gen_random_uuid(), '$CITY_ID', 'Administration', 'admin', 'Main department', 48, true, now());
EOF

# 4. Create admin user (hashed password from bcrypt)
# Use npm to generate: npm -g install bcrypt-cli
# bcrypt "password123" -> generates hash like $2b$10$...
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
INSERT INTO "User" (id, "cityId", email, name, role, password, "isActive", "createdAt")
VALUES (
    gen_random_uuid(),
    '$CITY_ID',
    'admin@sf-response.local',
    'SF Admin',
    'ADMIN',
    '\$2b\$10\$...',  -- bcrypt hash
    true,
    now()
);
EOF
```

## Database Considerations

### When to Scale

As you add cities and users, monitor:

```bash
# Monitor active connections
docker-compose exec postgres psql -U postgres -d constituent_response -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Typical limits:
# - Single connection pool: ~20 connections per service
# - 5 cities × 2 staff each = 10+ users = ~30+ connections

# Scale when hitting 70% of max connections (default: 100)
```

### Connection Pooling with PgBouncer

For 10+ cities, add connection pooling:

```bash
# docker-compose.yml additions
services:
  pgbouncer:
    image: pgbouncer:latest
    environment:
      PGBOUNCER_DATABASES_HOST: postgres
      PGBOUNCER_DATABASES_PORT: 5432
      PGBOUNCER_DATABASES_USER: postgres
      PGBOUNCER_DATABASES_PASSWORD: securepassword
      PGBOUNCER_DATABASES_DBNAME: constituent_response
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      - postgres

# Update DATABASE_URL to use pgbouncer
DATABASE_URL=postgresql://postgres:password@pgbouncer:6432/constituent_response?schema=public
```

### Scaling PostgreSQL

For high volume:

```bash
# 1. Increase shared_buffers (25% of RAM)
# 2. Increase max_connections to match connection pool
# 3. Enable WAL archiving for point-in-time recovery

# docker-compose.yml
services:
  postgres:
    command: >
      -c shared_buffers=512MB
      -c max_connections=200
      -c effective_cache_size=1GB
```

## Monitoring Per-Tenant

### Get Cases per City

```bash
# SQL query
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT
  c.name as city,
  COUNT(ca.id) as case_count,
  COUNT(DISTINCT ca."constituentId") as unique_constituents
FROM "City" c
LEFT JOIN "Case" ca ON ca."cityId" = c.id
GROUP BY c.id, c.name
ORDER BY case_count DESC;
EOF
```

### Monitor City-Specific Logs

```bash
# Check app logs for a specific city
docker-compose logs app | grep "sf" | tail -100

# View audit logs for a city
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT * FROM "AuditLog"
WHERE "cityId" = (SELECT id FROM "City" WHERE slug = 'sf')
ORDER BY "createdAt" DESC
LIMIT 20;
EOF
```

### Check API Usage per City

```bash
# Count signals received per city
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT
  c.name,
  COUNT(*) as signal_count
FROM "City" c
LEFT JOIN "NewsletterSignal" ns ON ns."cityId" = c.id
GROUP BY c.id, c.name;
EOF
```

## Tenant Data Isolation

Data isolation is enforced at multiple levels:

### 1. Database Level

Prisma middleware automatically adds `cityId` filters to all queries:

```typescript
// When user fetches cases, only their city's cases are returned
const cases = await prisma.case.findMany();
// Becomes: SELECT * FROM "Case" WHERE "cityId" = $1 AND ...
```

### 2. Application Level

tRPC routers check user's cityId against requested data:

```typescript
export const casesRouter = router({
  getCase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const caseRecord = await ctx.prisma.case.findUnique({
        where: { id: input.id }
      });

      // Extra safety check
      if (caseRecord?.cityId !== ctx.cityId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return caseRecord;
    })
});
```

### 3. API Level

Public APIs require city slug in request:

```bash
# Must specify city in request
curl -X POST https://sf.respond.transparentcity.co/api/v1/signals \
  -H "X-TC-Api-Key: sf-api-key" \
  -d '{"citySlug": "sf", ...}'
```

## Multi-Tenant Backups

### Backup All Cities

```bash
# Single backup contains all cities
docker-compose exec postgres pg_dump \
  -U postgres \
  -d constituent_response \
  -F c > /backups/all-cities-$(date +%Y%m%d).dump
```

### Backup Single City

```bash
# Extract single city data to separate file
docker-compose exec postgres pg_dump \
  -U postgres \
  -d constituent_response \
  -t '"Case"' \
  -t '"Constituent"' \
  --where="cityId = (SELECT id FROM \"City\" WHERE slug = 'sf')" \
  > /backups/sf-$(date +%Y%m%d).sql
```

### Restore Single City

```bash
# Create new empty city first
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
INSERT INTO "City" (id, name, slug, state) VALUES (gen_random_uuid(), 'New City', 'newcity', 'CA');
EOF

# Then restore that city's data (update CityId as needed in restored data)
```

## Multi-Tenant Testing

```bash
# Test city isolation
CITY_ID_SF=$(docker-compose exec -T postgres psql -U postgres -d constituent_response \
  -t -c "SELECT id FROM \"City\" WHERE slug = 'sf';")

CITY_ID_OAK=$(docker-compose exec -T postgres psql -U postgres -d constituent_response \
  -t -c "SELECT id FROM \"City\" WHERE slug = 'oakland';")

# SF user should NOT see Oakland cases
curl -H "Authorization: Bearer sf-token" \
  https://sf.respond.transparentcity.co/api/v1/cases

# Should return 0 results if both cities are empty, or only SF cases
```

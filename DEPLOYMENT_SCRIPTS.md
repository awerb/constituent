# Constituent Response - Deployment Scripts

This directory contains three complete, production-ready deployment scripts for the Constituent Response application.

## Scripts Overview

### 1. scripts/setup.sh - First-Time Setup
**Purpose**: Perform initial deployment and configuration of the application

**Features**:
- Verifies Docker and Docker Compose installation
- Creates .env file with interactive configuration wizard
- Generates secure NEXTAUTH_SECRET using openssl
- Configures database (PostgreSQL), cache (Redis), and AI providers
- Starts all Docker containers
- Waits for PostgreSQL to be healthy
- Runs Prisma migrations automatically
- Executes database seed script
- Displays success message with application URL

**Usage**:
```bash
./scripts/setup.sh
```

**Configuration Prompts**:
- Database credentials (user, password, name)
- Redis password
- NextAuth secret (auto-generated)
- Application URL
- AI provider (OpenAI or Anthropic)
- AI provider API key
- Email/SMTP configuration
- Townhall/Constituent API credentials
- Log level and deployment mode

**Output**: Ready-to-use application at http://localhost:3000

---

### 2. scripts/backup.sh - Database Backup Utility
**Purpose**: Create compressed, timestamped database backups with automatic retention

**Features**:
- Creates pg_dump backups of PostgreSQL database
- Compresses with gzip for efficient storage
- Timestamped filenames for easy identification
- Automatic cleanup: keeps only last 7 days of daily backups
- Validates backup file integrity
- Displays backup location and file size
- Provides restoration instructions
- Docker-based (no local PostgreSQL client required)

**Usage**:
```bash
# Backup to current directory
./scripts/backup.sh

# Backup to specific directory
./scripts/backup.sh /var/backups/constituent-response

# Backup to remote/NFS location
./scripts/backup.sh /mnt/nfs/backups
```

**Cron Setup** (automated daily backup at 2:00 AM):
```bash
0 2 * * * /opt/constituent-response/scripts/backup.sh /var/backups/constituent-response
```

**Backup Retention**:
- Default: 7 days of daily backups
- Automatically deletes backups older than 7 days
- Customizable via BACKUP_RETENTION_DAYS variable

**Restoration**:
```bash
gunzip < backup_file.sql.gz | docker-compose exec -T postgres psql -U postgres constituent_response
```

---

### 3. scripts/provision-tenant.sh - Multi-Tenant Provisioning
**Purpose**: Provision new cities/tenants in multi-tenant deployments

**Features**:
- Interactive or argument-based provisioning
- Validates all input parameters
- Creates city record in database with default settings
- Generates webhook secret and URL
- Creates admin user invite (optional)
- Provides webhook URL for Townhall/Constituent configuration
- Outputs JSON configuration for automation
- Comprehensive error handling and validation

**Usage - Interactive Mode**:
```bash
./scripts/provision-tenant.sh
```

**Usage - Command-Line Arguments**:
```bash
./scripts/provision-tenant.sh \
  --name "Springfield" \
  --slug "springfield" \
  --state "IL" \
  --timezone "America/Chicago" \
  --admin-email "admin@springfield.gov"
```

**Options**:
```
--name TEXT         Tenant name (3-100 chars, letters/numbers/spaces/hyphens)
--slug TEXT         Tenant slug (3-50 chars, lowercase letters/numbers/hyphens)
--state CODE        US state code (AL, AK, AZ, ..., WY, DC, AS, GU, MP, PR, UM, VI)
--timezone TZ       Timezone (e.g., America/Chicago, America/New_York)
--admin-email EMAIL Email for admin invite (optional)
-h, --help          Show help message
```

**Output**:
- Tenant ID in database
- Webhook URL for Townhall/Constituent integration
- Admin invite token (if email provided)
- JSON configuration for automation

**Example Output**:
```json
{
  "tenant_id": "1",
  "name": "Springfield",
  "slug": "springfield",
  "state": "IL",
  "timezone": "America/Chicago",
  "webhook_url": "http://localhost:3000/api/webhooks/springfield/abc123def456",
  "webhook_secret": "abc123def456789...",
  "admin_email": "admin@springfield.gov",
  "admin_invite_token": "xyz789..."
}
```

---

## Common Workflows

### Initial Deployment
```bash
# 1. Run setup script
./scripts/setup.sh

# 2. Application is now running at http://localhost:3000
# 3. For multi-tenant: provision tenants
./scripts/provision-tenant.sh --name "My City" --slug "my-city" --state "CA" --timezone "America/Los_Angeles"
```

### Daily Backup
Add to crontab:
```bash
# Backup at 2 AM daily
0 2 * * * /path/to/scripts/backup.sh /var/backups/constituent-response

# Backup every 6 hours (for high-activity systems)
0 */6 * * * /path/to/scripts/backup.sh /var/backups/constituent-response
```

### Batch Tenant Provisioning
```bash
#!/bin/bash
# Create multiple cities

./scripts/provision-tenant.sh --name "Springfield" --slug "springfield" --state "IL" --timezone "America/Chicago"
./scripts/provision-tenant.sh --name "Capital City" --slug "capital-city" --state "CA" --timezone "America/Los_Angeles"
./scripts/provision-tenant.sh --name "Shelbyville" --slug "shelbyville" --state "OH" --timezone "America/New_York"
```

### Database Recovery
```bash
# 1. List available backups
ls -lah /var/backups/constituent-response/

# 2. Stop the application (optional but recommended)
docker-compose down

# 3. Start only the database
docker-compose up -d postgres redis

# 4. Wait for database to be ready
docker-compose exec postgres pg_isready -U postgres

# 5. Restore from backup
gunzip < /var/backups/constituent-response/constituent_response_backup_20260331_020000.sql.gz | \
  docker-compose exec -T postgres psql -U postgres constituent_response

# 6. Start all services
docker-compose up -d
```

---

## Script Features

### Error Handling
All scripts include:
- Comprehensive input validation
- Docker container health checks
- Graceful error messages with actionable next steps
- Backup integrity validation
- Database connection verification

### Logging & Output
All scripts provide:
- Color-coded output (success/error/warning/info)
- Detailed progress messages
- Timestamps in backups and logs
- JSON output for automation integration
- Help documentation with -h/--help flags

### Security
All scripts implement:
- Secure secret generation using openssl
- No hardcoded credentials in output
- Environment variable protection
- Webhook secret generation
- Password input via -sp flag (no echo)

---

## Environment Variables

The scripts use the following environment variables from .env:

```
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=constituent_response

# Redis
REDIS_URL=redis://password@host:port
REDIS_PASSWORD=redis

# Application
NEXTAUTH_SECRET=<auto-generated>
NEXTAUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
DEPLOYMENT_MODE=single-tenant|multi-tenant

# AI Provider
AI_PROVIDER=openai|anthropic
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=user@gmail.com
SMTP_PASS=app-password
SMTP_FROM=noreply@example.com

# External Services
TC_API_KEY=...
TC_WEBHOOK_SECRET=...

# Configuration
LOG_LEVEL=debug|info|warn|error
```

---

## Troubleshooting

### Docker not found
```bash
# Install Docker: https://docs.docker.com/get-docker/
# Install Docker Compose: https://docs.docker.com/compose/install/
```

### PostgreSQL not healthy
```bash
# Check logs
docker-compose logs postgres

# Verify port is available
lsof -i :5432

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Backup fails
```bash
# Check database is running
docker-compose ps postgres

# Check disk space
df -h

# Verify output directory exists and is writable
ls -la /var/backups/constituent-response/
```

### Tenant provisioning fails
```bash
# Verify deployment mode
grep DEPLOYMENT_MODE .env

# Check database connection
docker-compose exec postgres psql -U postgres -d constituent_response

# Verify city table exists
docker-compose exec postgres psql -U postgres -d constituent_response -c "SELECT * FROM cities LIMIT 1;"
```

---

## Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] .env.example file exists and contains all required variables
- [ ] Run setup.sh to initialize application
- [ ] Verify application starts at http://localhost:3000
- [ ] Create admin user and sign in
- [ ] Configure webhook in Townhall/Constituent system
- [ ] Set up backup cron job
- [ ] Test backup functionality
- [ ] Document backup location and retention policy
- [ ] Configure monitoring/alerting for containers
- [ ] Set up log aggregation (optional)
- [ ] Document tenant provisioning process
- [ ] Create runbook for common operations

---

## Support & Documentation

For more information:
- Docker Documentation: https://docs.docker.com
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs/

# Deployment Guide

**Deploy Constituent Response to production, cloud platforms, or on-premise servers.**

**Quick Links:** [Simplest Possible (Free Testing)](#simplest-possible-deployment) | [$6/Month Production](#6month-production-deployment) | [Cloud Platforms](#cloud-deployment) | [Domain Setup](#do-i-need-a-domain-name) | [SSL/TLS](#https-setup) | [Backups](#backup-procedures) | [Troubleshooting](#troubleshooting)

---

## Table of Contents

1. [Simplest Possible Deployment (Free Testing)](#simplest-possible-deployment)
2. [$6/Month Production Deployment](#6month-production-deployment)
3. [Do I Need a Domain Name?](#do-i-need-a-domain-name)
4. [Prerequisites](#prerequisites)
5. [Quick Deploy with Docker Compose](#quick-deploy-with-docker-compose)
6. [Cloud Platform Guides](#cloud-deployment)
7. [SSL/TLS and HTTPS](#https-setup)
8. [Reverse Proxy Configuration](#reverse-proxy-configuration)
9. [Backup Procedures](#backup-procedures)
10. [Database Migrations](#database-migrations)
11. [Updating](#updating)
12. [Monitoring](#monitoring)
13. [Troubleshooting](#troubleshooting)

---

## Simplest Possible Deployment

**Goal:** Try this on your computer for free in 5 minutes, no credit card.

If you have a Mac (Intel or Apple Silicon) or Linux computer on your desk, you can run Constituent Response right now to see if you like it.

### Prerequisites

- Docker Desktop installed (free, go to https://www.docker.com/products/docker-desktop)
- 5 GB free disk space
- 2 GB available RAM

### One-Command Deploy

```bash
# Clone the repo
git clone https://github.com/your-org/constituent-response.git
cd constituent-response

# Start it
docker compose up -d

# Wait 30 seconds for startup
sleep 30

# Open in browser
open http://localhost:3000
# Or on Linux: xdg-open http://localhost:3000
```

That's it. You now have a fully working system on your computer.

**Login:** Default credentials are shown in terminal output. Or check `.env` file.

**To stop it:** `docker compose down`

**To completely remove it:** `docker compose down -v` (deletes the database too)

### Try It Out

Send yourself a test case and respond to it. See the dashboard. Play with it. This costs nothing.

When you're done testing:
1. Stop it: `docker compose down`
2. Delete it: `rm -rf constituent-response` (if you want to clean up)
3. Move to production setup below when ready

---

## $6/Month Production Deployment

**Goal:** Get this running on a real server for $6-12/month so it's always available.

When you're ready to go live, follow these steps. Total time: 20 minutes. Total cost: $6-12/month.

### Step 1: Get a Server ($6-12/month)

Pick one (all work identically):

**DigitalOcean ($6/month):**
1. Go to https://www.digitalocean.com
2. Click "Create" > "Droplets"
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** Basic ($6/month, 1 CPU, 1GB RAM, 25GB SSD)
   - **Region:** Pick closest to your city
   - **Authentication:** SSH Key (add your computer's public key) or Password
4. Click "Create Droplet"
5. Wait 1-2 minutes, copy the IP address

**Vultr ($6/month) or Linode ($6/month):** Same process, pick Ubuntu 22.04 LTS, 1GB RAM.

### Step 2: Connect to Your Server

```bash
# Replace 192.0.2.1 with your server's actual IP
ssh root@192.0.2.1

# First time, you'll get a key verification prompt
# Type 'yes' and press Enter
```

You're now logged into your server terminal.

### Step 3: Install Docker and Clone

Copy this entire block and paste into your server terminal:

```bash
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y
apt-get install -y curl git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose v2
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone the repo
cd /home && git clone https://github.com/your-org/constituent-response.git
cd constituent-response

# Copy environment template
cp .env.example .env

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 16)
REDIS_PASSWORD=$(openssl rand -base64 16)

# Update .env with secrets (on a real server, also set domain)
sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
sed -i "s/NODE_ENV=.*/NODE_ENV=production/" .env

# Add 2GB swap (helps with 1GB RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

echo "All set! Starting services..."
```

This does everything: installs Docker, adds swap (important for 1GB RAM), clones code, generates secrets.

### Step 4: Start Services

Still in your server terminal:

```bash
# Still in /home/constituent-response
docker compose pull
docker compose up -d

# Wait 30 seconds for startup
sleep 30

# Check status
docker compose ps
# Should show app, postgres, redis, worker all "running"

# View logs
docker compose logs -f app
# Look for "ready - started server on 0.0.0.0:3000"
# Press Ctrl+C to exit logs
```

Services are starting. This takes 30-60 seconds.

### Step 5: Configure Firewall (if needed)

If your server provider has a firewall:

Allow:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH)

Block everything else.

Most providers allow all by default, so you might skip this.

### Step 6: Point Your Domain (Optional but Recommended)

**If you have a domain (e.g., respond.yourtown.gov):**

1. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Find DNS settings
3. Add an **A record:**
   - **Name:** respond (or whatever you want)
   - **Type:** A
   - **Value:** Your server's IP address (192.0.2.1)
   - **TTL:** 3600
4. Save
5. Wait 5-30 minutes for DNS to propagate

Then you can access it at `http://respond.yourtown.gov` (note: HTTP, not HTTPS yet).

**If you don't have a domain:**

You can access it at `http://192.0.2.1:3000` using your server's IP address. Less pretty, but works fine.

### Step 7: Set Up HTTPS (Caddy, 5 minutes)

This is optional but highly recommended. Caddy automatically sets up HTTPS with Let's Encrypt (free certificates).

```bash
# SSH into server
ssh root@192.0.2.1

# Install Caddy
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl https://dl.filippo.io/caddy/pkg | bash

# Create Caddyfile
cat > /etc/caddy/Caddyfile <<'EOF'
respond.yourtown.gov {
    reverse_proxy localhost:3000 {
        header_upstream X-Forwarded-Proto {scheme}
        header_upstream X-Forwarded-Host {host}
    }
    encode gzip
}
EOF

# Replace respond.yourtown.gov with your actual domain

# Start Caddy
systemctl enable caddy
systemctl start caddy

# Check status
systemctl status caddy
```

Caddy automatically provisions a free SSL certificate from Let's Encrypt and handles HTTPS. Done.

Now you can access it at `https://respond.yourtown.gov` (secure!).

### Step 8: Create Admin and Test

Back on your computer:

1. Open browser, go to `https://respond.yourtown.gov` (or your IP)
2. You should see login screen
3. Check server logs for admin credentials: `docker compose logs app | grep -i "admin\|password"`
4. Or create admin manually:

```bash
# SSH into server
ssh root@192.0.2.1
cd /home/constituent-response

# Create admin user
docker compose exec app npm run create:admin -- --email=admin@yourtown.gov --password=InitialPassword123
```

5. Log in with those credentials
6. Change your password immediately (go to your profile)
7. Follow ADMIN-GUIDE.md "Small City Quick Setup" to configure departments and invite staff

### That's It

You now have a production Constituent Response instance running on a $6/month server with a domain and HTTPS. Total cost per month: $6-12 (server + optional domain).

---

## Do I Need a Domain Name?

**Short answer: No, but yes.**

### No Domain (IP Address Only)

**Cost:** $0/year (besides the server)
**Access:** `http://192.0.2.1:3000` or `https://192.0.2.1:3000`
**Looks like:** Technical, less professional
**Works fine for:** Internal city use (staff know the IP)

### With Domain

**Cost:** $10/year from Cloudflare, GoDaddy, Namecheap, etc.
**Access:** `https://respond.yourtown.gov`
**Looks like:** Professional, city-branded
**Works great for:** Giving to constituents, sharing with elected officials

### Domain Setup in 5 Steps (using Cloudflare free DNS)

1. **Register domain:**
   - Go to https://www.cloudflare.com/domain-registration
   - Search `yourtown.gov` (or `respond.yourtown.gov` if main domain is elsewhere)
   - Cost: $10-15/year
   - Buy it

2. **Add A Record:**
   - Log into Cloudflare
   - Go to DNS
   - Click "Add Record"
   - **Type:** A
   - **Name:** respond
   - **IPv4 Address:** 192.0.2.1 (your server IP)
   - **TTL:** Auto
   - **Proxy status:** DNS only (gray cloud, not orange)
   - Click Save

3. **Wait for propagation:**
   - Test with: `dig respond.yourtown.gov`
   - Or just wait 5 minutes and try accessing it

4. **Set up HTTPS (Caddy):**
   - Follow Step 7 above
   - Caddy handles everything automatically

5. **You're done**
   - You now have `https://respond.yourtown.gov` with automatic HTTPS

**Why Cloudflare?** Free DNS, free DDOS protection, easy interface. You don't need paid features.

---

---

## Prerequisites

Before deploying, ensure you have:

| Tool | Minimum | Recommended | Check Command |
|------|---------|-------------|----------------|
| **Docker** | 20.10 | 24.0+ | `docker --version` |
| **Docker Compose** | 1.29 | 2.20+ | `docker-compose --version` |
| **Git** | 2.20 | 2.40+ | `git --version` |
| **PostgreSQL** | 14 | 16+ | `psql --version` (if local) |
| **Redis** | 6.0 | 7.0+ | `redis-cli --version` (if local) |

### System Requirements and Cost Summary

| Resource | Minimum | Recommended | Notes |
|----------|---------|-------------|-------|
| **CPU** | 1 vCPU | 2 vCPU | 1 vCPU fine for small cities; 2+ for 100+ cases/day |
| **RAM** | 1GB + swap | 4GB | 1GB works with 2GB swap (see $6/mo setup). Add 512MB per additional city |
| **Disk** | 20GB | 50GB | PostgreSQL grows ~100MB per 10K cases |
| **Bandwidth** | 10 Mbps | 50 Mbps | Depends on signal volume |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS | Debian 11+ also supported |

### Deployment Cost Quick Reference

| Scenario | Server Cost | Domain | Email | AI | Total/Month |
|----------|:-:|:-:|:-:|:-:|:-:|
| **Try it free (your computer)** | Free | — | — | — | $0 |
| **Small city ($6/mo VPS)** | $6 | $0.83/mo* | $0 | $0 | $6-7 |
| **Small city + domain** | $6 | $0.83/mo* | $0 | $0 | $6-7 |
| **Small city + AI** | $6 | $0.83/mo* | $0 | $2-5 | $8-12 |
| **Medium city ($12/mo VPS)** | $12 | $0.83/mo* | $0-10 | $0-10 | $12-32 |
| **High volume (AWS)** | $50+ | $0.83/mo* | $0-20 | $10-50 | $60-70+ |

*$10/year domain ÷ 12 months = $0.83/month

**Note:** DigitalOcean, Vultr, Linode all offer $6/month servers with 1GB RAM. With 2GB swap, this runs perfectly for small cities. Tested with up to 5,000 requests/year without issues.

### Pre-Deployment Checklist

- [ ] Domain name registered (for production)
- [ ] SMTP credentials obtained (email sending)
- [ ] SSL certificate (or using Let's Encrypt)
- [ ] API keys for AI provider (optional)
- [ ] Firewall rules allowing 80, 443, and SSH (22)
- [ ] Backup strategy defined

---

## Quick Deploy with Docker Compose

This is the fastest way to get running. Use this for single-server deployments (10-50K cases/year).

### 1. Prepare the Server

**For Ubuntu/Debian:**

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install required tools
sudo apt-get install -y curl git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (v2)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**For existing Docker installations:**

```bash
# Verify Docker daemon is running
docker ps

# If not running:
sudo systemctl start docker
sudo systemctl enable docker  # Auto-start on reboot
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/constituent-response.git
cd constituent-response

# Copy environment file
cp .env.example .env

# Generate secrets (IMPORTANT: use these, not placeholders!)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -hex 32)

# Edit .env with your values
nano .env
# Or use sed if you prefer:
# sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
```

### 3. Essential .env Configuration

```bash
# ===== DEPLOYMENT MODE =====
DEPLOYMENT_MODE=single-tenant
NODE_ENV=production
LOG_LEVEL=info

# ===== DATABASE (Docker Compose will start PostgreSQL for you) =====
DATABASE_URL=postgresql://postgres:YOUR_SECURE_DB_PASSWORD@postgres:5432/constituent_response?schema=public
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD
DB_NAME=constituent_response

# ===== REDIS (Docker Compose will start Redis for you) =====
REDIS_URL=redis://:YOUR_SECURE_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# ===== AUTHENTICATION =====
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_FROM_OPENSSL
NEXTAUTH_URL=https://respond.yourdomain.com
APP_URL=https://respond.yourdomain.com

# ===== EMAIL (SMTP) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # NOT your Gmail password
SMTP_FROM=noreply@yourdomain.com

# ===== AI PROVIDER =====
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4-turbo

# ===== TRANSPARENT CITY INTEGRATION =====
TC_API_KEY=tc-your-api-key-here
TC_WEBHOOK_SECRET=whs-your-webhook-secret-here
```

**Security Notes:**
- Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- Use strong database/Redis passwords (20+ characters, mix of types)
- Never commit .env to version control
- Rotate secrets every 90 days
- Store secrets in a secure location (password manager)

### 4. Customize docker-compose.yml (Optional)

Edit resource limits if needed:

```yaml
# docker-compose.yml
services:
  app:
    image: your-registry/constituent-response:latest
    memory: 2g  # Increase if needed
    memswap_limit: 2g

  postgres:
    memory: 1g
    memswap_limit: 1g

  redis:
    memory: 512m
    memswap_limit: 512m
```

### 5. Start Services

```bash
# Pull latest images
docker-compose pull

# Start all services (runs in background)
docker-compose up -d

# Watch the logs (Ctrl+C to exit)
docker-compose logs -f app

# Wait for "app_1 | ready - started server on 0.0.0.0:3000, url: http://localhost:3000"
```

### 6. Initialize Database

```bash
# Run database migrations
docker-compose exec -T app npm run db:push

# (Optional) Seed with test data
docker-compose exec -T app npm run db:seed
```

### 7. Verify Deployment

```bash
# Check all services are healthy
docker-compose ps

# Check app is responding
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# View application logs (last 50 lines)
docker-compose logs --tail=50 app

# Access the application
# In browser: http://localhost:3000 (or your domain)
```

---

## Cloud Deployment

### DigitalOcean Droplet ($12-24/month)

**Best for:** Small to medium cities, starting out, simple setup.

#### 1. Create Droplet

1. Go to DigitalOcean Control Panel
2. Click **Create** → **Droplets**
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** $12/month (2GB RAM, 1 vCPU, 50GB SSD)
   - **Region:** Closest to your city
   - **Authentication:** SSH key (recommended) or password
4. Click **Create Droplet**
5. Wait 1-2 minutes for droplet to be ready

#### 2. SSH Into Droplet

```bash
ssh root@your-droplet-ip

# Example:
ssh root@192.0.2.1
```

#### 3. Run Setup Script

Copy the script from [Quick Deploy](#quick-deploy-with-docker-compose) section above.

#### 4. Configure Firewall

```bash
# DigitalOcean CLI (if installed)
doctl compute firewall create \
  --name constituent-response \
  --inbound-rules "protocol:tcp,ports:22,sources:addresses:YOUR_IP" \
  --inbound-rules "protocol:tcp,ports:80" \
  --inbound-rules "protocol:tcp,ports:443" \
  --outbound-rules "protocol:tcp,ports:all"

# Or configure in DigitalOcean Control Panel
# Inbound: SSH (22), HTTP (80), HTTPS (443)
# Outbound: All
```

#### 5. Set Up Domain

1. Add **A record** in your DNS provider:
   ```
   Type: A
   Name: respond
   Value: your-droplet-ip
   TTL: 3600
   ```

2. Wait 5-30 minutes for DNS to propagate:
   ```bash
   dig respond.yourdomain.com
   ```

#### 6. Set Up HTTPS (Using Caddy)

See [Reverse Proxy with Caddy](#reverse-proxy-with-caddy) section below.

#### DigitalOcean Estimated Costs

```
Droplet (2GB, 1 vCPU):    $12/month
Transfer bandwidth:        Included (1TB/month)
AI API calls (optional):   $5-20/month
SMTP (optional):          $0-10/month
---
Total:                    $17-42/month
```

---

### AWS EC2 + RDS + ElastiCache

**Best for:** High volume (100K+ cases/year), requiring managed databases.

#### 1. Create EC2 Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --region us-east-1

# Or use AWS Console: EC2 → Launch Instance
# Choose: Ubuntu 22.04 LTS, t3.medium, 30GB gp3
```

#### 2. Create RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier constituent-response-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 16 \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --publicly-accessible false \
  --backup-retention-period 30
```

#### 3. Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id constituent-response-redis \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.small \
  --num-cache-nodes 1
```

#### 4. Deploy Application on EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow Quick Deploy steps but update .env:
DATABASE_URL=postgresql://postgres:PASSWORD@your-rds-endpoint:5432/constituent_response?schema=public
REDIS_URL=redis://your-elasticache-endpoint:6379
```

#### AWS Estimated Costs

```
EC2 t3.medium:           $30/month
RDS PostgreSQL:          $25-50/month
ElastiCache Redis:       $15-25/month
Data transfer:           $5-20/month
AI API calls (optional): $5-20/month
---
Total:                   $80-165/month
```

---

### Google Cloud Run + Cloud SQL

**Best for:** Serverless, pay-per-use, managed infrastructure.

#### 1. Enable Required APIs

```bash
gcloud services enable run.googleapis.com sql-component.googleapis.com redis.googleapis.com
```

#### 2. Create Cloud SQL PostgreSQL

```bash
gcloud sql instances create constituent-response \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --backup
```

#### 3. Create Redis Instance

```bash
gcloud redis instances create constituent-response \
  --region=us-central1 \
  --size=1 \
  --redis-version=7.0
```

#### 4. Build and Push Docker Image

```bash
# Build
docker build -t gcr.io/your-project/constituent-response .

# Push to Google Container Registry
docker push gcr.io/your-project/constituent-response
```

#### 5. Deploy to Cloud Run

```bash
gcloud run deploy constituent-response \
  --image=gcr.io/your-project/constituent-response \
  --platform=managed \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=1 \
  --set-env-vars="DATABASE_URL=<cloud-sql-url>,REDIS_URL=<redis-url>,NODE_ENV=production" \
  --allow-unauthenticated
```

#### Google Cloud Estimated Costs

```
Cloud Run (pay-per-request): $0.40 per 1M requests (~$10-30/month)
Cloud SQL:                   $9-20/month
Redis:                       $15-25/month
Data transfer:               $0 (within cloud)
AI API calls (optional):     $5-20/month
---
Total:                       $29-95/month
```

---

## Reverse Proxy Configuration

A reverse proxy handles HTTPS termination and forwards requests to your app.

### Reverse Proxy with Caddy (Recommended)

Caddy automatically manages SSL certificates from Let's Encrypt.

#### 1. Install Caddy

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl https://dl.filippo.io/caddy/pkg | sudo bash
sudo apt-get install -y caddy
```

#### 2. Create Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

```
respond.yourdomain.com {
    reverse_proxy localhost:3000 {
        # Keep-alive connections
        header_upstream Connection "upgrade"
        header_upstream Upgrade "websocket"
    }

    # Enable gzip compression
    encode gzip

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }

    # Rate limiting (optional)
    rate_limit /api/v1/* 100r/s

    # Cache static assets
    @static {
        path /_next/static/*
        path /favicon.ico
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}

# Redirect www to non-www (optional)
www.respond.yourdomain.com {
    redir https://respond.yourdomain.com{uri} permanent
}
```

#### 3. Start Caddy

```bash
# Start the service
sudo systemctl start caddy
sudo systemctl enable caddy  # Auto-start on reboot

# View status
sudo systemctl status caddy

# View logs
sudo journalctl -u caddy -f

# Verify HTTPS is working
curl https://respond.yourdomain.com/api/health
```

---

### Reverse Proxy with Nginx

If you prefer Nginx (more complex but highly configurable):

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/default
```

```nginx
upstream app {
    server localhost:3000;
}

server {
    listen 80;
    server_name respond.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name respond.yourdomain.com;

    # SSL certificates (from Certbot)
    ssl_certificate /etc/letsencrypt/live/respond.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/respond.yourdomain.com/privkey.pem;

    # Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Compression
    gzip on;
    gzip_types text/html text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## HTTPS Setup

### Using Let's Encrypt with Caddy (Automatic)

Caddy automatically provisions and renews certificates:

```bash
# Just use Caddy as shown above
# Certificates auto-renewed 30 days before expiry
# No manual action needed!
```

### Using Certbot (Manual)

If not using Caddy:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate (standalone mode, stops Nginx temporarily)
sudo certbot certonly --standalone -d respond.yourdomain.com

# Or if Nginx is running:
sudo certbot certonly --nginx -d respond.yourdomain.com

# Verify certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run

# Set up auto-renewal (runs daily)
sudo systemctl enable certbot.timer
```

### SSL/TLS Best Practices

```bash
# Check your SSL configuration
curl -I https://respond.yourdomain.com

# Use SSL Labs test
# Go to: https://www.ssllabs.com/ssltest/analyze.html?d=respond.yourdomain.com
```

---

## Database Migrations

Migrations happen automatically on app startup, but you can run them manually:

### Run Migrations

```bash
# Automatic (happens on docker-compose up)
docker-compose up -d

# Or run manually
docker-compose exec app npm run db:push

# View migration status
docker-compose exec app npm run db:status

# Seed test data (development only!)
docker-compose exec app npm run db:seed
```

### Create a New Migration

```bash
# After modifying schema.prisma
docker-compose exec app npm run db:migrate --name=add_new_field

# Verify migration works
docker-compose exec app npm run db:push
```

---

## Backup Procedures

Critical for production. Implement automated backups immediately.

### PostgreSQL Backup

#### Manual Backup

```bash
# Backup to file
mkdir -p /backups/database
docker-compose exec -T postgres pg_dump \
  -U postgres \
  -d constituent_response \
  -F c \
  > /backups/database/backup-$(date +%Y%m%d-%H%M%S).dump

# Verify backup
ls -lh /backups/database/

# Test restore (in separate test environment)
pg_restore -U postgres -d test_db /backups/database/backup-*.dump
```

#### Automated Daily Backup Script

```bash
# Create backup script
sudo nano /usr/local/bin/backup-constituent-response.sh
```

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/database"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).dump"
LOG_FILE="/var/log/constituent-response-backup.log"
mkdir -p "$BACKUP_DIR"

{
    echo "Starting backup at $(date)"

    cd /home/ubuntu/constituent-response

    # Create backup
    docker-compose exec -T postgres pg_dump \
        -U postgres \
        -d constituent_response \
        -F c \
        -f "$BACKUP_FILE"

    # Compress
    gzip "$BACKUP_FILE"

    # Keep only last 30 days (delete older backups)
    find "$BACKUP_DIR" -name "*.dump.gz" -mtime +30 -delete

    # Upload to S3 (optional, requires AWS CLI configured)
    # aws s3 cp "$BACKUP_FILE.gz" "s3://your-backup-bucket/constituent-response/"

    echo "Backup completed: ${BACKUP_FILE}.gz"
    echo "Backup size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"

} >> "$LOG_FILE" 2>&1
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-constituent-response.sh

# Test it
sudo /usr/local/bin/backup-constituent-response.sh

# Add to crontab (runs daily at 2 AM)
(sudo crontab -l 2>/dev/null || echo "") | \
  (cat; echo "0 2 * * * /usr/local/bin/backup-constituent-response.sh") | \
  sudo crontab -

# Verify cron job
sudo crontab -l
```

### Redis Backup

```bash
# Manual backup
docker-compose exec redis redis-cli BGSAVE

# Copy dump file
docker-compose cp redis:/data/dump.rdb /backups/redis/dump-$(date +%Y%m%d).rdb

# Automated backup (add to cron)
docker-compose exec redis redis-cli BGSAVE && \
  docker-compose cp redis:/data/dump.rdb /backups/redis/dump-$(date +%Y%m%d-%H%M%S).rdb
```

### Restore from Backup

```bash
# IMPORTANT: Stop the app first
docker-compose down

# Restore PostgreSQL from dump
docker-compose exec postgres pg_restore \
  -U postgres \
  -d constituent_response \
  -F c \
  /backups/database/backup-20240115-020000.dump

# Or from SQL file
docker-compose exec postgres psql \
  -U postgres \
  -d constituent_response \
  -f /backups/database/backup-20240115.sql

# Restart
docker-compose up -d

# Verify data
curl http://localhost:3000/api/health
```

---

## Updating

Keep your deployment up to date with the latest features and security patches.

### Check for Updates

```bash
# View latest release
curl -s https://api.github.com/repos/your-org/constituent-response/releases/latest | jq '.tag_name'

# Or check release notes at:
# https://github.com/your-org/constituent-response/releases
```

### Perform Update

```bash
# Pull latest code
cd /home/ubuntu/constituent-response
git pull origin main

# Pull latest Docker images
docker-compose pull

# Start with new images (includes migration)
docker-compose up -d

# Watch logs to ensure successful startup
docker-compose logs -f app

# Verify health
curl http://localhost:3000/api/health

# Verify no errors
docker-compose logs --tail=50 app | grep -i error
```

### Zero-Downtime Update (Advanced)

For production, use rolling updates:

```bash
# 1. Pull new images
docker-compose pull

# 2. Run migrations in separate container (before stopping app)
docker-compose run --rm app npm run db:push

# 3. Restart app with new image (Caddy continues serving)
docker-compose up -d app

# 4. Check logs
docker-compose logs -f app
```

### Rollback (If Something Goes Wrong)

```bash
# Restore from backup (see Restore section above)
# Or revert to previous version:
git checkout v1.0.0  # or previous tag
docker-compose pull
docker-compose up -d
```

---

## Monitoring

Proactive monitoring catches issues before they become critical.

### Health Check Endpoint

```bash
# App exposes health check
curl https://respond.yourdomain.com/api/health

# Expected response: {"status":"ok","timestamp":"2024-01-16T14:30:00Z"}
```

### Configure Monitoring Service

**Using Uptime Robot (free):**
1. Go to https://uptimerobot.com
2. Create monitor: `https://respond.yourdomain.com/api/health`
3. Set check frequency: every 5 minutes
4. Set alerts: email + SMS

**Using Prometheus (self-hosted):**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'constituent-response'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f worker

# Last 100 lines with timestamps
docker-compose logs --tail=100 -t app

# Filter for errors only
docker-compose logs app | grep -i error

# Follow logs with grep filtering
docker-compose logs -f app | grep -i "signal\|error\|warning"
```

### Monitor Disk Usage

```bash
# Check Docker usage
docker system df

# Check filesystem
df -h

# Find large files/directories
du -sh /home/ubuntu/constituent-response/*
du -sh /backups/*

# Clean up old Docker images (if needed)
docker system prune -a  # WARNING: Removes unused images!
```

### Monitor Database

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d constituent_response

# Check database size
SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname = 'constituent_response';

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT count(*) as connection_count FROM pg_stat_activity;

# Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start as duration, query
FROM pg_stat_activity WHERE query != '<IDLE>'
ORDER BY duration DESC;
```

### Monitor Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check memory usage
INFO memory

# Check key count
DBSIZE

# Check queue lengths (BullMQ jobs)
LLEN bull:case-processing:jobs
LLEN bull:email-sending:jobs
LLEN bull:ai-drafting:jobs

# Monitor in real-time
MONITOR
```

### Database Backups Are Running

```bash
# Check backup log
tail -f /var/log/constituent-response-backup.log

# List recent backups
ls -lh /backups/database/ | head -10

# Verify backup integrity
gunzip -t /backups/database/backup-*.dump.gz && echo "Backups OK"
```

---

## Troubleshooting

Common issues and solutions.

| Symptom | Cause | Solution |
|---------|-------|----------|
| **App won't start** | Invalid environment variables | Check `.env` file, verify all required vars are set, check `docker-compose logs app` |
| **Database connection refused** | PostgreSQL not running or wrong credentials | Run `docker-compose ps`, verify `DATABASE_URL` in `.env`, check `docker-compose logs postgres` |
| **Email not sending** | SMTP credentials wrong | Verify SMTP settings in `.env`, check sender address, test with `docker-compose logs worker` |
| **Cases not appearing** | API key or webhook secret wrong | Verify `TC_API_KEY` and `TC_WEBHOOK_SECRET`, check `docker-compose logs worker` for processing logs |
| **High memory usage** | Memory leak or misconfiguration | Check `docker stats`, reduce cache size, restart services |
| **Slow response times** | Database query slow | Run slow query analysis (see Monitor Database above), check database size, add indices if needed |
| **SSL certificate errors** | Certificate expired or misconfigured | Run `certbot renew`, check `docker-compose logs proxy` if using proxy |
| **Backup failing** | Permission denied or disk full | Check `/backups` directory permissions, check disk space with `df -h`, ensure script is executable |

### Services Won't Start

```bash
# Check if ports are in use
sudo netstat -tlnp | grep -E ":3000|:5432|:6379"

# Kill process on specific port if needed
sudo lsof -ti:3000 | xargs kill -9

# Check Docker logs
docker-compose logs

# Check system resources
free -h  # Memory
df -h    # Disk

# Restart Docker if needed
sudo systemctl restart docker
docker-compose up -d
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database exists
docker-compose exec postgres psql -U postgres -l

# Test connection string
docker-compose exec postgres psql -U postgres -d constituent_response -c "SELECT 1;"

# View PostgreSQL logs
docker-compose logs postgres
```

### Email Not Sending

```bash
# Test SMTP connection
docker-compose exec app npm run test:smtp

# Check email logs
docker-compose logs worker | grep -i "email\|smtp"

# Verify credentials
# For Gmail: Use App Password (not Gmail password)
# https://support.google.com/accounts/answer/185833

# Test sending email
docker-compose exec app npm run test:email --to=test@example.com
```

### Out of Memory

```bash
# Reduce memory usage
# In docker-compose.yml, reduce limits:
services:
  app:
    memory: 1g  # Reduce from 2g
  postgres:
    memory: 512m  # Reduce from 1g

# Restart
docker-compose down
docker-compose up -d

# Monitor usage
docker stats
```

### Slow Responses

```bash
# Check database query performance
docker-compose exec postgres psql -U postgres -d constituent_response

# In psql:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT query, calls, total_time, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

# Check if indices exist
\d "Case"  # View table structure and indices

# Add missing indices if needed
CREATE INDEX idx_case_city ON "Case"("cityId");
```

### API Key / Webhook Issues

```bash
# Check if API key exists
docker-compose exec postgres psql -U postgres -d constituent_response -c "SELECT * FROM \"ApiKey\";"

# Verify webhook secret in database
docker-compose exec postgres psql -U postgres -d constituent_response -c "SELECT * FROM \"Webhook\";"

# Manually test webhook
curl -X POST http://localhost:3000/api/v1/webhooks/newsletter \
  -H "Content-Type: application/json" \
  -H "X-TC-Api-Key: test-key" \
  -H "X-TC-Signature: sha256=test" \
  -d '{"citySlug":"sf","signalType":"FLAG"}'

# Check worker logs
docker-compose logs worker | grep "process-signal"
```

### Permission Denied Errors

```bash
# Fix ownership of files
sudo chown -R ubuntu:ubuntu /home/ubuntu/constituent-response

# Fix backup directory permissions
sudo mkdir -p /backups/database
sudo chmod 755 /backups/database

# Fix cron script permissions
sudo chmod +x /usr/local/bin/backup-constituent-response.sh
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Find large files
du -sh /home/ubuntu/constituent-response/*
du -sh /backups/*
du -sh /var/lib/docker/*

# Clean up old backups
rm -f /backups/database/backup-*.gz  # Keep only recent backups

# Clean Docker images
docker system prune -a  # WARNING: Removes all unused images!

# Compress old logs
gzip /var/log/*.log
```

---

## Production Checklist

Before going live:

- [ ] SSL certificate installed and working
- [ ] Automated daily backups configured and tested
- [ ] Backup restore tested (full dry-run)
- [ ] Monitoring and alerting configured
- [ ] Database query performance acceptable
- [ ] Email sending tested
- [ ] API key and webhook secret configured
- [ ] Admin user created with strong password
- [ ] First department and staff users created
- [ ] Logo and branding configured
- [ ] Email templates customized
- [ ] SLA policies set appropriately
- [ ] Firewall rules configured
- [ ] SSH key-based auth only (no password)
- [ ] Fail2ban or similar configured (optional)
- [ ] Regular security updates scheduled
- [ ] Incident response plan documented

---

## Next Steps

1. **Configure Admin**: See [ADMIN-GUIDE.md](./ADMIN-GUIDE.md)
2. **Set Up Integrations**: See [NEWSLETTER-INTEGRATION.md](./NEWSLETTER-INTEGRATION.md)
3. **Enable AI**: See [AI-CONFIGURATION.md](./AI-CONFIGURATION.md)
4. **Monitor**: See [Monitoring](#monitoring) section above
5. **Train Staff**: See [STAFF-GUIDE.md](./STAFF-GUIDE.md)

---

**Last Updated:** March 2026 | **Reviewed:** Every 30 days

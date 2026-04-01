# Constituent Response

**Open-source resident communications for cities of any size. Whether you have 3 staff or 300.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square)](https://www.postgresql.org/)
[![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=flat-square)](./CHANGELOG.md)

<!-- TODO: Add a hero screenshot or GIF of the staff dashboard here -->
<!-- Example: ![Constituent Response Dashboard](./docs/assets/dashboard-screenshot.png) -->

---

## Table of Contents

- [Who This Is For](#who-this-is-for)
- [The Real Problem](#the-real-problem)
- [What It Does](#what-it-does-the-simple-version)
- [What It Looks Like](#what-it-looks-like)
- [Quick Start](#quick-start-three-paths)
- [But We're a Small City...](#but-were-a-small-city)
- [Real-World Sizing Examples](#real-world-sizing-examples)
- [Architecture](#architecture-at-a-glance)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation-by-role)
- [System Requirements](#system-requirements)
- [Deployment Options](#deployment-options)
- [Contributing](#contributing)
- [License](#license)

---

## Who This Is For

You're a city or town manager, administrator, or IT staff member. Your team is handling constituent requests across email, spreadsheets, and maybe a 311 platform. It's disorganized. Council members ask "what are people asking about?" and you don't have a quick answer. You need something that works for a small staff without breaking the bank.

**This is for you.** Whether your town has 2,000 people or 250,000, Constituent Response scales down (or up).

---

## The Real Problem

Right now, your team probably:

- **Answers emails in different inboxes** (city email, council member forwards, 311 notifications)
- **Tracks nothing systematically.** Maybe a spreadsheet that's never quite up to date
- **Has no visibility** into what people actually care about. Council asks, you guess
- **Spends hours organizing instead of helping.** Staff forwards emails, copies notes into multiple places
- **Can't find old requests.** Someone asks about a request from 6 months ago. Where was that email?
- **Struggles with FOIA requests.** You need to pull records, redact internal notes, hope you didn't miss anything
- **Can't show progress to council.** No dashboard, no metrics, no story about "we helped 150 residents this month"

Constituent Response fixes all of this.

---

## What It Does (The Simple Version)

| What | How It Helps |
|------|--------------|
| **One inbox for all requests** | Email, web forms, newsletter flags, 311 integrations — all in one place |
| **Automatic case tracking** | Every request gets a case ID, status, who's handling it, when it's due |
| **Response templates** | Draft a response once, use it 10 times (with AI suggestions if you want) |
| **Council dashboard** | One-page view: how many people contacted us, about what, and how fast we responded |
| **FOIA-ready exports** | Click one button, get all public records with internal notes stripped out |
| **Team visibility** | Everyone sees who's handling what, nothing falls through cracks |
| **SLA tracking** | Set response deadlines by department or case type, with automatic escalation alerts |

---

## What It Looks Like

<!-- TODO: Replace each description below with an actual screenshot -->

**Staff Inbox**
<!-- ![Staff Inbox](./docs/assets/inbox-screenshot.png) -->
List of incoming requests, newest first. Each shows: requester name, request title, how long it's been waiting, status. Click to open full details and respond. Bulk actions for assigning, closing, and exporting.

**Response Composer**
<!-- ![Response Composer](./docs/assets/composer-screenshot.png) -->
Constituent's request on the left, your response on the right. Templates as suggestions. Optional AI-drafted alternatives. Every response saved for future reference.

**Council Dashboard**
<!-- ![Council Dashboard](./docs/assets/council-dashboard-screenshot.png) -->
Metrics at top (requests this week, avg response time, trending topics). Visual breakdown of categories. One-click export to PDF for council meetings. Read-only, no overwhelming features.

---

## Quick Start: Three Paths

### Path 1: Fastest setup (3 minutes)
```bash
curl -fsSL https://constituent-response.io/setup.sh | bash
# Answer 3 questions (city name, AI yes/no, recovery email)
# Visit https://yourdomain.com
```

### Path 2: Full control (Docker, 15 minutes)
```bash
git clone https://github.com/transparentcity/constituent-response.git
cd constituent-response
cp .env.example .env

# Generate a secure secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env

# Start everything
docker-compose up -d
sleep 45
docker-compose exec -T app npm run db:push
docker-compose exec -T app npm run db:seed

# Access at http://localhost:3000
# Demo login: admin@demo.local / password123
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production setup with SSL, backups, and monitoring.

### Path 3: Hosted ($29/month)
Sign up at [Transparent City](https://transparentcity.com). They handle updates, backups, SSL certificates. You get started in 5 minutes.

---

## But We're a Small City...

### "We don't have dedicated IT staff to deploy Docker containers."

**You don't need to.** The setup script asks three questions and automates everything. Or use the [hosted version](https://transparentcity.com) — $29/month, zero maintenance.

### "We can't afford another software subscription."

Self-hosted on a basic VPS:

| City Size | Weekly Volume | Cost/Month |
|-----------|---------------|-----------|
| Town (2K-10K people) | 5-20 requests | $6-12 |
| Small City (10K-50K) | 20-100 requests | $12-24 |
| Medium City (50K-250K) | 100-500 requests | $50-100 |
| Large City (250K+) | 500+ requests | $100-200+ |

**No per-user licensing.** Add 10 staff or 100 — same cost. AI is optional ($0-5/month).

### "Our team is just 3 people. This seems like overkill."

Set `SIMPLE_MODE=true` and the interface strips down to: Cases, Templates, and Inbox. Everything else hides until you need it. Turn on advanced features one at a time as you grow.

### "AI writing government responses makes us nervous."

AI is **off by default**. When enabled: staff sees a draft, edits it, and clicks send. There's no auto-respond. Humans approve everything. Templates work great without AI.

### "We're using email and spreadsheets now. Migration seems hard."

Three options: (1) Import your CSV in 15 minutes, (2) run both systems in parallel while you train staff, or (3) migrate gradually — start with web forms, add email later. Nothing breaks.

### "Our council members won't learn a new tool."

The Elected Official Dashboard is one page: request count, response time, trending topics, and a button to export a one-page PDF. No training needed.

### "What if this project gets abandoned?"

Your data lives in standard PostgreSQL — export to CSV anytime. The code is MIT licensed. Built on Next.js, PostgreSQL, and Redis — any JavaScript developer can maintain it. No vendor lock-in.

### "Is this actually secure enough for government use?"

| Concern | How It's Addressed |
|---------|------------------|
| **Access control** | Role-based: Admin, Manager, Agent, Elected Official |
| **Audit logging** | Every action logged with timestamp, user, and details |
| **Internal notes** | Separated from public records, excluded from FOIA exports automatically |
| **Privacy** | GDPR/CCPA deletion built in |
| **Encryption** | HTTPS in transit, bcrypt passwords, signed webhooks |
| **Brute force** | Account locks after 5 failed attempts |

---

## Real-World Sizing Examples

### Town of 3,500 people
**Staff:** 2 people, part-time | **Volume:** 8-15 requests/week | **Cost:** $6-12/month | **AI:** Off
No more lost emails. Council gets a weekly one-pager. Everything searchable.

### City of 35,000 people
**Staff:** 8 people | **Volume:** 50-80 requests/week | **Cost:** $20-21/month | **AI:** $2-3/month
Cases auto-routed to the right department. Council members see district trends. Nothing missed.

### City of 150,000 people
**Staff:** 32 people | **Volume:** 200-400 requests/week | **Cost:** $60-120/month | **AI:** $10-20/month
Sophisticated routing, SLA management, detailed reporting. Still cheaper than one FTE salary.

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────┐
│                    Web Browser / Client                       │
└───────────────────┬──────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
    ┌───▼────────┐       ┌────▼──────┐
    │ tRPC API   │       │  REST API  │
    │ (Internal) │       │  (Public)  │
    └───┬────────┘       └────┬──────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────┐
        │ Next.js App Server      │
        │ (App Router, auth, etc) │
        └──────────┬──────────────┘
                   │
        ┌──────────┴────────┬──────────┐
        │                   │          │
    ┌───▼──────┐    ┌──────▼──┐  ┌───▼──┐
    │ Prisma   │    │  Redis  │  │ AI   │
    │ ORM →    │    │  Queue  │  │ APIs │
    │ PostgreSQL│    │ (BullMQ)│  │      │
    └──────────┘    └────┬────┘  └──────┘
                         │
                    ┌────▼──────┐
                    │  Worker   │
                    │ (BullMQ)  │
                    └───────────┘
```

Requests come in through web forms or API. They queue up in Redis. Workers process them (send emails, generate AI drafts, update statuses). PostgreSQL keeps everything organized.

For deeper technical details, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15, React 19, TypeScript | Fast, modern, full-stack JavaScript |
| **Backend** | Next.js App Router, tRPC | Type-safe API, built-in edge functions |
| **Database** | PostgreSQL 16 | ACID compliance, full-text search, JSON support |
| **Cache/Queue** | Redis + BullMQ | Background jobs (email, AI, webhooks) |
| **Auth** | NextAuth.js + bcryptjs | Flexible, battle-tested, no vendor lock-in |
| **AI** | OpenAI or Anthropic APIs | Optional, off by default |

Built on proven technology used by thousands of organizations. No experimental frameworks.

---

## Documentation by Role

### For City IT Managers & Administrators

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment, cloud platforms, SSL, backups | 20 min |
| [CONFIGURATION.md](./docs/CONFIGURATION.md) | Environment variables, secrets, feature flags | 15 min |
| [ADMIN-GUIDE.md](./docs/ADMIN-GUIDE.md) | First-time setup, users, departments, SLAs | 30 min |
| [SECURITY.md](./docs/SECURITY.md) | Authentication, authorization, audit logging, compliance | 25 min |
| [MONITORING.md](./docs/MONITORING.md) | Health checks, logging, alerting, troubleshooting | 15 min |

<!-- Note: Create docs/MONITORING.md if it doesn't exist yet -->

### For City Staff & Response Teams

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [STAFF-GUIDE.md](./docs/STAFF-GUIDE.md) | Dashboard, inbox, cases, responding, templates | 20 min |
| [AI-CONFIGURATION.md](./docs/AI-CONFIGURATION.md) | Using AI drafts, tone settings, best practices | 10 min |

### For Elected Officials

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [ELECTED-OFFICIAL-GUIDE.md](./docs/ELECTED-OFFICIAL-GUIDE.md) | Dashboard, metrics, exporting reports | 10 min |
| [PUBLIC-RECORDS.md](./docs/PUBLIC-RECORDS.md) | FOIA compliance, internal notes, audit trails | 20 min |

### For Integrations & APIs

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [NEWSLETTER-INTEGRATION.md](./docs/NEWSLETTER-INTEGRATION.md) | Transparent City webhook setup, signal processing | 15 min |
| [INTEGRATION-311.md](./docs/INTEGRATION-311.md) | Outbound webhooks to 311/CRM systems | 15 min |
| [API.md](./docs/API.md) | REST API reference with curl examples | 25 min |

### For Developers

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, data flow, scaling strategy | 25 min |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Dev setup, project structure, code standards, Git workflow | 30 min |
| [DEPLOYMENT-MULTITENANT.md](./docs/DEPLOYMENT-MULTITENANT.md) | Multi-tenant mode, tenant provisioning, isolation | 20 min |

### Quick Reference

[FAQ.md](./docs/FAQ.md) - 30+ Q&A covering common questions from all roles.
[DATA-PORTABILITY.md](./docs/DATA-PORTABILITY.md) - Exports, imports, GDPR/CCPA compliance.
[MULTILINGUAL.md](./docs/MULTILINGUAL.md) - Language support and translations.

---

## System Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **CPU** | 1 vCPU | 2 vCPU | More for high volume (100+ cases/day) |
| **Memory** | 2GB RAM | 4GB RAM | Add 512MB per additional city in multi-tenant |
| **Disk** | 20GB | 50GB | PostgreSQL grows ~100MB per 10K cases |
| **Database** | PostgreSQL 14 | PostgreSQL 16 | ACID compliance required |
| **Cache/Queue** | Redis 6.0 | Redis 7.0+ | For background jobs |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04+ | Any Linux; tested on Debian/Ubuntu |
| **Docker** | 20.10+ | Latest | For containerized deployment |

---

## Deployment Options

| Option | Best For | Cost | Setup Time |
|--------|----------|------|-----------|
| **Setup script** | Small cities, no IT staff | $6-24/mo | 3 minutes |
| **Docker** | Comfortable with command line | $6-24/mo | 15 minutes |
| **Transparent City hosted** | Zero maintenance | $29/mo | 5 minutes |
| **AWS/GCP/Azure** | Large cities, managed services | $50-200+/mo | 30-60 minutes |
| **On-premises** | Complete control, own hardware | One-time + time | 30+ minutes |

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions on each option.

---

## Contributing

This project is built by cities, for cities. If you've made a useful change — a new template type, a bug fix, a new integration — consider contributing it back so other cities benefit.

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development environment setup, code standards, and the PR process.

---

## License

MIT License. Use, modify, and deploy however you want. No fees, no permissions needed. See [LICENSE](./LICENSE) for full text.

---

**Last Updated:** March 2026 | **Version:** 1.0.0 | **Maintained by:** The Transparent City community

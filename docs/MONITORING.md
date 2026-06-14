# Monitoring

How to tell whether a Constituent Response deployment is healthy, where to look
when it isn't, and what to alert on. Aimed at the IT or ops person running the app.

## Health checks

- **App liveness**: the Next.js server responds on its configured port. Put a
  load-balancer or uptime check against a lightweight public route (for example
  the status page) and treat a non-200 as down.
- **Database**: Postgres reachable and migrations applied. `npx prisma migrate status`
  should report the schema is up to date. A failed connection here takes the whole
  app down, so alert on it first.
- **Redis / queue**: the BullMQ worker depends on Redis. Confirm Redis is reachable
  and the `worker` process (`npm run worker`) is running. A stalled worker means
  background jobs (signal processing, SLA checks, notifications) silently stop.
- **Outbound email**: nodemailer transport credentials valid. Send a periodic test
  message or watch for a spike in send failures.

## Logging

- Application logs go to stdout/stderr; capture them with your platform's log
  drain (Docker logs, Railway, journald, etc.).
- Worker logs are separate from the web process. Collect both.
- Log at info in production; raise to debug only while troubleshooting, since
  request payloads may contain constituent PII.

## Alerting

Alert, in priority order, on: database unreachable, web process down, worker
process down or queue backlog growing, email send-failure rate climbing, and
error-rate or 5xx spikes. Page on the first three; the rest can be warnings.

## Troubleshooting

- **Jobs not processing**: check the worker process is alive and Redis is reachable;
  inspect the BullMQ queue for stuck or failed jobs.
- **Logins failing**: verify `NEXTAUTH_SECRET`/auth env vars and that the database
  `User`/session tables are migrated.
- **Emails not arriving**: check nodemailer transport config and the email provider's
  logs; confirm the from-domain is authorized (SPF/DKIM).
- **Slow pages**: check database query latency and that Postgres has appropriate
  indexes; review the `recharts`/dashboard pages for large unbounded queries.

> This document is a starting point. Expand each section with the specifics of your
> chosen host (Railway, Docker, bare metal) as you operationalize a deployment.

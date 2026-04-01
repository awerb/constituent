# Transparent City Newsletter Integration

This guide explains how to connect Transparent City newsletters to Constituent Response so that constituent flags and applause become support cases.

## How It Works

```
1. Resident views newsletter in Transparent City
2. Resident clicks "Flag this item" or "I applaud this"
3. Transparent City records signal and webhook
4. Sends webhook to Constituent Response
5. Creates case or applause record
6. Staff responds to case
7. Response sent back to Transparent City (optional)
```

## Setup

### 1. Get Your API Key

Contact Transparent City support or generate in your TC account:

```
API Key format: tc-xxxxxxxxxxxxx
Keep this secret - don't share in code or emails
```

### 2. Get Your Webhook Secret

```
Webhook Secret format: whs-xxxxxxxxxxxxxxx
Used to verify that webhooks actually come from Transparent City
Keep this secret too
```

### 3. Configure Constituent Response

Add to your `.env` file:

```bash
# In production, use actual Transparent City credentials
TC_API_KEY=tc-your-api-key-here
TC_WEBHOOK_SECRET=whs-your-webhook-secret-here
```

### 4. Register Webhook URL

In Transparent City dashboard:

1. Go to **Settings > Integrations**
2. Select **Constituent Response** (if available) or **Custom Webhook**
3. Enter webhook URL: `https://your-domain.com/api/v1/webhooks/newsletter`
4. Paste your webhook secret
5. Enable: `On signal (flag/applaud)` events
6. Test webhook (TC will send a test signal)
7. Save

### 5. Verify Connection

```bash
# Check that signals are being received
docker-compose logs -f worker | grep "process-signal"

# Or check database
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT * FROM "NewsletterSignal" ORDER BY "createdAt" DESC LIMIT 5;
EOF
```

## Signal Types

### FLAG

Constituent has a concern or problem with the item.

```json
{
  "signalType": "FLAG",
  "constituentEmail": "alice@example.com",
  "note": "This pothole is dangerous"
}
```

Action: Creates a **Case** in your system with status `NEW`.

### APPLAUD

Constituent approves or supports the item.

```json
{
  "signalType": "APPLAUD",
  "constituentEmail": "bob@example.com",
  "note": "Great initiative!"
}
```

Action: Records **positive feedback** (counted for elected official reports).

## Webhook Format Specification

### Inbound Webhook from Transparent City

**Endpoint**: `POST /api/v1/webhooks/newsletter`

**Headers**:
```
Content-Type: application/json
X-TC-Api-Key: tc-your-api-key
X-TC-Signature: sha256=calculated-signature
```

**Body**:
```json
{
  "citySlug": "sf",
  "constituentEmail": "alice@example.com",
  "constituentName": "Alice Smith",
  "newsletterExternalId": "bill-2024-001",
  "newsletterTitle": "Golden Gate Park Renovation Bill",
  "newsletterSummary": "Proposed $50M renovation of Golden Gate Park",
  "topicTags": ["parks", "environment", "budget"],
  "sourceUrl": "https://transparentcity.co/sf/bills/2024-001",
  "transparentCityDataUrl": "https://data.transparentcity.co/sf/bills/2024-001",
  "signalType": "FLAG",
  "note": "Concerned about displacement of homeless populations",
  "noteLanguage": "en"
}
```

### What Constituent Response Does

```
1. Validates TC API key
2. Verifies HMAC signature
3. For FLAG signals:
   ├─ Find or create constituent
   ├─ Find or create case
   ├─ Set status = NEW
   ├─ Calculate SLA deadline (48 hours default)
   ├─ Assign to appropriate department
   └─ Send acknowledgment email to constituent
4. For APPLAUD signals:
   └─ Record positive feedback for reporting
```

## Testing

### Test Webhook Locally

```bash
# 1. Start local server
npm run dev

# 2. Generate test HMAC signature
BODY='{"citySlug":"sf","signalType":"FLAG",...}'
SECRET="test-secret"
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# 3. Send test webhook
curl -X POST http://localhost:3000/api/v1/webhooks/newsletter \
  -H "Content-Type: application/json" \
  -H "X-TC-Api-Key: test-api-key" \
  -H "X-TC-Signature: sha256=$SIGNATURE" \
  -d "$BODY"

# 4. Check response
# Should return 202 Accepted with signalId

# 5. Monitor background worker
docker-compose logs -f worker | grep "process-signal"
```

### Test via Transparent City

In TC dashboard, go to **Integrations > Test Webhook**:

1. Select signal type (FLAG or APPLAUD)
2. Fill in test data
3. Click "Send Test"
4. Verify Constituent Response received it

Look for webhook delivery status in TC's integration logs.

## Common Issues

### Webhook not being received

1. Check that webhook URL is correct: `https://your-domain.com/api/v1/webhooks/newsletter`
2. Verify domain is publicly accessible (not localhost)
3. Check firewall allows inbound HTTPS traffic
4. Verify NEXTAUTH_URL in .env matches your domain

```bash
# Test endpoint is reachable
curl -v https://your-domain.com/api/v1/webhooks/newsletter

# Should return 405 (Method Not Allowed) or auth error
# Not a connection timeout
```

### Signature verification failing

1. Ensure `TC_WEBHOOK_SECRET` in .env matches TC dashboard
2. Verify secret was copied exactly (watch for extra spaces)
3. Check that secret hasn't changed in TC dashboard

```bash
# Verify in app logs
docker-compose logs app | grep "signature"
docker-compose logs app | grep "verification failed"
```

### Constituents not being created

1. Check that constituent email is valid
2. Verify city exists in database with matching slug

```bash
# Check if city exists
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT id, name, slug FROM "City";
EOF

# Check constituent records
SELECT * FROM "Constituent" WHERE "cityId" = 'your-city-id';
```

### Cases not being created

1. Verify at least one active department exists for city

```bash
# List departments
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT id, "cityId", name, slug, "isActive" FROM "Department";
EOF
```

2. Check SLA configuration

```bash
# View SLA defaults
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT * FROM "SlaConfig";
EOF
```

### Emails not sending

1. Verify SMTP configuration in .env
2. Check email logs

```bash
# View email queue
docker-compose logs worker | grep "send-acknowledgment"
docker-compose logs worker | grep "email"
```

3. Check email was actually sent

```bash
# Check sent emails table
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
SELECT "to", subject, "sentAt", status FROM "Email";
EOF
```

## Adjusting Response Behavior

### Change SLA Deadline

Default is 48 hours. To change per-department:

```bash
# Update SLA hours for a department
docker-compose exec postgres psql -U postgres -d constituent_response << EOF
UPDATE "Department"
SET "defaultSlaHours" = 24
WHERE slug = 'public-works';
EOF
```

### Change Department for Newsletter Items

By default, newsletter signals auto-assign to first active department. To change:

```typescript
// In src/server/services/signal-processor.ts
// Modify department assignment logic:

const determineDepart = async (signal) => {
  // Check if newsletter title contains keyword
  if (signal.topicTags.includes('parks')) {
    return await prisma.department.findFirst({
      where: { slug: 'parks-recreation' }
    });
  }
  // ... other routing rules
}
```

### Add Auto-Response Templates

Create templates that auto-apply to certain signal types:

```bash
# In admin UI, create template:
# Name: "Flag Acknowledgment"
# Applies to: FLAG signals from newsletters
# Content: "Thank you for flagging this item. Our team will review..."
```

### Filter Certain Signals

Some newsletters might have items you don't want to create cases for. Add filters:

```typescript
// In signal processing, check:
if (signal.topicTags.includes('spam')) {
  // Don't create case, just log signal
  return;
}
```

## Reporting

### Dashboard Metrics

Staff can see:
- Total flags received this week
- Average response time
- Most flagged topics
- Applause trends

```bash
# Query for reporting
SELECT
  signal_type,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt"))/3600) as avg_hours_to_resolve
FROM "Case"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY signal_type;
```

### Elected Official Report

Elected officials can see district-level:
- Number of flags in their district
- Most common topics
- Trends week-over-week
- But NOT constituent details or internal notes

## Disconnecting

To stop receiving webhooks from Transparent City:

1. Go to TC **Settings > Integrations**
2. Click **Constituent Response**
3. Click **Disable** or **Remove**
4. Confirm

Existing cases stay in your system. No data is deleted.

## Advanced: Bi-Directional Sync

(Optional) Send responses back to Transparent City so residents see their issue was addressed:

1. Enable in TC dashboard: **Integrations > Send updates back**
2. Constituent Response will POST to TC when case is resolved
3. Transparent City displays status update in newsletter archive

```json
{
  "referenceNumber": "CR-2024-00042",
  "status": "RESOLVED",
  "resolvedAt": "2024-01-16T14:45:00Z",
  "responseText": "We filled the pothole on Main St. Thank you for reporting!",
  "respondedBy": "Public Works Department"
}
```

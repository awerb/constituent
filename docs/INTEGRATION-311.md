# Outbound 311 Integration

This guide explains how to send case updates from Constituent Response back to your existing 311 system.

## Overview

Outbound webhooks let Constituent Response push updates to your existing systems:

```
Case created in Constituent Response
    ↓
Case assigned to staff member
    ↓ [webhook sent]
POST to your-311-system/api/case-update
    ↓
Your 311 tracks the case status
    ↓
Case resolved in Constituent Response
    ↓ [webhook sent]
POST to your-311-system/api/case-resolved
    ↓
Your 311 closes the case
```

## Configure Webhooks

### 1. Add Webhook URL in Admin UI

1. Go to **Admin > Integrations > Webhooks**
2. Click **Add Webhook**
3. Enter webhook URL: `https://your-311-system.com/api/case-updates`
4. Select events:
   - [x] Case status changed
   - [x] Case assigned
   - [x] Case resolved
5. (Optional) Set authentication method
6. Save

### 2. Test Webhook

```bash
# Admin UI has "Test" button
# Or manually from command line:

curl -X POST https://your-311-system.com/api/case-updates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-token" \
  -d '{
    "event": "case.statusUpdate",
    "referenceNumber": "CR-2024-00001",
    "data": {
      "status": "NEW"
    }
  }'
```

## Event Types

### case.statusUpdate

Fired when case status changes (NEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED).

**Payload**:

```json
{
  "event": "case.statusUpdate",
  "timestamp": "2024-01-16T14:45:00Z",
  "referenceNumber": "CR-2024-00042",
  "data": {
    "status": "IN_PROGRESS",
    "previousStatus": "ASSIGNED",
    "priority": "NORMAL",
    "department": "public-works",
    "subject": "Pothole on Main Street",
    "firstRespondedAt": "2024-01-15T11:20:00Z",
    "respondedBy": "james@city.gov"
  }
}
```

### case.assigned

Fired when case assigned to a staff member.

**Payload**:

```json
{
  "event": "case.assigned",
  "timestamp": "2024-01-16T14:45:00Z",
  "referenceNumber": "CR-2024-00042",
  "data": {
    "assignedTo": "james@city.gov",
    "assignedBy": "manager@city.gov",
    "department": "public-works",
    "priority": "NORMAL"
  }
}
```

### case.resolved

Fired when case moves to RESOLVED status.

**Payload**:

```json
{
  "event": "case.resolved",
  "timestamp": "2024-01-16T14:45:00Z",
  "referenceNumber": "CR-2024-00042",
  "data": {
    "status": "RESOLVED",
    "resolvedAt": "2024-01-16T14:45:00Z",
    "resolvedBy": "james@city.gov",
    "finalResponse": "We filled the pothole on Main Street. Thank you for reporting.",
    "timeToResolution": 28800  // seconds
  }
}
```

### case.note

Fired when internal note added to case.

**Payload**:

```json
{
  "event": "case.note",
  "timestamp": "2024-01-16T14:45:00Z",
  "referenceNumber": "CR-2024-00042",
  "data": {
    "note": "Scheduled repair for Tuesday morning",
    "author": "james@city.gov",
    "isPublic": false,
    "noteType": "INTERNAL"
  }
}
```

## Authentication

### API Token

```bash
# Configure in webhook settings
Authorization: Bearer your-token-here

# Token is sent with every webhook
```

### HMAC Signature

Verify webhooks actually come from Constituent Response:

```bash
# Constituent Response calculates:
BODY = JSON.stringify(webhook_payload)
SIGNATURE = HMAC-SHA256(BODY, your_webhook_secret)

# Sends header:
X-Webhook-Signature: sha256=calculated_hex_value
```

**Verify signature in your 311 system**:

```javascript
const crypto = require('crypto');
const express = require('express');

app.post('/api/case-updates', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const body = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;

  const computed = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (computed !== signature.replace('sha256=', '')) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Signature valid, process webhook
  handleWebhook(req.body);
  res.json({ received: true });
});
```

## Retry Behavior

Webhooks are retried if your endpoint returns:
- 5xx error (server error)
- Timeout (no response within 30 seconds)
- Network error

**Retry schedule**:
- 1st attempt: immediate
- 2nd attempt: 5 minutes later
- 3rd attempt: 30 minutes later
- 4th attempt: 2 hours later
- 5th attempt: 24 hours later

After 5 failed attempts, webhook is marked as failed and logged for review.

```bash
# View failed webhooks in admin UI
Admin > Integrations > Webhook Logs
```

## Payload Filtering

### Selective Events

Only send certain events to reduce noise:

```
☐ case.statusUpdate
☑ case.assigned
☑ case.resolved
☐ case.note
```

### Status Filter

Only send when status is one of:

```
☑ NEW
☑ IN_PROGRESS
☑ RESOLVED
☑ CLOSED
```

Leave unchecked to receive all status changes.

## Error Handling

Your webhook endpoint should:

1. **Validate signature** (if HMAC enabled)
2. **Validate request structure** (check required fields)
3. **Validate data integrity** (check status is valid enum, etc.)
4. **Process atomically** (all-or-nothing, no partial updates)
5. **Return 2xx status** if successful
6. **Return 4xx status** if unrecoverable error (bad data)
7. **Return 5xx status** if temporary issue (should retry)

```javascript
app.post('/api/case-updates', async (req, res) => {
  try {
    // 1. Validate signature
    if (!verifySignature(req)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // 2. Extract and validate data
    const { event, referenceNumber, data } = req.body;

    if (!event || !referenceNumber || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 3. Update your database
    const result = await update311Case(referenceNumber, data);

    if (!result) {
      return res.status(400).json({ error: 'Case not found' });
    }

    // 4. Return success
    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Return 5xx to trigger retry
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

## Examples

### Sync to Open311 API

```bash
# Receive webhook from Constituent Response
# POST /api/case-updates

# Convert and sync to Open311
curl -X POST https://open311-endpoint.gov/api/v2/requests.json \
  -H "Content-Type: application/json" \
  -d '{
    "service_code": "pothole",
    "status": "in_progress",
    "service_request_id": "CR-2024-00042",
    "status_notes": "Being repaired"
  }'
```

### Sync to Zendesk Tickets

```bash
# Receive webhook case update
# Update Zendesk ticket with same reference number

curl -X PATCH https://your-subdomain.zendesk.com/api/v2/tickets/12345.json \
  -H "Authorization: Bearer your-zendesk-token" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": {
      "status": "pending",
      "comment": {
        "body": "We filled the pothole on Main Street"
      }
    }
  }'
```

### Sync to Salesforce Cases

```bash
// Receive webhook
// Update Salesforce Case record

const conn = new jsforce.Connection({
  instanceUrl: 'https://your-instance.salesforce.com',
  accessToken: 'your-token'
});

conn.sobject('Case').update({
  Id: 'Salesforce_Case_ID',
  Status: 'In Progress',
  Description: 'Case updated from Constituent Response: ' + webhookData.data.finalResponse
}, (err, ret) => {
  if (err) { return console.error(err); }
  console.log('Case updated: ' + ret.id);
});
```

## Troubleshooting

### Webhooks not being sent

1. Check webhook is enabled in Admin UI
2. Verify event type is checked
3. Check 311 endpoint URL is correct (must be HTTPS in production)

```bash
# Test if 311 endpoint is reachable
curl -v https://your-311-system.com/api/case-updates

# Should respond (even if 401 Unauthorized due to missing auth)
```

4. Check logs for errors:

```bash
docker-compose logs app | grep webhook
docker-compose logs app | grep "failed to send"
```

### Webhooks sent but not processed

1. Check authentication is correct (token, API key, etc.)
2. Verify signature (if HMAC enabled)

```bash
# Enable signature verification logging
docker-compose logs app | grep "signature"
```

3. Check 311 system is returning 2xx status

```bash
# View webhook delivery logs
Admin UI > Integrations > Webhook Logs
# Shows response status and body
```

4. Check for timeout issues

```bash
# If your endpoint takes > 30 seconds, increase timeout
# Edit in Constituent Response admin UI
Settings > Webhook Timeout: 60 (seconds)
```

### Duplicate updates

If webhooks are being processed twice:

1. Check for retries (check webhook logs for "retry")
2. Implement idempotency in your endpoint:

```javascript
// Use referenceNumber + timestamp as unique key
const key = `${referenceNumber}-${timestamp}`;
const alreadyProcessed = await cache.get(key);

if (alreadyProcessed) {
  return res.json({ received: true }); // Return success
}

// Process the update
await update311Case(referenceNumber, data);
await cache.set(key, true, 3600); // Remember for 1 hour
```

## Best Practices

1. **Always verify signatures** - Don't trust webhook came from us without verification
2. **Be idempotent** - Process same webhook twice = same result
3. **Fail fast** - Return errors quickly so Constituent Response knows to retry
4. **Log everything** - Track all webhook received, processed, failed
5. **Monitor deliveries** - Set up alerts if webhooks fail multiple times
6. **Test first** - Use webhook test button before enabling in production
7. **Use HTTPS** - All webhooks sent over encrypted connection
8. **Handle partial data** - Not all fields will always be present

## Webhook Logs

View delivery status in Admin UI:

```
Admin > Integrations > Webhook Logs

Shows:
- Event type (case.statusUpdate, etc.)
- Timestamp sent
- HTTP status code (200, 500, timeout, etc.)
- Response body (first 500 chars)
- Retries (if any)
- Final status (success, failed, pending-retry)
```

Failed webhooks can be manually retried from this UI.

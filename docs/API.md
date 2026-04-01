# Public API Reference

**Complete REST API documentation for Constituent Response. For internal tRPC APIs, see source code.**

**Quick Links:** [Authentication](#authentication) | [Rate Limits](#rate-limits) | [Endpoints](#endpoints) | [Errors](#error-handling) | [Examples](#examples) | [Testing](#testing)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [Rate Limits](#rate-limits)
5. [Endpoints](#endpoints)
6. [Error Handling](#error-handling)
7. [Examples](#examples)
8. [Testing](#testing)

---

## Overview

Constituent Response provides REST APIs for:

- **Receiving signals** from Transparent City newsletters (flags/applause)
- **Submitting cases** via web forms
- **Checking case status** publicly (constituents checking their case)
- **Requesting data privacy** (GDPR/CCPA deletion/export)
- **Outbound webhooks** to 311/CRM systems (when cases change)

### API Versioning

Current version: **v1**

All endpoints start with `/api/v1/`. We maintain backward compatibility within v1. Breaking changes (if any) go to v2.

---

## Authentication

### API Key Authentication

Newsletter and webhook endpoints use API key + HMAC signature:

```bash
X-TC-Api-Key: your-api-key-here
X-TC-Signature: sha256=calculated-signature
```

**Where to get API key:**
1. Login to admin panel
2. Go to `/admin/integrations` > **API Keys**
3. Copy your city's API key

### HMAC Signature Verification

Signature verifies that webhook came from Transparent City and wasn't tampered with.

**Algorithm:**
1. Take request body (raw JSON)
2. Compute: `HMAC-SHA256(body, TC_WEBHOOK_SECRET)`
3. Prepend "sha256=" to result
4. Compare with `X-TC-Signature` header

**JavaScript Example:**

```javascript
const crypto = require('crypto');
const webhook_secret = 'whs-your-secret';
const body = JSON.stringify(req.body);

const signature = crypto
  .createHmac('sha256', webhook_secret)
  .update(body)
  .digest('hex');

// Header will be: X-TC-Signature: sha256=<signature>
const headerSignature = req.headers['x-tc-signature'].split('=')[1];

// Timing-safe comparison (prevents timing attacks)
const valid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(headerSignature)
);
```

**Python Example:**

```python
import hmac
import hashlib

webhook_secret = b'whs-your-secret'
body = request.data
computed_sig = hmac.new(webhook_secret, body, hashlib.sha256).hexdigest()

header_sig = request.headers.get('X-TC-Signature', '').split('=')[1]
valid = hmac.compare_digest(computed_sig, header_sig)
```

---

## Base URL & Versioning

**Base URL:**
```
https://respond.yourdomain.com/api/v1
```

**Examples:**
```
https://respond.sf.gov/api/v1/signals
https://respond.oakland.local/api/v1/contact
```

**Multi-tenant (subdomains):**
```
https://sf.respond.yourdomain.com/api/v1/signals
```

---

## Rate Limits

Endpoints have rate limits to prevent abuse.

| Endpoint | Limit | Window | Status When Exceeded |
|----------|-------|--------|---------------------|
| `POST /api/v1/signals` | 10 requests | 1 minute | 429 Too Many Requests |
| `POST /api/v1/contact` | 5 requests | 1 minute | 429 Too Many Requests |
| `GET /api/v1/cases/[ref]/status` | 30 requests | 1 minute | 429 Too Many Requests |
| `POST /api/v1/privacy` | 3 requests | 1 hour | 429 Too Many Requests |
| `POST /api/v1/webhooks/*` | 100 requests | 1 minute | 429 Too Many Requests |

**Rate Limit Headers:**

Every response includes:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
Retry-After: 45
```

**If rate limited:**
1. Wait `Retry-After` seconds
2. Retry request
3. Consider batching requests if regularly hitting limit

---

## Endpoints

### POST /api/v1/signals

Receive newsletter signals (flags/applause) from Transparent City.

**Description:** Creates a case (for FLAG) or records positive feedback (for APPLAUD).

**Authentication:** Required (API key + HMAC signature)

**Request:**

```bash
curl -X POST https://respond.yourdomain.com/api/v1/signals \
  -H "Content-Type: application/json" \
  -H "X-TC-Api-Key: tc-abc123..." \
  -H "X-TC-Signature: sha256=..." \
  -d '{
    "citySlug": "sf",
    "constituentEmail": "alice@example.com",
    "constituentName": "Alice Smith",
    "newsletterExternalId": "bill-2024-001",
    "newsletterTitle": "Park Renovation Bill",
    "newsletterSummary": "Proposed changes to Golden Gate Park",
    "topicTags": ["parks", "development"],
    "sourceUrl": "https://transparentcity.co/bills/2024-001",
    "signalType": "FLAG",
    "note": "Concerned about parking impacts",
    "noteLanguage": "en"
  }'
```

**Request Schema:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `citySlug` | string | Yes | City identifier | `sf` |
| `constituentEmail` | email | Yes | Constituent email | `alice@example.com` |
| `constituentName` | string | No | Constituent name | `Alice Smith` |
| `newsletterExternalId` | string | Yes | Item ID from TC | `bill-2024-001` |
| `newsletterTitle` | string | Yes | Item title | `Park Renovation Bill` |
| `newsletterSummary` | string | Yes | Item summary | `Proposed changes...` |
| `topicTags` | array | Yes | Tags (min 1) | `["parks", "development"]` |
| `sourceUrl` | URL | Yes | Link to item | `https://...` |
| `signalType` | enum | Yes | `FLAG` or `APPLAUD` | `FLAG` |
| `note` | string | No | Constituent's comment | `Concerned about...` |
| `noteLanguage` | string | No | Note language code | `en`, `es`, `vi` |

**Response (Success):**

```json
{
  "success": true,
  "signalId": "sig-abc123...",
  "signalType": "FLAG",
  "caseCreated": true,
  "caseReferenceNumber": "CR-2024-00042",
  "message": "Signal processed and case created"
}
```

**Response (Error):**

```json
{
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "HMAC signature verification failed",
    "details": "Signature does not match expected value"
  }
}
```

**Status Codes:**
- `200 OK` - Signal processed successfully
- `400 Bad Request` - Invalid input (missing field, wrong type)
- `401 Unauthorized` - API key missing or invalid
- `403 Forbidden` - HMAC signature invalid
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error (retry)

**Notes:**
- Duplicate signals (same item + email within 24 hours) update existing case
- Deduplication is by: `(citySlug, constituentEmail, newsletterExternalId, signalType)`
- For APPLAUD signals, no case is created; positive feedback recorded

---

### POST /api/v1/contact

Submit a contact form from your website.

**Description:** Creates a new case from web form submission.

**Authentication:** Not required (CAPTCHA verified by frontend)

**Request:**

```bash
curl -X POST https://respond.yourdomain.com/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "citySlug": "sf",
    "constituentEmail": "bob@example.com",
    "constituentName": "Bob Johnson",
    "subject": "Pothole on Main Street",
    "description": "Large pothole at Main and 5th needs repair",
    "phone": "555-0123",
    "address": "123 Main St, San Francisco, CA",
    "language": "en",
    "attachmentUrls": ["https://example.com/pothole.jpg"]
  }'
```

**Request Schema:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `citySlug` | string | Yes | City identifier | `sf` |
| `constituentEmail` | email | Yes | Constituent email | `bob@example.com` |
| `constituentName` | string | Yes | Full name | `Bob Johnson` |
| `subject` | string | Yes | Issue subject (1-200 chars) | `Pothole on Main St` |
| `description` | string | Yes | Issue detail (10-5000 chars) | `Large pothole...` |
| `phone` | string | No | Phone number | `555-0123` |
| `address` | string | No | Street address | `123 Main St...` |
| `language` | string | No | Preferred language code | `en`, `es` |
| `attachmentUrls` | array | No | URLs to images/files | `["https://..."]` |

**Response (Success):**

```json
{
  "success": true,
  "caseReferenceNumber": "CR-2024-00043",
  "message": "Case created successfully",
  "statusUrl": "https://respond.yourdomain.com/cases/CR-2024-00043/status"
}
```

**Status Codes:**
- `201 Created` - Case created successfully
- `400 Bad Request` - Invalid input
- `429 Too Many Requests` - Rate limit exceeded

**Notes:**
- Acknowledgment email sent immediately
- Case assigned to default department if no department specified
- Attachments must be valid URLs accessible for 24 hours

---

### GET /api/v1/cases/[ref]/status

Check a case's public status.

**Description:** Constituents can check their case status with public reference number.

**Authentication:** Not required

**Request:**

```bash
curl https://respond.yourdomain.com/api/v1/cases/CR-2024-00042/status \
  -H "Accept-Language: es"
```

**Response (Success):**

```json
{
  "referenceNumber": "CR-2024-00042",
  "status": "RESOLVED",
  "statusLabel": "Resolved",
  "statusDescription": "Your request has been addressed",
  "createdAt": "2024-01-15T10:30:00Z",
  "respondedAt": "2024-01-16T14:00:00Z",
  "resolvedAt": "2024-01-16T14:45:00Z",
  "responseText": "We repaired the pothole on January 16...",
  "estimatedResponseTime": "Next business day",
  "department": "Public Works"
}
```

**Response (Not Found):**

```json
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "Case reference number not found",
    "details": "No case matches CR-2024-99999"
  }
}
```

**Status Codes:**
- `200 OK` - Case found
- `404 Not Found` - Case doesn't exist
- `429 Too Many Requests` - Rate limit exceeded

**Response Variations:**

**If case not yet responded:**
```json
{
  "status": "NEW",
  "statusLabel": "Received",
  "statusDescription": "Your request is being reviewed",
  "createdAt": "2024-01-16T10:00:00Z",
  "estimatedResponseTime": "Within 2 business days"
}
```

**Localization:**
- Default language: English
- Respects `Accept-Language` header
- Falls back to city's default language

---

### POST /api/v1/privacy

Request data export or deletion (GDPR/CCPA).

**Description:** Constituent requests copy of their data or deletion.

**Authentication:** Not required

**Request (Export):**

```bash
curl -X POST https://respond.yourdomain.com/api/v1/privacy \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "action": "export",
    "format": "json"
  }'
```

**Request (Deletion):**

```bash
curl -X POST https://respond.yourdomain.com/api/v1/privacy \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "action": "delete",
    "reason": "gdpr"
  }'
```

**Request Schema:**

| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| `email` | email | Yes | — | Constituent email |
| `action` | enum | Yes | `export`, `delete` | What to do |
| `format` | string | No | `json`, `pdf` | Export format (default: `json`) |
| `reason` | string | No | `gdpr`, `ccpa`, `other` | Legal basis (optional) |

**Response (Success):**

```json
{
  "success": true,
  "requestId": "priv-req-abc123",
  "action": "export",
  "status": "pending",
  "message": "Request received. You'll receive data export within 30 days.",
  "deliveryMethod": "email"
}
```

**Response (Error):**

```json
{
  "error": {
    "code": "NO_DATA_FOUND",
    "message": "No records found for this email",
    "details": "Email not in our system"
  }
}
```

**Status Codes:**
- `202 Accepted` - Request queued (processing)
- `400 Bad Request` - Invalid input
- `404 Not Found` - Email not in system
- `429 Too Many Requests` - Too many requests from this email

**Notes:**
- Export data sent via email within 30 days
- Deletion irreversible (data anonymized after 1 year)
- Includes all cases, responses, communication history

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE_IN_CAPS",
    "message": "Human-readable error message",
    "details": "Optional additional context",
    "field": "fieldName"  // Optional: which field caused error
  }
}
```

### Error Codes

| Code | HTTP | Meaning | Solution |
|------|------|---------|----------|
| `INVALID_INPUT` | 400 | Missing required field or wrong type | Check request schema, provide all required fields |
| `INVALID_EMAIL` | 400 | Email format invalid | Use valid email address |
| `INVALID_SIGNATURE` | 403 | HMAC signature doesn't match | Verify TC_WEBHOOK_SECRET, recalculate signature |
| `INVALID_API_KEY` | 401 | API key missing or invalid | Check X-TC-Api-Key header, get correct key from admin |
| `CITY_NOT_FOUND` | 404 | City slug doesn't exist | Verify citySlug matches database |
| `CASE_NOT_FOUND` | 404 | Case reference doesn't exist | Check case reference number spelling |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry after `Retry-After` seconds |
| `DUPLICATE_REQUEST` | 409 | Duplicate request received | Check if signal already processed |
| `INTERNAL_ERROR` | 500 | Server error | Retry after 30 seconds; contact support if persists |

### Common Error Scenarios

**Missing API Key:**
```
Request: POST /api/v1/signals (without X-TC-Api-Key header)
Response:
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key missing"
  }
}
Status: 401
```

**Invalid Signature:**
```
Request: Signature calculated incorrectly
Response:
{
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "HMAC signature verification failed"
  }
}
Status: 403
```

**Rate Limited:**
```
Response:
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
Status: 429
Headers:
  Retry-After: 45
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1640000045
```

---

## Examples

### Complete Workflow: Flag Signal → Case Creation

**1. TC sends webhook (POST /api/v1/signals):**

```bash
curl -X POST https://respond.sf.gov/api/v1/signals \
  -H "Content-Type: application/json" \
  -H "X-TC-Api-Key: tc-abc123def456" \
  -H "X-TC-Signature: sha256=e5fa44f2b31c1fb553b6021e7aab6b74476544c42422e5121369e4e27328cf35" \
  -d '{
    "citySlug": "sf",
    "constituentEmail": "alice@example.com",
    "constituentName": "Alice Smith",
    "newsletterExternalId": "prop-d",
    "newsletterTitle": "Measure D: Park Bond",
    "newsletterSummary": "Proposed $500M bond for park improvements",
    "topicTags": ["parks", "bond"],
    "sourceUrl": "https://tc.local/prop-d",
    "signalType": "FLAG",
    "note": "I support this bond",
    "noteLanguage": "en"
  }'
```

**2. Server validates signature and creates case, responds:**

```json
{
  "success": true,
  "signalId": "sig-xyz789",
  "caseCreated": true,
  "caseReferenceNumber": "CR-2024-00042",
  "message": "Signal processed and case created"
}
```

**3. Case created in database, acknowledgment email sent to alice@example.com**

**4. Staff sees case in inbox, assigns and responds**

**5. Constituent checks status via GET /api/v1/cases/CR-2024-00042/status**

---

### Complete Workflow: Web Form Submission

**1. User submits form on city website**

```bash
curl -X POST https://respond.sf.gov/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "citySlug": "sf",
    "constituentEmail": "bob@example.com",
    "constituentName": "Bob Johnson",
    "subject": "Pothole on Main Street",
    "description": "Large pothole at Main and 5th needs repair. My car was damaged.",
    "phone": "555-0100",
    "address": "123 Main St, SF, CA 94102",
    "language": "en",
    "attachmentUrls": ["https://mycity.gov/forms/pothole.jpg"]
  }'
```

**2. Case created, acknowledgment sent:**

```json
{
  "success": true,
  "caseReferenceNumber": "CR-2024-00043",
  "message": "Case created successfully",
  "statusUrl": "https://respond.sf.gov/cases/CR-2024-00043/status"
}
```

**3. Staff responds within 48 hours**

**4. Bob receives response email with his case reference**

---

### HMAC Signature Calculation (Python)

```python
import json
import hmac
import hashlib

# From TC
api_key = "tc-abc123"
webhook_secret = "whs-xyz789"
body = {
    "citySlug": "sf",
    "constituentEmail": "alice@example.com",
    # ... rest of fields
}

# Serialize to JSON (same as TC will send)
body_str = json.dumps(body, separators=(',', ':'), sort_keys=True)

# Calculate HMAC
signature = hmac.new(
    webhook_secret.encode(),
    body_str.encode(),
    hashlib.sha256
).hexdigest()

# Use in header
header_value = f"sha256={signature}"
# X-TC-Signature: sha256=abc123...
```

---

### Checking Case Status (JavaScript)

```javascript
async function checkCaseStatus(caseRef) {
  const response = await fetch(
    `https://respond.sf.gov/api/v1/cases/${caseRef}/status`
  );

  if (!response.ok) {
    const error = await response.json();
    console.error(`Error: ${error.error.code} - ${error.error.message}`);
    return null;
  }

  const data = await response.json();
  console.log(`Case ${data.referenceNumber} is ${data.status}`);
  return data;
}

// Usage
checkCaseStatus('CR-2024-00042');
```

---

## Testing

### Using curl

**Test signal submission:**

```bash
# 1. Calculate signature
SECRET="whs-test-secret"
BODY='{"citySlug":"sf","signalType":"FLAG","constituentEmail":"test@example.com"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# 2. Send request
curl -X POST http://localhost:3000/api/v1/signals \
  -H "Content-Type: application/json" \
  -H "X-TC-Api-Key: test-key" \
  -H "X-TC-Signature: sha256=$SIG" \
  -d "$BODY"
```

**Test contact form:**

```bash
curl -X POST http://localhost:3000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "citySlug": "sf",
    "constituentEmail": "test@example.com",
    "constituentName": "Test User",
    "subject": "Test Issue",
    "description": "This is a test"
  }'
```

**Check case status:**

```bash
curl http://localhost:3000/api/v1/cases/CR-2024-00001/status
```

### Using Postman

1. Import OpenAPI/Swagger spec (if available)
2. Set `X-TC-Api-Key` in Headers
3. Set `X-TC-Signature` header
4. Test each endpoint

### Using Your Integration

Before going live:
- [ ] Test signal submission with real TC credentials
- [ ] Verify case appears in admin UI
- [ ] Verify acknowledgment email arrives
- [ ] Test web form submission
- [ ] Check case status API
- [ ] Test rate limiting (submit 11 signals rapidly)
- [ ] Test error scenarios (invalid email, missing fields)

---

## Next Steps

- **[NEWSLETTER-INTEGRATION.md](./NEWSLETTER-INTEGRATION.md)** - Setup TC signals
- **[INTEGRATION-311.md](./INTEGRATION-311.md)** - Outbound webhooks
- **[SECURITY.md](./SECURITY.md)** - API security

---

**Last Updated:** March 2026

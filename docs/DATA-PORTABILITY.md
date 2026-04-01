# Data Portability Guide

This guide covers exporting, importing, and deleting constituent data.

## Export Data

### Bulk Case Export

Go to `/admin/data` > **Export Cases**

```
Format: CSV, JSON, or Excel
Date Range: Last 30 days (or custom)
Status: All, or filter by status
Departments: All, or select specific
Include:
  ☑ Case details
  ☑ Constituent info
  ☑ Responses
  ☑ Internal notes (keep unchecked for FOIA)
  ☑ Attachments (as separate files)
```

Click [Export]:

```
Generating export...
Cases found: 342
File size: ~8 MB
Format: CSV
Ready to download

Download will start automatically.
Filename: cases-export-20240116.csv
```

### CSV Format

```csv
case_id,case_ref,constituent_name,constituent_email,created_at,status,department,subject,description,first_response_at,resolved_at,response_text
case-001,CR-2024-00001,Alice Smith,alice@example.com,2024-01-15T10:30:00Z,RESOLVED,Public Works,Pothole,Large pothole at Main St,2024-01-15T11:20:00Z,2024-01-16T14:45:00Z,"We filled the pothole..."
case-002,CR-2024-00002,Bob Johnson,bob@example.com,2024-01-15T11:00:00Z,NEW,Parks,Park maintenance,Benches need repair,null,null,null
...
```

Import into Excel, Power BI, or another system.

### Per-Constituent Data Export

Go to `/admin/privacy` > Find constituent > **Export Their Data**

```
Constituent: Alice Smith
Email: alice@example.com

Includes:
  - All cases they submitted
  - All responses received
  - Contact history
  - Language preference
  - Account activity
```

Format: JSON (machine-readable) or PDF (human-readable)

```json
{
  "constituent": {
    "id": "const-001",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phoneNumber": null,
    "languagePreference": "Spanish",
    "createdAt": "2023-06-15"
  },
  "cases": [
    {
      "id": "case-001",
      "referenceNumber": "CR-2024-00001",
      "subject": "Pothole on Main Street",
      ...
    }
  ]
}
```

### Scheduled Exports

Go to `/admin/data` > **Scheduled Exports**

```
Create recurring export:
  Format: CSV
  Frequency: Weekly
  Day: Monday
  Time: 9 AM
  Email: data-team@city.gov

  Keep: Last 12 weeks
  Auto-delete older

[Create Schedule]

Exports automatically emailed each week
```

## Import Data

### From Another System

Go to `/admin/data` > **Import Cases**

```
Source System: 311 platform (text field)
Import Format: CSV or JSON
File: [upload file]

Preview:
  Cases detected: 342
  Valid rows: 341
  Warnings: 1 (invalid email)

[Import]
```

### Mapping Fields

System asks you to map columns:

```
Your CSV has:          Map to:
  id                   → case_id (auto)
  ticket_id            → case_ref
  citizen_name         → constituent_name
  citizen_email        → constituent_email
  request_text         → description
  assigned_to          → assigned_to_staff
  status_code          → status
  created              → created_at
  resolved             → resolved_at
```

### Validation

```
Before importing, system checks:
  ✓ Email format valid
  ✓ Status is recognized enum
  ✓ Dates in correct format
  ✗ Row 5: Email invalid → "review-me@invalid"
  ✓ 341 of 342 rows valid

[Review Invalid]
  Show errors, allow fix or skip

[Import]
```

### Duplicate Handling

If case already exists:

```
Options:
  ☉ Skip (don't import)
  ○ Update (use new data)
  ○ Ask (show me each one)

[Import]
```

Results:
```
Import Complete
  Created: 300 new cases
  Updated: 41 existing cases
  Skipped: 1 (duplicate)
  Total: 341 cases processed
```

## Data Format Specifications

### Case Format

Required fields:
```
case_id (unique ID)
constituent_email (email format)
subject (1-500 chars)
description (1-5000 chars)
created_at (ISO 8601 datetime)
status (NEW|ASSIGNED|IN_PROGRESS|RESOLVED|CLOSED)
```

Optional fields:
```
case_ref (reference number)
constituent_name (1-100 chars)
department (dept slug)
response_text (full response)
resolved_at (datetime)
assigned_to (staff email)
priority (CRITICAL|HIGH|NORMAL|LOW)
```

### Constituent Format

Required:
```
email (unique)
name (1-100 chars)
```

Optional:
```
phone (phone number)
language_preference (language code)
address (street address)
district (elected district)
```

## Privacy Requests

### Deletion Request

Constituent requests all data deleted (GDPR, CCPA):

Go to `/admin/privacy` > Find request > **Approve**

```
Request: Privacy - Deletion
Constituent: alice@example.com
Received: 2024-01-16
Deadline: 2024-02-15 (30 days from request)

Data to Delete:
  - Constituent record
  - 5 associated cases
  - All responses
  - Attachment files
  - Email logs

[Approve Deletion]
```

Deletion process:
1. Cases archived (not deleted, kept for audit/legal hold)
2. Constituent record anonymized
3. Personal data (email, phone, name) removed
4. Attachments deleted
5. Confirmation email sent

```
Deletion Complete (2024-01-20)
  Constituent: alice@example.com
  Cases archived: 5
  Files deleted: 12
  Confirmation sent to: alice@example.com
```

### Export Request

Constituent wants copy of their data:

Go to `/admin/privacy` > Find request > **Generate Export**

```
Request: Privacy - Data Export
Constituent: bob@example.com
Format: PDF (or JSON)

[Generate Export]

Processing...
File: bob-johnson-data-export-20240116.pdf
Download available for 7 days
Sent to: bob@example.com
```

## Data Retention

### Default Retention Policy

Go to `/admin/settings` > **Data Retention**:

```
Closed cases: Keep 7 years
  (Legal hold requirement)

Deleted constituents: Keep 1 year
  (Audit trail, dispute resolution)

Email logs: Keep 6 months
  (SMTP troubleshooting)

Attachment files: Delete with case
  (Unless under legal hold)
```

### Legal Hold

If case under litigation:

1. Flag case: [Mark for Legal Hold]
2. Retention extended: 7 years minimum
3. Cannot delete while on hold
4. Included in discovery

```
Case: CR-2024-00042
Status: RESOLVED
Legal Hold: YES
Reason: Pending lawsuit
Hold Date: 2024-01-16
Release Date: TBD
```

## Backup and Recovery

### Daily Backups

Automatic:
```
Schedule: Daily 2 AM
Retention: 30 days
Storage: AWS S3 (encrypted)
```

### Restore from Backup

Contact IT: support@city.gov

```
Request: "Need to restore case from backup"
Case ID: CR-2024-00042
Restore to date: 2024-01-15 (before accidental delete)

IT process:
  1. Verify request is authorized
  2. Create snapshot of current state (backup of backup)
  3. Restore to specified date
  4. Verify data integrity
  5. Confirm restoration with requestor
```

Full restoration takes 24-48 hours.

## Data Portability Standards

### Open Data Formats

All exports use open standards:
- **CSV**: UTF-8, comma-separated, Excel-compatible
- **JSON**: UTF-8, valid JSON, no custom encoding
- **PDF**: PDF/A standard for long-term archival

Not proprietary formats.

### APIs

Public API for programmatic access:

```bash
# Export via API
curl -X GET https://respond.transparentcity.co/api/v1/export/cases \
  -H "Authorization: Bearer token" \
  -H "Accept: application/json" \
  -d '{"dateRange": "2024-01-01..2024-01-31"}'

# Returns:
[
  {
    "caseId": "...",
    "referenceNumber": "CR-2024-00001",
    ...
  }
]
```

## Compliance

### GDPR (EU)

Right to Data Portability: Yes
- Data export in machine-readable format
- Export to other services
- Timely export (within 30 days)

Deletion/Right to Be Forgotten: Yes
- Anonymize or delete on request
- Timely deletion (within 30 days)
- Verify deletion

### CCPA (California)

Right to Know: Yes
- Access personal information
- Reasonable request frequency (2x/year)

Right to Delete: Yes
- Delete personal information
- Limited exceptions (legal obligation, fraud detection)

Right to Opt-Out: Yes
- Opt out of "sale" of personal data
- No discrimination for opting out

### GDPR Safe Harbor

Data transfers to US:
- EU SCCs (Standard Contractual Clauses) in place
- Data Processing Agreement (DPA) signed
- Annual review of adequacy

### Data Processing Agreement

Available at: `/admin/legal` > **DPA**

```
This Data Processing Agreement is between:
  Data Controller: City of San Francisco
  Data Processor: Constituent Response
  Effective: 2024-01-01

Key terms:
  - Data shall be processed only on Controller's instructions
  - Processor shall implement appropriate safeguards
  - Sub-processors listed and approved
  - Data may be transferred to [locations]
  - Processor shall assist with DPA requests
```

## Incident Response

### If Data Breach

```
1. Identify scope: which constituents affected?
2. Preserve evidence: backup affected data
3. Notify leadership: inform administrators
4. Assess risk: could PII be misused?
5. Notify users: email to affected constituents
   - What happened
   - What data was exposed
   - What we're doing
   - What they should do
6. Report to authorities: if required by law
7. Document: post-mortem, lessons learned
```

Timeline:
- Within 24 hours: Internal notification
- Within 72 hours: User notification (if PII exposed)
- Within 30 days: Investigation complete

## Tools

### Export Tool

Command line for advanced use:

```bash
# Export all cases from past 30 days
constituent-response-cli export cases \
  --days=30 \
  --format=csv \
  --output=cases-export.csv

# Export single constituent
constituent-response-cli export constituent \
  --email=alice@example.com \
  --format=json \
  --output=alice-data.json
```

### Data Validation Tool

Check data integrity before import:

```bash
# Validate CSV file
constituent-response-cli validate \
  --file=import.csv \
  --type=cases

# Output:
# ✓ 341 valid rows
# ✗ 1 invalid (row 5: email format)
```

## FAQ

**Q: How long are deleted cases kept?**
A: 1 year minimum (for dispute resolution, audit trail). Then permanently deleted unless under legal hold.

**Q: Can I export staff responses before I send them?**
A: No. Only final, sent responses are included. Drafts are not exported (not official records).

**Q: Can I import cases from our old 311 system?**
A: Yes. Provide CSV or JSON with case data, and we'll map and import.

**Q: What if constituent deletes their account then changes their mind?**
A: Data kept for 1 year. Within 1 year, we can potentially restore. After 1 year, permanently deleted.

**Q: Who can export data?**
A: ADMIN and MANAGER roles only. Other roles cannot bulk export (privacy protection).

**Q: Can I export to a specific format?**
A: Yes. Supports CSV, JSON, Excel, PDF. Choose format during export.

**Q: How long does export take?**
A: Small exports (< 100 MB): immediate. Large exports: queued as background job, emailed when ready.

**Q: Is exported data encrypted?**
A: By default no (CSVs are plain text). You should encrypt before sending externally.

# Public Records and FOIA Compliance Guide

This guide covers handling public records requests and FOIA compliance.

## Overview

Constituent Response tracks all data and makes public records accessible while protecting privacy.

**Public** (can be disclosed):
- Case reference number
- Case status
- Department handling it
- Dates (created, responded, resolved)
- Constituent name (if they made public request)
- Response sent to constituent

**Private** (protected from FOIA):
- Constituent email/phone (unless in public response)
- Internal staff notes
- Internal deliberations
- Draft responses (before final)
- Strategic information

## Internal Notes vs. Public Records

### Internal Notes

Marked as INTERNAL - excluded from FOIA exports.

Use for:
- Staff-to-staff communication
- Strategic discussion
- Technical notes
- Scheduling information
- Sensitive discussions

```
[Add Internal Note]

Note: "Need to consult with legal before responding"
Visible to: Your team only
Public records: NO (excluded from export)
```

### Public Notes

Marked as PUBLIC - included in FOIA exports.

Use for:
- Investigation findings
- Factual information
- Public-facing updates
- Case history

```
[Add Public Note]

Note: "Inspection completed on 2024-01-15. Pothole measured 8 inches deep."
Visible to: Staff + exported in FOIA requests
Public records: YES (included in export)
```

### Response to Constituent

Automatically PUBLIC (constituent received it).

Included in all FOIA exports.

## FOIA Request Handling

### Receive Request

Constituent emails FOIA@city.gov:

```
Subject: FOIA Request - My Cases

"I would like all records related to my case CR-2024-00042"
```

### Locate Records

Go to `/admin/foia`:

```
1. Search by case reference: CR-2024-00042
2. Or search by constituent email: alice@example.com
3. System shows all cases + associated records
```

Results show:
- Cases (status, timeline, notes)
- Responses (sent to constituent)
- Internal notes (MARKED - excluded)
- Attachments

### Review for Redactions

System marks private information:

```
Before FOIA Export:
================
Case: CR-2024-00042
Constituent: [REDACT - INTERNAL] alice@example.com
Status: RESOLVED
Response: "We repaired the pothole on Main St"

Internal Note: [MARK - EXCLUDED FROM FOIA]
"Constituent was upset, mentioned legal action.
Need to discuss with city counsel before final response."

Public Note: [INCLUDE]
"Inspection completed 2024-01-15. Pothole measured 8 inches."
```

### Export for FOIA

Click [Export for FOIA]:

```
Selected Records:
  - Case CR-2024-00042
  - Constituent name: (withheld)
  - Status: RESOLVED
  - Response text: [full text]
  - Public notes: [included]
  - Internal notes: [excluded]

Export Format: PDF
Filename: FOIA-20240116-CR2024-00042.pdf
```

### Send to Constituent

Email exported PDF to FOIA requestor within 5 business days (FOIA requirement).

```
From: FOIA@city.gov
To: alice@example.com
Subject: Your FOIA Request - Response

Dear Alice,

Attached is the information responsive to your
FOIA request received on 2024-01-16.

Sincerely,
FOIA Officer
```

## Redaction Rules

Automatic redactions:

### Phone Numbers

```
Before: "Call me at 555-0123"
After: "Call me at [PHONE WITHHELD]"

Exception: Public complaint line numbers are not redacted
```

### Email Addresses

```
Before: "You can reach me at alice@example.com"
After: "You can reach me at [EMAIL WITHHELD]"

Exception: Published city email addresses not redacted
```

### Social Security Numbers

```
Before: "My SSN is 123-45-6789"
After: "My SSN is [WITHHELD]"

Always redacted
```

### Medical Information

```
Before: "I'm diabetic and this situation is stressful"
After: "I have a medical condition and this situation is stressful"

Always redacted
```

### Confidential Source Names

```
If case mentions investigation source:
Before: "Officer Johnson told me about permit violation"
After: "I received information about permit violation"

Redact if source requested confidentiality
```

## Manual Redactions

For sensitive cases, manually review before export:

1. Open case in `/admin/foia`
2. Click [Review for Redactions]
3. Highlight text to redact
4. Explain reason: "Personal medical information"
5. Redaction applied
6. Export includes redaction notation

```
"The city received a report that the
[WITHHELD - PERSONAL MEDICAL INFORMATION]
was injured by this hazard."
```

## Audit Trail

All FOIA exports logged:

Go to `/admin/audit-logs` > Filter: `action = FOIA_EXPORT`

```
Date: 2024-01-16 14:30
Action: FOIA_EXPORT
User: foia-officer@city.gov
Case: CR-2024-00042
Records: 3 (case + 2 responses)
Redacted: 1 (email address)
Exported To: alice@example.com
Status: Completed
```

Immutable log shows:
- Who exported
- When
- What was included
- What was redacted

## Response Timelines

### FOIA Deadline

Standard response time: **5 business days**

```
Request received: Monday
Deadline: Following Monday (5 business days)

Exceptions:
- Complex requests (100+ pages): up to 20 days
- Expedited: within 2 business days (for fee)
- If denied: must explain why within deadline
```

### In Constituent Response

Set FOIA deadline in `/admin/foia`:

```
Request Received: 2024-01-16
Deadline: 2024-01-23
  ↓ (5 business days)

Set reminder: 2024-01-18 (2 days before)
Alert: RED if approaching deadline
```

## Denials and Exemptions

If you cannot release some records:

```
Possible exemptions:
  - Trade secrets or proprietary information
  - Ongoing investigation (law enforcement)
  - Attorney-client privilege
  - Confidential informant
  - Personnel records
  - State/federal security
```

**If denied**, must state reason:

```
Response to FOIA Request

Some records are exempt from disclosure per
[State] Public Records Act, Section [X]:

[WITHHELD - ATTORNEY-CLIENT PRIVILEGE]
Internal email discussing potential legal liability
```

Record the denial:

Go to `/admin/foia` > [Record Denial]

```
Case: CR-2024-00042
Requestor: alice@example.com
Reason: Attorney-client privilege
Explanation: Internal email discussing legal strategy
Date Denied: 2024-01-16
```

Denial logged for transparency.

## Appeal Process

Constituent can appeal denial:

```
"I received a FOIA denial. Can I appeal?"

Process:
1. Contact FOIA Officer within 10 days
2. State reason for appeal
3. FOIA Officer reviews with city counsel
4. Response within 10 days

System tracks appeals:
  /admin/foia > [View Appeals]
```

## Transparency Reporting

### Annual FOIA Report

System auto-generates report required by law:

Go to `/admin/reports` > **FOIA Annual Report**

```
Year: 2023

FOIA Requests Received: 342
Requests Granted (full): 298
Requests Granted (partial): 32
Requests Denied: 12

Average Response Time: 4.2 days
Fastest Response: same day
Slowest Response: 18 days

Records Released: 12,450 pages
Records Withheld: 842 pages

Appeals Received: 3
Appeals Granted: 1
Appeals Denied: 2

Cost to Process: $2,300
```

Use for:
- Accountability report
- Annual transparency report
- Legal compliance
- Public communication

## Privacy Requests

Separate from FOIA: constituents can request to delete or export their data.

See DATA-PORTABILITY.md for full details.

Key differences:

```
FOIA Request (by anyone):
  - "I want records about case X"
  - City decides what to release
  - 5 business days
  - Can deny based on exemptions

Privacy Request (by constituent):
  - "Delete my personal data"
  - City must comply (GDPR/CCPA)
  - 30-45 days
  - Limited exceptions (legal hold)
```

## Best Practices

1. **Mark as internal early**
   - When writing internal notes, clearly mark as INTERNAL
   - Easier to redact later

2. **Avoid sensitive discussions in case notes**
   - Use separate attorney email for legal discussions
   - Don't document settlement negotiations in case file

3. **Separate drafts from final**
   - Drafts are not public records
   - Final response to constituent is public
   - Keep draft separately, mark as DRAFT status

4. **Document redactions**
   - Always explain why redacted
   - Create audit trail
   - Be specific: "[WITHHELD - PERSONAL MEDICAL INFORMATION]"

5. **Respond quickly**
   - Better to respond in 2 days than wait 5 days
   - Shows good faith
   - Reduces appeals

6. **Be transparent**
   - If you're redacting, explain why
   - If denying, cite legal basis
   - Assist requester in refining request

7. **Train staff**
   - Staff mark notes as INTERNAL vs PUBLIC
   - Understand FOIA implications
   - Know what can be released

## Tools

### FOIA Dashboard

Go to `/admin/foia`:

```
Open Requests:        7
  Due Today:          1 ⚠️
  Due This Week:      3
  Due Next Week:      3

Recently Closed:      23
  Granted:            21
  Denied:             2
  Appealed:           0

Search: [by case, by requestor, by date]

Bulk Export (all open requests): [Download]
```

### Redaction Tool

Right-click text in case > [Mark for Redaction]

```
Selected: "My email is alice@example.com"
Reason: [Personal contact information ▼]
Auto-redact: ☑ (all emails)
```

### Audit Log

Shows all FOIA activity:

```
Filter by:
  - Date range
  - Requestor email
  - Case reference
  - Action (request received, exported, denied)
```

## External Resources

- State FOIA Law: [link to your state's public records law]
- Federal FOIA (if applicable): https://www.foia.gov/
- City Attorney: [contact]
- FOIA Officer: foia@city.gov

## Compliance Checklist

- [ ] Staff trained on public vs internal notes
- [ ] FOIA Officer assigned
- [ ] Response timeline set (5 business days)
- [ ] Redaction policy documented
- [ ] Appeal process published
- [ ] Annual report generated
- [ ] Audit logs reviewed quarterly
- [ ] Privacy policy posted on website

## Q&A

**Q: Can I delete a case before FOIA request?**
A: No. Once a FOIA request is received, retention obligation applies. Deleting would be destruction of records (illegal).

**Q: Can I deny FOIA request because it costs too much?**
A: No. You can charge reasonable fees for processing, but can't deny based on cost.

**Q: What if constituent changes mind about privacy request?**
A: They can withdraw. If already processed, deletions are permanent but other actions can stop.

**Q: Does FOIA request override privacy request?**
A: Generally no. Privacy request (right to delete) can prevent FOIA release if deletion applies. Attorney should advise.

**Q: How long to keep FOIA records?**
A: Depends on state law. Usually 3-7 years. Check your state's record retention schedule.

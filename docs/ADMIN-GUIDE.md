# Administrator Guide

**Complete guide for city IT managers and administrators setting up and operating Constituent Response.**

**Quick Links:** [Small City Quick Setup (15 min)](#small-city-quick-setup) | [Simple Mode vs Full Mode](#simple-mode-vs-full-mode) | [First Day Setup](#first-day-setup) | [User Management](#user-management) | [Departments](#department-management) | [Importing Data](#importing-your-existing-data)

---

## Table of Contents

1. [Small City Quick Setup](#small-city-quick-setup) (15 minutes)
2. [Simple Mode vs Full Mode](#simple-mode-vs-full-mode)
3. [Importing Your Existing Data](#importing-your-existing-data)
4. [First Day Setup](#first-day-setup) (30 minutes)
5. [User Management](#user-management)
6. [Department Management](#department-management)
7. [SLA Configuration](#sla-configuration)
8. [Email Configuration](#email-configuration)
9. [Template Management](#template-management)
10. [AI Configuration](#ai-configuration)
11. [Integration Setup](#integrations-setup)
12. [Data Management](#data-management)
13. [Common Admin Tasks](#common-admin-tasks)
14. [Monthly Checklist](#monthly-checklist)

---

## Small City Quick Setup

**Assume you've already run `one-click-setup.sh` from DEPLOYMENT.md. This section gets you from blank system to live in 15 minutes.**

Time breakdown: Step 1 (2 min) + Step 2 (3 min) + Step 3 (3 min) + Step 4 (5 min) + Step 5 (2 min) = 15 minutes total.

### Step 1: Log In (2 minutes)

1. Open browser, go to `http://localhost:3000` (or your domain)
2. You should see a sign-in screen
3. Use the credentials from setup script output (check your terminal history or the setup log file)
4. If you lost the credentials, you can reset them with: `docker-compose exec app npm run reset:admin`

Pro tip: Bookmark this URL in your browser. You'll be here every day.

### Step 2: Review and Remove Unnecessary Departments (3 minutes)

The system comes pre-loaded with 6 default departments. For a small city, you probably don't need all of them.

1. Go to **Admin > Departments**
2. Review the list:
   - **Keep:** Departments your city actually has (e.g., Public Works, Parks, Code Enforcement)
   - **Remove:** Departments you don't use (click the trash icon)
3. Edit department names to match your city's exact terminology (e.g., if you call it "Public Works and Utilities," update the name)
4. Leave the rest at defaults for now

Why? Less clutter for your staff. They only see departments relevant to them.

Skip this if: You're happy with the defaults and will clean up later. It's not urgent.

### Step 3: Invite Your Staff (3 minutes)

1. Go to **Admin > Users**
2. Click **+ Add User**
3. Fill in:
   - **Email:** staff-member@city.gov
   - **Name:** John Smith (or their name)
   - **Role:** AGENT (for frontline staff) or MANAGER (for supervisors)
   - **Department:** Select their primary department
4. Click **Send Invite**
5. Repeat for each staff member (usually 2-3 people for a small city)

They'll receive an email with a temporary password. When they log in, they're prompted to change it.

Pro tip: If a staff member handles multiple departments, add them as AGENT to their primary department. You can add more departments later in Step 1 of "User Management" below.

Skip this if: You want to test it yourself first. You can add staff later; nothing breaks.

### Step 4: Create 2-3 Response Templates (5 minutes)

Templates are pre-written responses staff reuse. Most small cities have 3-5 common request types. For example:

1. Go to **Admin > Templates**
2. Click **+ New Template**
3. Create your first template:
   - **Name:** "Thank You - Standard Response"
   - **Department:** (select one)
   - **Content:**
     ```
     Dear [CONSTITUENT_NAME],

     Thank you for contacting us about [TOPIC]. We've received your request and forwarded it to the appropriate department.

     We aim to respond within 2 business days.

     Case reference: [CASE_REF]

     Best regards,
     [CITY_NAME] Response Team
     ```
4. Click **Save**
5. Repeat for 1-2 more common requests (see SMALL-CITY-GUIDE.md for examples)

Why? Staff don't have to write responses from scratch. They use a template and edit it for the specific request. This saves 5 minutes per response.

Skip this if: You'd rather staff write custom responses. Templates are optional, but we recommend at least 3.

### Step 5: You're Done. Start Handling Cases (2 minutes)

The system is now live. To test it:

1. Go to **Admin > Test Email**
2. Send a test case to yourself
3. You should see it appear in the dashboard as a NEW case
4. Click it, select a template, edit the response, click "Send"
5. Constituent gets notified immediately

You're ready for real constituent requests. Just make sure:
- SMTP is configured so email actually goes out (see Email Configuration section)
- At least one staff member has logged in (so they can respond)
- Elected officials know they can check the dashboard (optional)

---

## Simple Mode vs Full Mode

Constituent Response has two interface modes: Simple (clean, focused) and Full (all features visible).

### Simple Mode (Default for small cities)

Simple mode hides advanced features. Staff see:
- List of cases assigned to them
- Case details (subject, constituent info, timeline)
- Template selector
- Response text box
- Internal notes section

Staff do NOT see:
- Priority levels
- Custom fields
- Advanced workflows
- AI draft button (unless explicitly enabled)
- Assignment/reassignment (handled by managers)

Why Simple Mode for small cities?
- Clean, less confusing
- Faster to train (one page, not ten)
- Enough for 99% of small city use cases

### Full Mode (Advanced features visible)

Full mode shows everything:
- Priority/SLA management
- Custom fields
- Workflow states
- AI drafting
- Advanced reporting
- Case reassignment

Why wait to enable Full Mode?
- Most small cities start with Simple mode
- Staff get confident with basics first
- You add features as you need them, not day one

### How to Switch Modes

As an admin:

1. Go to **Admin > Settings > Interface Mode**
2. Toggle between "Simple" and "Full"
3. Takes effect immediately (no restart needed)

For individual staff:

1. Go to their user profile
2. Toggle "Use Full Interface" checkbox
3. Only that person sees full mode

Pro tip: Start everyone in Simple mode. After 2-3 weeks, ask "Do you want to see more features?" Most say no. A few say yes. Turn it on for them.

### Comparison Table

| Feature | Simple Mode | Full Mode |
|---------|:---:|:---:|
| View my cases | ✓ | ✓ |
| Respond to case | ✓ | ✓ |
| Use templates | ✓ | ✓ |
| View case history | ✓ | ✓ |
| Add internal notes | ✓ | ✓ |
| Edit priority | — | ✓ |
| View/edit custom fields | — | ✓ |
| Generate AI draft | — | ✓ |
| Reassign case | — | ✓ |
| Create saved searches | — | ✓ |
| View SLA status | ⚠ (basic) | ✓ (detailed) |
| Access reports | ✓ (basic) | ✓ (advanced) |

---

## Importing Your Existing Data

If you're migrating from email or a spreadsheet, you can import historical cases. This is optional but recommended for reporting and continuity.

### Step 1: Export from Your Current System

**From Gmail (shared inbox):**
1. Go to https://gmail.com
2. Click the settings icon (gear) > See all settings
3. Go to Labels tab
4. Find your shared inbox label
5. Go back to inbox, select all emails in that label
6. Click the "..." menu > Download as CSV
7. Save the file

**From Outlook (shared mailbox):**
1. Open the shared mailbox
2. Ctrl+A to select all emails
3. Right-click > Move > (save to PST file)
4. Use online tool to convert PST to CSV

**From a spreadsheet:**
1. Make sure you have these columns:
   - `constituent_email` (required)
   - `constituent_name` (optional but useful)
   - `subject` (required)
   - `description` (optional)
   - `created_at` (optional, format: YYYY-MM-DD HH:MM:SS)
   - `status` (optional: NEW, IN_PROGRESS, RESOLVED)
   - `department` (optional: must match your department names exactly)
2. Export as CSV
3. Done

### Step 2: Format the CSV

The import wizard accepts standard formats:

```csv
constituent_email,constituent_name,subject,description,created_at,status,department
alice@example.com,Alice Smith,Pothole,Large pothole on Main St,2024-01-01 10:00,RESOLVED,Public Works
bob@example.com,Bob Jones,Permit Question,Zoning question about my property,2024-01-02 11:00,NEW,Planning
```

**Important:**
- Column names must be exactly as shown above (lowercase, underscores)
- `created_at` must be in YYYY-MM-DD HH:MM:SS format
- `status` must be one of: NEW, IN_PROGRESS, RESOLVED, CLOSED
- `department` must match an existing department name in your system

The import wizard will show you a preview and flag any errors before importing.

### Step 3: Use the Import Wizard

1. Go to **Admin > Data > Import Cases**
2. Click **Choose File** and select your CSV
3. The wizard shows a preview of first 5 rows
4. Fix any errors (column names, date format, etc.)
5. Check **Assign to me** if you want all historical cases marked as assigned to you (for continuity)
6. Click **Import**
7. You'll see a progress bar. The import runs in the background (might take 5-30 minutes for large imports)

Check `/admin/logs` to see import progress.

### Step 4: What About Historical Data You Don't Want?

You don't have to import everything. For example:
- Very old emails (pre-2023)
- Spam/test emails
- Sensitive information you'd rather not digitize

Just remove those rows from the CSV before importing. The system doesn't care. Only import what you want.

**Pro tip:** Import the last 12-24 months of data. That gives you good trends and history without bloating the database.

### Step 5: After Import

After importing, you can:
- View all imported cases in the dashboard
- Export reports showing trends (how many requests in 2024 vs 2023, etc.)
- Show elected officials: "Look how responsive we've been" (if numbers are good)

Imported cases are treated like any other case. Staff can respond to them, edit notes, change status, etc.

---

---

## First Day Setup (After Quick Setup Above)

**Skip this section if you used the Quick Setup above.** This is the detailed version for people who want to understand every setting.

If you just want to get running, the Quick Setup (15 min) is enough. These next sections are for when you need to customize settings.

Complete these tasks immediately after deployment. Allocate 30 minutes for full customization.

### 1. Create Your City (5 minutes)

Access the database via Prisma Studio or SQL:

**Via Prisma Studio (easiest):**
```bash
docker-compose exec app npm run db:studio

# Navigate to "City" table
# Click "Add record" or "+" button
```

**Fill in:**
| Field | Value | Notes |
|-------|-------|-------|
| `name` | San Francisco | Display name shown throughout app |
| `slug` | sf | **Must be unique and lowercase.** Used in URLs, API requests, and multi-tenant subdomains. |
| `state` | CA | 2-letter state code |

**Via SQL:**
```sql
INSERT INTO "City" (id, name, slug, state, "createdAt")
VALUES (gen_random_uuid(), 'San Francisco', 'sf', 'CA', now());
```

### 2. Create Default Departments (5 minutes)

Go to `/admin/departments` or create via SQL:

**Default structure:**
```sql
INSERT INTO "Department" (id, "cityId", name, slug, description, "defaultSlaHours", "isActive", "createdAt")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "City" WHERE slug = 'sf'),
  name,
  slug,
  description,
  48,
  true,
  now()
FROM (VALUES
  ('Administration', 'admin', 'General inquiries not assigned to other departments'),
  ('Public Works', 'public-works', 'Streets, potholes, sidewalks, infrastructure'),
  ('Parks & Recreation', 'parks-recreation', 'Parks, trails, public spaces, recreation'),
  ('Code Enforcement', 'code-enforcement', 'Zoning, permits, violations, building codes'),
  ('Planning', 'planning', 'Land use, development, urban planning'),
  ('Housing', 'housing', 'Housing policy, affordability, development')
) AS t(name, slug, description);
```

**Or via Admin UI:**
1. Go to `/admin/departments`
2. Click **+ Add Department**
3. Fill in Name, Slug, Description, Default SLA Hours
4. Optionally add notification emails (staff to notify)
5. Save

### 3. Create First Admin User (5 minutes)

**Via Prisma Studio:**
1. Navigate to "User" table
2. Create new record:
   - email: `your-email@city.gov`
   - name: Your Name
   - role: `ADMIN`
   - cityId: (select your city)
   - password: (auto-generated, email sent to you)

**Via SQL:**
```sql
-- First, generate a bcrypt hash of your initial password
-- Using: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('InitialPassword123!', 10))"
-- This is security-critical: use a strong, temporary password

INSERT INTO "User" (id, "cityId", email, name, role, password, "isActive", "createdAt")
VALUES (
  gen_random_uuid(),
  (SELECT id FROM "City" WHERE slug = 'sf'),
  'admin@sf-response.local',
  'City Admin',
  'ADMIN',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm',  -- bcrypt hash
  true,
  now()
);
```

### 4. Change Initial Password (5 minutes)

1. Go to http://localhost:3000
2. Click **Sign In**
3. Enter email and temporary password
4. Click **Change Password**
5. Enter new strong password (8+ characters, mix of types)
6. Save

### 5. Test Email Sending (Optional, 5 minutes)

Go to `/admin/settings` > **Email Configuration**

1. Fill in SMTP details if not already set
2. Click **Send Test Email**
3. Check your inbox (should arrive in 30 seconds)

---

## User Management

### Role Hierarchy

| Role | Power Level | What They Can Do | Who Are They |
|------|------------|------------------|-------------|
| **SUPER_ADMIN** | 5 | Manage everything, all cities | System owners only |
| **ADMIN** | 4 | Manage city config, users, departments, integrations | City IT manager |
| **MANAGER** | 3 | Manage cases, staff, templates, reports | Department supervisor |
| **AGENT** | 2 | Respond to cases, add notes | Frontline staff |
| **ELECTED_OFFICIAL** | 1 | View district dashboard (read-only) | Council member or supervisor |

**Permission Matrix:**

| Action | SUPER_ADMIN | ADMIN | MANAGER | AGENT | EO |
|--------|:-----------:|:-----:|:-------:|:-----:|:--:|
| Manage users | ✓ | ✓ | — | — | — |
| Manage departments | ✓ | ✓ | — | — | — |
| Manage templates | ✓ | ✓ | ✓ | — | — |
| Create cases | ✓ | ✓ | ✓ | ✓ | — |
| Respond to cases | ✓ | ✓ | ✓ | ✓ | — |
| View all cases | ✓ | ✓ | ✓ | own | — |
| View district dashboard | ✓ | ✓ | ✓ | — | ✓ |
| Export data | ✓ | ✓ | ✓ | — | — |
| View audit logs | ✓ | ✓ | — | — | — |

### Creating Staff Users

#### Via Admin UI

1. Go to `/admin/users`
2. Click **+ Add User**
3. Fill in:
   - **Email:** staff-email@city.gov
   - **Name:** Staff Member Name
   - **Role:** AGENT or MANAGER
   - **Department:** Their primary department
   - **Phone:** (optional)
4. Click **Send Invite**

Staff will receive email with temporary password. They change it on first login.

#### Via SQL

```sql
INSERT INTO "User" (id, "cityId", email, name, role, password, "departmentId", "isActive", "createdAt")
VALUES (
  gen_random_uuid(),
  (SELECT id FROM "City" WHERE slug = 'sf'),
  'john@sf-response.local',
  'John Smith',
  'AGENT',
  '$2b$10$...',  -- bcrypt hash (use strong temp password)
  (SELECT id FROM "Department" WHERE slug = 'public-works'),
  true,
  now()
);
```

### Modifying Users

**Changing role or department:**
```bash
# Via Admin UI: Go to /admin/users, click user, edit fields

# Via SQL:
UPDATE "User"
SET role = 'MANAGER', "departmentId" = (SELECT id FROM "Department" WHERE slug = 'public-works')
WHERE email = 'john@sf-response.local';
```

**Deactivating a user:**
```bash
# Via Admin UI: Go to /admin/users, click user, set "Active" to OFF

# Via SQL:
UPDATE "User" SET "isActive" = false WHERE email = 'john@sf-response.local';
```

**Resetting password:**
```bash
# User goes to /forgot-password and requests reset
# Or admin can force reset via Admin UI (future feature)
```

### Assigning Users to Multiple Departments

A user can respond to cases from multiple departments:

```sql
-- Create a junction table entry
INSERT INTO "UserDepartment" ("userId", "departmentId", "createdAt")
VALUES (
  (SELECT id FROM "User" WHERE email = 'john@sf-response.local'),
  (SELECT id FROM "Department" WHERE slug = 'parks-recreation'),
  now()
);
```

---

## Department Management

### Creating Departments

**Via Admin UI:** `/admin/departments` > **+ Add Department**

Fill in:
- **Name:** Public Works
- **Slug:** public-works (auto-generated, must be unique)
- **Description:** Streets, potholes, sidewalks, infrastructure
- **Default SLA Hours:** 48 (default response deadline)
- **Notification Email(s):** manager@sf-response.local, superviso@sf-response.local (comma-separated)

### Department Topic Tags

Assign topic tags to departments to auto-route cases:

**Via Admin UI:** Go to department, add **Topic Tags**

When a newsletter signal includes these tags, it auto-routes to this department:
- Public Works: `pothole`, `street`, `infrastructure`, `sidewalk`
- Parks: `park`, `playground`, `trail`, `recreation`
- Code Enforcement: `zoning`, `violation`, `permit`, `building`

```sql
-- Via SQL:
INSERT INTO "DepartmentTag" ("departmentId", tag)
VALUES (
  (SELECT id FROM "Department" WHERE slug = 'public-works'),
  'pothole'
), (
  (SELECT id FROM "Department" WHERE slug = 'public-works'),
  'street'
);
```

### SLA per Department

Set different response times per department:

**Via Admin UI:** Departments > Select department > Default SLA Hours

**Via SQL:**
```sql
UPDATE "Department"
SET "defaultSlaHours" = 24  -- Urgent departments: 24 hours
WHERE slug = 'code-enforcement';

UPDATE "Department"
SET "defaultSlaHours" = 72  -- Lower-priority: 72 hours
WHERE slug = 'planning';
```

---

## SLA Configuration

### What Are SLAs?

**SLA = Service Level Agreement.** An SLA deadline is the promised response time to constituents.

- **NEW case created** → SLA deadline is set based on department
- **Staff responds** → Case marked ASSIGNED, SLA still active
- **Staff sends final response** → Case marked RESOLVED, SLA met (if on time)
- **Deadline passed** → SLA BREACHED, escalation alert sent

### Setting SLA Policies

#### Per-Department SLA

```sql
UPDATE "Department"
SET "defaultSlaHours" = 48  -- Response within 48 hours
WHERE slug = 'public-works';
```

#### SLA by Priority

```sql
-- Create priority-specific SLAs in database:
-- CRITICAL: 4 hours
-- HIGH: 24 hours
-- NORMAL: 48 hours (default)
-- LOW: 72 hours
```

#### Business Hours Only

Configure SLAs to count only business hours (optional):

```
Monday-Friday: 8 AM - 5 PM
Weekend/Holidays: OFF

Case created Friday 4 PM, 48-hour SLA
→ Deadline: Monday 4 PM (not Saturday/Sunday counted)
```

**Implementation:** Via Admin UI: `/admin/settings` > **Business Hours** > toggle on

### SLA Escalation

When SLA is about to breach:

**Status of case:**
- ✓ On Time: 75%+ of deadline remaining
- ⚠ At Risk: 0-25% of deadline remaining
- ✗ Breached: Deadline passed

**Notifications:**
- **1 hour before deadline:** Email to assigned staff
- **At breach:** Email to department manager and admin

```bash
# Check SLA status in code:
docker-compose logs worker | grep -i "sla\|escalat"
```

---

## Email Configuration

### Setting Up SMTP

Go to `/admin/settings` > **Email Configuration**

Or edit `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google generates a 16-character app password
4. Use that as SMTP_PASS (not your Gmail password!)

**For SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

**For AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-iam-smtp-username
SMTP_PASS=your-iam-smtp-password
```

### Customizing Email Templates

Go to `/admin/settings` > **Email Templates**

#### Acknowledgment Email

Sent immediately when case is created.

**Template variables:**
- `[CASE_REF]` - Case reference number (CR-2024-00001)
- `[CASE_LINK]` - Link to public case status page
- `[DEPARTMENT]` - Department handling case
- `[CITY_NAME]` - City name

**Default template:**
```
Dear [CONSTITUENT_NAME],

Thank you for contacting us. Your request has been received.

Case Reference: [CASE_REF]
Department: [DEPARTMENT]
Submitted: [CREATED_AT]

You can check status here: [CASE_LINK]

We aim to respond within 48 hours.

Best regards,
[CITY_NAME] Response Team
```

#### Response Email

Sent when staff sends final response.

**Template variables:**
- `[CASE_REF]`
- `[RESPONSE]` - The actual response text
- `[STAFF_NAME]` - Staff member's name
- All previous variables

**Test email send:**
```bash
docker-compose exec app npm run test:email --to=your-email@example.com
```

---

## Template Management

### Creating Response Templates

Go to `/admin/templates`

Templates are pre-written responses staff can use, avoiding repetitive typing.

**Create template:**
1. Click **+ New Template**
2. Fill in:
   - **Name:** "Pothole Reported"
   - **Department:** Public Works
   - **Category:** "Standard Response" or custom
   - **Content:**
     ```
     Thank you for reporting this pothole. We've inspected the location and added it to our repair queue.

     Estimated repair time: 1-2 weeks depending on weather.

     Case reference: [CASE_REF]

     We appreciate your patience.
     ```
3. Save

### Using Templates

Staff using templates:
1. Open case
2. Click **Use Template**
3. Select template (pre-fills response)
4. Edit as needed
5. Send

### Template Variables

Use these in any template:

| Variable | Replaced With |
|----------|---------------|
| `[CASE_REF]` | CR-2024-00001 |
| `[CONSTITUENT_NAME]` | Alice Smith |
| `[DEPARTMENT]` | Public Works |
| `[CITY_NAME]` | San Francisco |
| `[CREATED_AT]` | 2024-01-15 10:30 AM |
| `[ASSIGNED_TO]` | John Smith |

### Template Approval Workflow

(Advanced) Require manager approval before template use:

1. Staff draft response
2. Submit for approval
3. Manager reviews in `/admin/templates/pending`
4. Manager approves or requests changes
5. Response sent to constituent

---

## AI Configuration

### Enabling AI Drafting

Go to `/admin/settings` > **AI Configuration**

1. Select provider: **OpenAI** or **Anthropic Claude**
2. Paste API key
3. Click **Test Connection**
4. Set monthly budget (optional alert)

**For development (testing costs):**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-3.5-turbo  # Cheaper
```

**For production (quality):**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4-turbo  # Best quality
```

### Tone Settings

Configure how AI drafts sound:

- **Formal:** "The City acknowledges receipt..."
- **Helpful:** "Thanks for reaching out! We're here to help..."
- **Professional:** "We appreciate your feedback..."
- **Friendly:** "Hi! We got your message and..."

Staff can override per-case when generating draft.

### Cost Monitoring

Check AI usage in `/admin/settings` > **AI Usage**:

```
This month: 342 drafts, $12.85 spent
Monthly budget: $50
Estimated cost per draft: $0.038 (gpt-4-turbo)

Breakdown:
  Input tokens: 145,000 ($0.0015 per 1K)
  Output tokens: 32,000 ($0.006 per 1K)
```

### Disabling AI

To save costs, disable AI:

```bash
# Option 1: Via .env
AI_DISABLED=true

# Option 2: Via Admin UI
Go to /admin/settings > uncheck "AI Drafting Enabled"

# Staff won't see "Generate Draft" button
```

---

## Integrations Setup

### Transparent City Newsletter

Prerequisites:
- Transparent City account with newsletter
- API key and webhook secret

**Setup:**
1. Go to `/admin/integrations` > **Transparent City**
2. Paste **TC_API_KEY** and **TC_WEBHOOK_SECRET**
3. Map newsletter topics to departments (pothole → Public Works)
4. Click **Test Connection**
5. Check signal logs: `/admin/logs` > filter "signal"

**Testing:**
```bash
# Generate test signal
curl -X POST http://localhost:3000/api/v1/webhooks/newsletter \
  -H "Content-Type: application/json" \
  -H "X-TC-Api-Key: your-key" \
  -H "X-TC-Signature: sha256=test" \
  -d '{
    "citySlug": "sf",
    "signalType": "FLAG",
    "constituentEmail": "test@example.com",
    "newsletterExternalId": "bill-123"
  }'
```

### 311 System Integration (Outbound Webhooks)

Send case updates to your existing 311:

1. Go to `/admin/integrations` > **Webhooks**
2. Click **+ Add Webhook**
3. Fill in:
   - **Name:** "Our 311 System"
   - **URL:** `https://our311.local/api/case-updates`
   - **Events:** Check "Case status changed"
   - **Auth:** OAuth token or API key (if needed)
4. Click **Test Webhook**
5. Check logs: `/admin/logs` > filter "webhook"

**What gets sent:**
```json
{
  "event": "case.statusUpdate",
  "timestamp": "2024-01-16T14:30:00Z",
  "referenceNumber": "CR-2024-00001",
  "data": {
    "status": "RESOLVED",
    "department": "public-works",
    "subject": "Pothole on Main Street"
  }
}
```

---

## Data Management

### Exporting Cases

Go to `/admin/data` > **Export Cases**

1. Select date range (Last 30 days / custom)
2. Select status (All / filter)
3. Select departments (All / filter)
4. Choose format: CSV, JSON, Excel
5. Check **Include internal notes?** (usually NO for FOIA)
6. Click **Export**

**Use for:**
- Backup/archival
- Analysis in Excel
- Transition to new system
- FOIA requests

### Importing Cases

Go to `/admin/data` > **Import Cases**

Upload CSV with columns:
```csv
constituent_email,subject,description,created_at,status
alice@example.com,Pothole,Large pothole at Main St,2024-01-01 10:00,RESOLVED
bob@example.com,Permit Question,Zoning question,2024-01-02 11:00,NEW
```

System validates and imports.

### Data Retention Policies

Configure how long to keep data:

Go to `/admin/settings` > **Data Retention**

```
Closed cases: 7 years (legal requirement)
Deleted constituents: 1 year (audit trail)
Email logs: 6 months (troubleshooting)
Attachment files: Delete with case
```

### Privacy Requests

Constituents can request data export or deletion (GDPR/CCPA):

**Handling requests:**
1. Go to `/admin/privacy` > **Requests**
2. Find request by email
3. **Export:** Generate ZIP of their data
4. **Delete:** Anonymize all their records
5. Send confirmation email

---

## Common Admin Tasks

| Task | Frequency | Steps | Time |
|------|-----------|-------|------|
| **Review SLA breaches** | Daily | Go to `/admin/reports` > SLA Compliance | 5 min |
| **Add new staff member** | As needed | Go to `/admin/users` > Add User | 10 min |
| **Update templates** | Weekly | Go to `/admin/templates` > Review/Edit | 15 min |
| **Export weekly report** | Weekly | Go to `/admin/reports` > Download | 5 min |
| **Check system health** | Daily | Verify `/api/health` endpoint | 2 min |
| **Review audit logs** | Weekly | Go to `/admin/audit-logs` > Search | 10 min |
| **Monitor backup status** | Weekly | Check `/backups/database` size | 2 min |
| **Update integrations** | Monthly | Verify API keys haven't expired | 5 min |
| **Review AI usage costs** | Monthly | Go to `/admin/settings` > AI Usage | 3 min |

---

## Monthly Checklist

Run these checks every month:

- [ ] **Database size check:** `docker-compose exec postgres du -h /var/lib/postgresql/data`
- [ ] **Backup verification:** Last 3 backups recent and valid size
- [ ] **Staff activity review:** Any inactive accounts to disable?
- [ ] **AI cost review:** Usage under budget?
- [ ] **Email deliverability:** Check bounce/failure rates
- [ ] **SLA compliance:** All departments hitting targets?
- [ ] **Security patch review:** Any updates available?
- [ ] **Audit log review:** Any suspicious activity?
- [ ] **Disaster recovery test:** (Quarterly) Test backup restore
- [ ] **Constituent satisfaction:** Any feedback/complaints?

---

## Troubleshooting

### Can't login
- Verify user exists: `docker-compose exec postgres psql -U postgres -d constituent_response -c "SELECT email, role FROM \"User\";"`
- Reset password via `/forgot-password`
- Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in .env

### Cases not appearing
- Check Newsletter signal webhook is working: `/admin/logs` > filter "signal"
- Verify city slug in webhook matches database: `SELECT slug FROM "City";`
- Check background worker: `docker-compose logs worker`

### Email not sending
- Test SMTP: `docker-compose exec app npm run test:email --to=your-email@example.com`
- Check SMTP credentials in .env
- Verify SMTP_FROM is valid sender

### Can't create templates
- Verify you're logged in as MANAGER or higher
- Ensure department exists and is active

---

## Next Steps

1. **Complete First Day Setup** above
2. **Create departments** matching your city structure
3. **Add staff users** with appropriate roles
4. **Configure email** with your SMTP provider
5. **Set up integrations** (Newsletter, 311)
6. **Train staff** using STAFF-GUIDE.md
7. **Enable AI** if using OpenAI/Anthropic
8. **Set up monitoring** for production

---

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Getting it running
- [CONFIGURATION.md](./CONFIGURATION.md) - All environment variables
- [STAFF-GUIDE.md](./STAFF-GUIDE.md) - How staff use the system
- [SECURITY.md](./SECURITY.md) - User roles and permissions
- [FAQ.md](./FAQ.md) - Common questions

---

**Last Updated:** March 2026

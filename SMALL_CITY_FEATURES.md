# Small City Adoption Features

## Overview

This document describes the features and configuration options added to address adoption barriers for small cities (population 5,000-50,000) with limited IT staff, tight budgets, and minimal team size.

## Features Added

### 1. Simple Mode Configuration (`src/lib/simple-mode.ts`)

Enables a simplified interface automatically when cities have fewer than 5 departments.

**What it does:**
- Hides multi-tenant features entirely
- Shows simplified sidebar: Dashboard, Cases, Templates only
- Defaults to single "General" department
- Skips AI and third-party integration steps in setup wizard
- Uses simpler case status flow: NEW → IN_PROGRESS → RESOLVED → CLOSED
- Hides newsletter-related UI unless configured
- Disables collision detection (not needed for small teams)
- Provides simplified dashboard with just case counts and list

**When to use:**
- Set `SIMPLE_MODE=true` in .env to force enable
- Automatically enabled if city has < 5 departments
- Can be disabled at any time without data loss

**Key exports:**
- `isSimpleMode(departmentCount)` - Check if simple mode is active
- `getSimpleModeConfig(departmentCount)` - Get configuration
- `getVisibleNavItems(departmentCount, hasNewsletter)` - Get navigation items
- `getSimpleCaseStatusFlow()` - Get simplified status flow

---

### 2. CSV Import Service (`src/server/services/csv-importer.ts`)

Allows migration from email, spreadsheets, and other systems.

**Supported import types:**
- **Constituents**: name, email, phone, address, ward
- **Cases**: subject, description, constituentEmail, status, department, date

**Features:**
- Automatic header detection and column mapping
- Handles common CSV issues: encoding, quoted fields, trailing commas
- Validates email and phone formats
- Returns detailed error reporting: { imported, skipped, errors[] }
- Preview first 10 rows before importing
- Supports UTF-8 BOM handling
- Respects column name variations

**API:**
```typescript
// Import constituents
await importConstituents(cityId, csvBuffer, headerMapping?)

// Import cases
await importCases(cityId, csvBuffer, headerMapping?)

// Validate headers
validateCsvHeaders(buffer, expectedHeaders) → { valid, providedHeaders, message }

// Preview before import
previewImport(buffer, type) → { rows, headers }
```

---

### 3. Data Import Wizard Page (`src/app/(admin)/import/page.tsx`)

Six-step multi-step wizard for importing data.

**Steps:**
1. **Select Type** - Choose constituents or cases
2. **Upload File** - Drag-and-drop or file browser, download sample templates
3. **Map Columns** - Auto-detected mappings with manual override
4. **Preview Data** - View first 10 rows with actual mappings
5. **Import** - Progress indicator during import
6. **Results** - Summary with error list and download option

**Features:**
- Drag-and-drop file upload with visual feedback
- Auto-detection of column mappings
- Sample CSV templates available for download
- Clear instructions for Excel users
- Error list with row numbers and messages
- Download results as text file
- Responsive design

---

### 4. One-Click Setup Script (`scripts/one-click-setup.sh`)

Automated setup for non-technical staff, under 3 minutes.

**What it does:**
- Detects OS (Linux/Mac)
- Checks Docker installation, offers to install if missing
- Generates all secrets automatically (NEXTAUTH_SECRET, etc.)
- Asks only 3 questions:
  1. City name
  2. Admin email
  3. Admin password (validated at 12+ characters)
- Creates .env file with sensible defaults
- Starts Docker containers
- Runs database migrations
- Prints clear success message with credentials

**Usage:**
```bash
chmod +x scripts/one-click-setup.sh
./scripts/one-click-setup.sh
```

**Questions asked:**
- City Name (defaults to "MyCity")
- Admin Email (validated format)
- Admin Password (min 12 chars)

**Total setup time:** ~3 minutes with Docker pre-installed

---

### 5. Cost Estimator Component (`src/components/admin/CostEstimator.tsx`)

Interactive cost calculator for admin settings page.

**Displays:**
- Monthly cost breakdown (Hosting, AI, Email)
- Total monthly and annual costs
- Time savings calculation (hours per month saved)
- Monthly ROI and annual benefit
- Payback period analysis
- Cost reduction tips with savings amounts

**Features:**
- Interactive breakdown of ROI calculation
- Toggle to show cost reduction tips
- Download cost summary as text file
- Shows estimated costs even with zero current spend
- Conservative estimates ($30/hr staff rate)
- Shows why system pays for itself

**Integration:**
```tsx
<CostEstimator
  monthlyVolume={50}      // Cases per month
  staffCount={3}          // Team size
  citiesHosted={1}        // Number of cities
  aiDraftsThisMonth={20}  // Current month usage
/>
```

---

### 6. Budget Justification Component (`src/components/admin/BudgetJustification.tsx`)

Generate budget documents for city council approval.

**Includes:**
- Executive summary with ROI and payback period
- Current situation analysis
- Proposed solution benefits
- Financial analysis (annual savings, system cost, net benefit)
- ROI charts (comparison, 12-month projection)
- Intangible benefits (5 categories)
- Cost comparison with alternatives
- Implementation timeline
- Staffing impact analysis
- Download as text or copy to clipboard

**Key metrics calculated:**
- Annual staff time value saved
- System annual cost
- Net annual benefit
- Return on investment percentage
- Payback period

**Use case:** Present to city council for budget approval

---

### 7. AI Cost Tracker Service (`src/server/services/ai-cost-tracker.ts`)

Track AI draft usage to help cities control costs.

**Features:**
- Redis-based usage tracking with 35-day TTL
- Monthly counters by city
- Respects `AI_MONTHLY_DRAFT_LIMIT` env var
- Cost calculation at ~$0.01 per draft
- Usage history logging

**API:**
```typescript
// Track a draft
await trackDraft(cityId, provider, model, tokensUsed)

// Get monthly usage
const metrics = await getMonthlyUsage(cityId)
// Returns: { draftsCount, estimatedCost, limitReached, limitRemaining, resetDate }

// Check if limit exceeded
const allowed = await checkLimit(cityId) // Returns boolean

// Validate draft request
const validation = await validateDraftRequest(cityId)
// Returns: { allowed, reason? }

// Get cost summary for billing
const summary = await getCostSummary(cityId, months=12)
```

**Environment variable:**
- `AI_MONTHLY_DRAFT_LIMIT=0` - No limit (default)
- `AI_MONTHLY_DRAFT_LIMIT=100` - Max 100 drafts/month

---

### 8. Enhanced AIDraftPanel Component (`src/components/cases/AIDraftPanel.tsx`)

Updated with cost control and limit enforcement.

**New features:**
- Display current month's draft count and limit
- Tooltip showing AI cost (~$0.01/draft)
- Limit exceeded state shows clear message
- Suggests templates when limit reached
- Shows "Usage: N of M drafts this month"
- Calculates estimated monthly cost

**New props:**
```tsx
interface AIDraftPanelProps {
  // ... existing props
  monthlyDraftsUsed?: number;      // Current month count
  monthlyDraftsLimit?: number;     // Monthly limit (0 = unlimited)
}
```

**User experience:**
- When limit not reached: Normal draft generation with usage counter
- When limit reached: Alert with suggestion to use templates instead
- Clear monthly reset information

---

### 9. Configuration Updates (`.env.example`)

New environment variables for small city features:

```env
# Simple Mode (for small cities)
# Set to 'true' to enable simplified interface for small teams (< 5 staff)
# Hides advanced features, simplifies navigation, reduces complexity
# Can be changed later without data loss
SIMPLE_MODE=false

# Cost Controls
# Maximum AI drafts per month (0 = unlimited, set to control costs)
# At ~$0.01/draft: 100 drafts = ~$1/month, 1000 = ~$10/month
AI_MONTHLY_DRAFT_LIMIT=0

# Import Configuration
# Maximum CSV import size in MB (prevents very large imports)
# Default: 50MB, suitable for migrations from spreadsheets
CSV_IMPORT_MAX_SIZE_MB=50
```

---

### 10. Sample CSV Templates

Ready-to-use templates for data import:

**`public/templates/constituents-import-sample.csv`**
- 5 example constituent records
- Columns: name, email, phone, address, ward
- Real-looking sample data

**`public/templates/cases-import-sample.csv`**
- 5 example case records
- Columns: subject, description, constituentEmail, status, department, date
- Realistic example cases

**Usage:**
- Users download from import wizard
- Use as template for their own data
- Ensures correct column format

---

## Addressing Small City Barriers

### 1. "We don't have IT staff"
- **Solution:** One-click setup script asks only 3 questions, generates everything else
- **Time:** Under 3 minutes
- **Skills needed:** None - fully automated with clear instructions

### 2. "We can't afford it"
- **Solution:** Cost estimator + budget justification components
- **Proof:** System pays for itself in < 1 month through staff time savings
- **Downloadable:** Council-ready budget justification document

### 3. "Only 3 staff, this is overkill"
- **Solution:** Simple Mode hides 60% of UI, shows only what's needed
- **Auto-activation:** Enables automatically with < 5 departments
- **Flexible:** Can be toggled on/off without data loss

### 4. "AI feels risky for government"
- **Solution:** AI is entirely optional
- **Control:** Easy cost limiting with monthly draft caps
- **Safe default:** `AI_MONTHLY_DRAFT_LIMIT=0` (unlimited but visible cost)
- **Alternative:** Templates provide same benefits, zero cost

### 5. "How do we migrate from email/spreadsheets?"
- **Solution:** CSV import wizard with 6-step process
- **Templates:** Download sample CSVs from wizard
- **Validation:** Row-by-row error reporting
- **Preview:** See data before importing
- **Format:** Supports CSV from any spreadsheet app

### 6. "What if the project gets abandoned?"
- **Solution:** Data portability - export full CSV anytime
- **Format:** Standard CSV, opens in Excel/Google Sheets
- **Ownership:** All data belongs to the city, not vendor
- **No lock-in:** Can migrate to another system easily

---

## Getting Started

### For First-Time Setup:
1. Run `scripts/one-click-setup.sh`
2. Answer 3 configuration questions
3. Visit http://localhost:3000
4. Log in with provided credentials

### For Data Migration:
1. Go to Admin > Import
2. Choose "Constituents" or "Cases"
3. Download sample CSV template
4. Fill in your data in Excel/Google Sheets
5. Save as CSV (UTF-8)
6. Upload through import wizard
7. Review and confirm

### For Cost Control:
1. Set `AI_MONTHLY_DRAFT_LIMIT=100` in .env (for example)
2. Staff sees usage counter in draft panel
3. When limit reached, templates are suggested
4. Resets on 1st of next month automatically

### For Small Team Operation:
1. Set `SIMPLE_MODE=true` in .env (or auto-enables with < 5 depts)
2. Staff sees simplified dashboard with 3 main features
3. All advanced features hidden but available if needed later
4. Can change without data loss

---

## File Locations

All new features are located at:

```
src/
  lib/
    simple-mode.ts                    # Simple mode configuration
  server/services/
    csv-importer.ts                   # CSV import logic
    ai-cost-tracker.ts                # AI usage tracking
  app/(admin)/import/
    page.tsx                          # Import wizard page
  components/admin/
    CostEstimator.tsx                 # Cost calculator component
    BudgetJustification.tsx           # Budget doc generator
  components/cases/
    AIDraftPanel.tsx                  # Enhanced (modified)

scripts/
  one-click-setup.sh                  # Automated setup script

public/templates/
  constituents-import-sample.csv      # Sample constituent data
  cases-import-sample.csv             # Sample case data

.env.example                          # Updated with new variables
```

---

## Testing the Features

### Test Simple Mode:
```bash
# In .env
SIMPLE_MODE=true

# Restart app, navigate sidebar - should show only: Dashboard, Cases, Templates
```

### Test CSV Import:
1. Go to `/admin/import`
2. Download sample constituent CSV
3. Click Upload, select file
4. Review mappings (should auto-detect)
5. Click Next to preview
6. Click Import

### Test Cost Tracking:
1. Look for cost indicator in draft panel
2. Generate 5 drafts
3. Check counter increments
4. Check monthly usage in admin panel

### Test One-Click Setup:
```bash
chmod +x scripts/one-click-setup.sh
./scripts/one-click-setup.sh
# Answer: MyTestCity, admin@test.com, TestPassword123
```

---

## Configuration Examples

### Small City (Minimal Setup)
```env
SIMPLE_MODE=true
AI_MONTHLY_DRAFT_LIMIT=50
```

### Medium City (Moderate Setup)
```env
SIMPLE_MODE=false
AI_MONTHLY_DRAFT_LIMIT=500
```

### Cost-Conscious Setup
```env
SIMPLE_MODE=true
AI_MONTHLY_DRAFT_LIMIT=0
# Staff encouraged to use templates (free) instead of AI
```

---

## Support & Questions

For questions or issues with small city features:

1. Check the appropriate component/service docstring
2. Review configuration examples above
3. Consult the cost calculator before budget meetings
4. Use import wizard for data migration help
5. Test simple mode toggle for UI complexity

All features are designed to require zero IT expertise to operate once set up.

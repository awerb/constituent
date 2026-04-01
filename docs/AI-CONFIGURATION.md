# AI Configuration Guide

Staff can use AI to auto-draft responses to constituents. This guide covers setup and best practices.

## Supported Providers

### OpenAI

Models:
- **gpt-4** (Most capable, slowest, $0.03/draft)
- **gpt-4-turbo** (Good balance, $0.01/draft)
- **gpt-3.5-turbo** (Fast, cheaper, $0.001/draft)

Recommended: **gpt-4-turbo** (best cost/speed/quality tradeoff)

### Anthropic Claude

Models:
- **claude-3-opus** (Most capable, slowest, $0.015/draft)
- **claude-3-sonnet** (Balanced, $0.003/draft)
- **claude-3-haiku** (Fast, cheapest, $0.0008/draft)

Recommended: **claude-3-sonnet** (good quality, fast)

## Setup

### 1. Get API Key

#### OpenAI

1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Copy key (starts with `sk-proj-`)
4. Save in secure location

#### Anthropic

1. Go to https://console.anthropic.com
2. Go to **Account > API Keys**
3. Click **Create Key**
4. Copy key (starts with `sk-ant-`)
5. Save in secure location

### 2. Add to .env

```bash
# For OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4-turbo

# Or for Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-sonnet
```

### 3. Test Connection

Go to `/admin/settings` > **AI Configuration** > **Test Connection**

Should show:
```
✓ Connected to OpenAI
✓ Model: gpt-4-turbo
✓ Monthly budget: $150
✓ Usage this month: $3
```

## How AI Drafting Works

### Staff Workflow

1. Staff opens case
2. Clicks **Get AI Draft**
3. System sends to AI:
   - Constituent's issue
   - Department context
   - Response tone setting
   - Relevant templates
4. AI generates 3 alternatives
5. Staff picks one, edits, sends

### What AI Sees

```
CONSTITUENT: Alice Smith
ISSUE: Pothole on Main Street

Your issue: "Large pothole at Main and 5th. My
vehicle hit it yesterday. It's getting worse and
is a safety hazard."

DEPARTMENT: Public Works
TONE: Helpful and professional
LANGUAGE: English

Respond in 50-200 words, addressing the issue
and setting expectations for resolution.
```

### What AI Generates

```
Option 1 (Professional):
"Thank you for reporting this pothole. We take
safety concerns seriously. Our team will inspect
the location within 48 hours and begin repairs
within 7 business days. Please monitor the area
and report if it worsens."

Option 2 (Empathetic):
"We're sorry you experienced damage from this
pothole—that's exactly what we're trying to prevent.
You'll have our full attention: inspection within 48
hours, repairs starting the next week."

Option 3 (Action-oriented):
"ACTION PLAN: 1) Our crew will inspect tomorrow.
2) Temporary patch within 2 days. 3) Permanent
repair within 7 days. We'll update you each step."
```

Staff chooses best fit and edits as needed.

## Tone Settings

Configure tone at `/admin/settings` > **AI Configuration**:

```
Default Tone: Helpful

☑ Helpful (empathetic, clear)
☑ Professional (formal, official)
☑ Action-oriented (step-by-step)
☑ Friendly (conversational, warm)

Department-specific tones:
  Public Works: Professional
  Parks: Friendly
  Code Enforcement: Formal
```

Each tone is a system prompt that guides the AI:

```
Helpful:
"You are a helpful city staff member responding
to a concerned constituent. Be empathetic, clear,
and action-oriented."

Professional:
"You are a professional city representative.
Be formal, courteous, and provide clear next
steps."

Action-oriented:
"Provide step-by-step action plan with timeline."

Friendly:
"Be warm, conversational, and supportive. Use
their name and show you care."
```

## Cost Estimation

### Monthly Budgets

```
Low volume (< 10 cases/day):
  OpenAI gpt-3.5-turbo: $3-5/month
  OpenAI gpt-4-turbo: $15-20/month
  Claude Sonnet: $5-10/month

Medium volume (10-50 cases/day):
  OpenAI gpt-3.5-turbo: $15-30/month
  OpenAI gpt-4-turbo: $75-100/month
  Claude Sonnet: $25-50/month

High volume (50+ cases/day):
  OpenAI gpt-3.5-turbo: $50-100/month
  OpenAI gpt-4-turbo: $250-500/month
  Claude Sonnet: $100-200/month
```

### Monitor Spending

Go to `/admin/settings` > **AI Usage**:

```
This Month:
  Drafts generated: 342
  Total cost: $12.50
  Cost per draft: $0.036

Budget: $150/month
Used: $12.50 (8%)
Remaining: $137.50

Projected: $50/month (if usage stays constant)
```

Set budget alerts at $100 and $130.

## Disabling AI

If you don't want AI assistance:

### Option 1: Remove API Key

```bash
# In .env, remove or empty the key:
OPENAI_API_KEY=
# or
ANTHROPIC_API_KEY=

# Restart application
docker-compose restart app
```

Staff see grayed-out "Get AI Draft" button instead of error.

### Option 2: Disable in Admin UI

Go to `/admin/settings` > **Features**:

```
☑ AI Response Drafting    ← Uncheck to disable
```

Restart application. Button disappears from UI.

## Privacy Considerations

### What Data Goes to AI?

When staff clicks "Get AI Draft":

```
✓ Constituent's issue text
✓ Department name
✓ Tone setting
✓ Language preference
✗ Constituent name
✗ Email address
✗ Phone number
✗ Internal notes
✗ Staff member email
```

Constituent's PII never sent to AI provider.

### Data Retention

- **OpenAI**: Deletes data after 30 days (can be shorter)
- **Anthropic**: Doesn't retain data after API call returns

Both comply with GDPR/CCPA requirements.

### Sensitive Content

If issue contains PII, staff should:

1. Edit issue before clicking "Get AI Draft"
2. Remove names/emails/SSNs from text
3. Use placeholders: "constituent mentioned address"

Example:
```
Bad: "John Smith at 123 Oak Lane says pothole"
Good: "Constituent at [address withheld] reports pothole"

Then draft becomes general and safe to share.
```

## Best Practices

### Review All Drafts

Never send AI draft without review:

1. Does it address the issue?
2. Does it match city's voice?
3. Are timelines realistic?
4. Are there technical errors?
5. Does it sound natural?

Edit anything that doesn't feel right.

### Use for Inspiration

AI is a starting point, not a finished product:

```
AI draft: "We will investigate this matter forthwith."
Your edit: "We'll send someone out this week to check."

Much better—more natural and specific.
```

### Combine with Templates

Templates + AI = best results:

```
1. Pick "Standard Acknowledgment" template
2. Get AI draft
3. Merge best parts of each
4. Send

Result: Fast, professional, personalized response
```

### Consistent Tone

All responses should match your city's voice. Use tone settings to stay consistent:

```
All Public Works → Professional tone
All Parks → Friendly tone
All Code Enforcement → Formal tone

Staff don't need to edit tone, just content.
```

### Handle Sensitive Topics

For difficult issues (complaints about city, safety concerns):

1. Get AI draft as suggestion only
2. Heavily edit to add genuine empathy
3. Include concrete next steps
4. Have manager review before sending

AI shouldn't handle legal/liability issues alone.

## Troubleshooting

### "AI feature is disabled"

1. Check API key is set in .env (not empty)
2. Check feature is enabled in `/admin/settings`
3. Check API account has credits

### "Rate limit exceeded"

AI provider says too many requests. Usually means:

1. API key quota used up for the month
2. Too many requests in short time
3. API account suspended

Solution:
- Check account at OpenAI.com / Anthropic.com
- Buy more credits if needed
- Contact support if account suspended

### "Invalid API key"

Key is wrong or expired:

1. Log into OpenAI/Anthropic console
2. Generate new key
3. Update .env
4. Restart application

### Drafts are low quality

1. Check which model is set (gpt-4 vs gpt-3.5?)
2. Check tone setting matches department
3. Try different provider (OpenAI vs Anthropic)
4. Try different model (cheaper models = lower quality)

If consistently bad, consider templates instead.

### High costs

1. See which staff use it most: `/admin/usage`
2. Train staff to be selective (not every case needs AI)
3. Switch to cheaper model (gpt-3.5-turbo)
4. Use templates more, AI less

## Fallback Strategy

If AI fails, staff still has options:

```
1. Get AI Draft button
   ↓
2. AI fails (error, API down, rate limit)
   ↓
3. "Get Template Instead" appears
   ↓
4. Staff picks template
   ↓
5. Sends response

Constituents always get response, with or without AI.
```

## Model Selection Guide

| Situation | Recommendation | Reason |
|-----------|---------------|--------|
| Highest quality needed | GPT-4 | Best capabilities |
| Good balance | GPT-4-turbo, Claude Sonnet | Fast + capable |
| Low budget | GPT-3.5-turbo, Claude Haiku | Cheap, decent quality |
| Complex reasoning | GPT-4, Claude Opus | Better logic |
| Simple responses | GPT-3.5-turbo, Claude Haiku | Faster, good enough |
| Brand new features | Claude 3 | Newest capabilities |

## Ethical Use

Guidelines for AI-assisted responses:

1. **Transparency**: Don't claim staff wrote something AI drafted
2. **Accuracy**: Verify all facts before sending
3. **Appropriateness**: AI shouldn't handle apologies or admissions
4. **Accountability**: Staff accountable for what they send
5. **Fairness**: Same quality service regardless of AI usage
6. **Trust**: Constituents shouldn't know it was AI-drafted

## Advanced: Custom System Prompt

(For advanced users) Customize AI instruction:

Go to `/admin/settings` > **Advanced**:

```
Custom System Prompt:

"You are [DEPARTMENT] staff in [CITY].
Respond to constituent issues with:
- Empathy and clarity
- Specific timeline (not vague "soon")
- Contact information for follow-up
- Escalation path if needed

Always [POLICY 1], never [POLICY 2].
Use [TONE] tone.
Length: 50-200 words."
```

Leave blank to use defaults.

## Testing

### Test With Sample Cases

Go to `/admin/ai-testing`:

```
Sample Case:
  Issue: "Pothole on Main Street"
  Tone: Professional
  Department: Public Works

Model: gpt-4-turbo

[Generate Draft]

Result: [AI generates response]

Rate Quality: ⭐⭐⭐⭐ (4/5)
```

Good for evaluating different models before going live.

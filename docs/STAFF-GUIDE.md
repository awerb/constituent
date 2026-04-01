# Staff Guide

**A practical guide for city staff responding to constituent cases.**

**Quick Links:** [Getting Started](#getting-started) | [Dashboard](#dashboard-overview) | [Inbox](#inbox-mastery) | [Cases](#case-management-lifecycle) | [Responding](#responding-to-constituents) | [Tips](#tips--best-practices)

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Inbox Mastery](#inbox-mastery)
4. [Case Management Lifecycle](#case-management-lifecycle)
5. [Responding to Constituents](#responding-to-constituents)
6. [Internal Collaboration](#internal-collaboration)
7. [Tips & Best Practices](#tips--best-practices)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Your First Login

1. Go to `https://respond.yourdomain.com` (or your city's URL)
2. Enter **email** and **temporary password** (sent by your admin)
3. Click **Sign In**
4. You're taken to the **Dashboard**

### Change Your Password (First Login)

1. Click your name in top-right corner
2. Select **Change Password**
3. Enter current password, then new password (8+ characters)
4. Save

**Password tips:**
- Mix uppercase, lowercase, numbers, and symbols
- Avoid dictionary words and common patterns
- Don't reuse old passwords

### First Things to Do

1. **Complete your profile:** Name, phone (optional), profile picture
2. **Set preferences:** Email notifications, language, timezone
3. **Explore your inbox:** See your assigned cases
4. **Review templates:** Familiarize yourself with standard responses

---

## Dashboard Overview

Your **Dashboard** shows you at a glance:

```
┌────────────────────────────────────────────────────────────────┐
│  YOUR CASES THIS WEEK                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Assigned to You:    8 cases                                  │
│  New (Unassigned):  15 cases                                  │
│  In Progress:        3 cases                                  │
│  Ready to Send:      2 responses                              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  SLA STATUS                                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ On Time:          8 cases                                  │
│  ⚠ At Risk:          1 case (deadline in 2 hours)             │
│  ✗ Breached:         0 cases                                  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  TOP ISSUES THIS WEEK                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Potholes:          12 cases                                  │
│  Parking:            8 cases                                  │
│  Tree maintenance:   5 cases                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Click on any number** to see the list of cases.

### Dashboard Cards Explained

| Card | Means | Action |
|------|-------|--------|
| **Assigned to You** | Cases you're responsible for | Review and respond |
| **New (Unassigned)** | Cases waiting for assignment | Assign to yourself if you can help |
| **In Progress** | Cases you're actively working on | Check if any need more work |
| **Ready to Send** | Your draft responses waiting to send | Review and send |
| **At Risk** | Deadline in <4 hours | Priority! Respond NOW |
| **Breached** | Deadline passed | Escalate to manager immediately |

---

## Inbox Mastery

Your **Inbox** is where all your assigned cases live.

### Default View

```
┌─────────────────────────────────────────────────────────────┐
│ FILTER: All Status ▼ | All Priority ▼ | Last 7 Days ▼      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CR-2024-00087 | Alice Smith | Pothole Main & 5th | 2h ago│
│ Status: NEW  |  Priority: NORMAL  |  SLA: 2 days         │
│                                                             │
│ CR-2024-00086 | Bob Johnson | Permit Question | 5h ago    │
│ Status: IN_PROGRESS  |  Priority: HIGH  |  SLA: 1 day    │
│                                                             │
│ CR-2024-00085 | Carol White | Noise Complaint | 1d ago    │
│ Status: RESOLVED  |  Priority: NORMAL  |  SLA: OK        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Filter Your Inbox

Use filters to focus on what matters:

| Filter | Use When |
|--------|----------|
| **Status: New** | You want to see new cases you haven't started |
| **Status: In Progress** | You want to see cases you're working on |
| **Priority: High** | You want urgent cases first |
| **Priority: Critical** | Something is very urgent (fire, safety) |
| **Last 7 Days** | You want fresh cases |
| **Last 30 Days** | You want your full workload |
| **Search: email/name** | You want cases from specific person |

### Inbox Actions (Right-Click Menu)

Right-click any case:

```
├─ Assign to Me
├─ Reassign to... (pick someone else)
├─ Close (mark done)
├─ Priority: Set to HIGH, CRITICAL, etc.
├─ Add Internal Note
└─ Refresh
```

### Keyboard Shortcuts in Inbox

| Shortcut | Action |
|----------|--------|
| `J` / `K` | Move to next/previous case |
| `O` | Open selected case |
| `A` | Assign to self |
| `R` | Reassign |
| `C` | Close case |
| `N` | New internal note |
| `Ctrl+F` | Search inbox |
| `Esc` | Clear selections |

---

## Case Management Lifecycle

Cases flow through statuses. Understand what each means.

```
┌─────────────────────────────────────────────────────────────┐
│  Case Created (from web form, email, or newsletter signal)  │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  NEW — No one assigned. Acknowledgment email sent.          │
│  Action: Click "Assign to Me" to take ownership             │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  ASSIGNED — You own it. Read through constituent's issue.   │
│  Action: Click "Respond" or "Generate AI Draft"             │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  IN_PROGRESS — Your draft response is being prepared.       │
│  Action: Finish writing, edit AI draft, use template        │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  RESOLVED — Response sent to constituent. You're done!      │
│  Action: Constituent received answer. Case closed.          │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  CLOSED — Archived. No more action needed.                  │
│  Action: Keep as record for audit trail.                    │
└─────────────────────────────────────────────────────────────┘
```

### Status Guide

| Status | Meaning | Your Next Step |
|--------|---------|----------------|
| **NEW** | Just created, no one assigned | Assign to yourself if you can help |
| **ASSIGNED** | Someone owns it (you?) | Start working on response |
| **IN_PROGRESS** | Draft is being written | Finish and send response |
| **RESOLVED** | Constituent got response | Consider case done |
| **CLOSED** | Archived | Move on; don't re-open unless absolutely needed |

---

## Responding to Constituents

This is the core of your job. Do it well.

### Viewing a Case

Click on a case in Inbox to see:

```
┌──────────────────────────────────────────────────┐
│  Case CR-2024-00087                              │
│  From: Alice Smith (alice@example.com)           │
├──────────────────────────────────────────────────┤
│  Created: Mon Jan 15, 10:30 AM                   │
│  Department: Public Works                        │
│  Status: NEW (unassigned)                        │
│  Priority: NORMAL                                │
│  SLA Deadline: Wed Jan 17, 10:30 AM (2 days)   │
├──────────────────────────────────────────────────┤
│  ISSUE: "Pothole on Main Street"                │
│                                                  │
│  "Large pothole at the intersection of Main     │
│   and 5th Street. My car hit it yesterday.      │
│   It's getting worse and is a safety hazard."   │
│                                                  │
├──────────────────────────────────────────────────┤
│  ACTIONS:                                        │
│  [Assign to Me] [Generate AI Draft] [Template] │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Responding Steps

#### 1. Read the Issue Carefully

- What is the constituent asking for?
- Is there any relevant context or history?
- Do you have the information to respond?

#### 2. Draft Your Response

**Option A: Write from scratch**
```
1. Click [Respond]
2. Type your response in the text box
3. Preview to check tone and grammar
4. Click [Save Draft]
```

**Option B: Use AI draft (if available)**
```
1. Click [Generate AI Draft]
2. AI creates 3 alternatives
3. Pick one you like
4. Edit and customize
5. Click [Save Draft]
```

**Option C: Use template**
```
1. Click [Use Template]
2. Pick relevant template
3. Template auto-fills
4. Edit as needed
5. Click [Save Draft]
```

### Writing Good Responses

**DO:**
- ✓ Address the specific issue
- ✓ Set expectations (timeline, next steps)
- ✓ Thank them for reporting
- ✓ Use simple, clear language
- ✓ Include case reference number
- ✓ Provide way to follow up

**DON'T:**
- ✗ Ignore part of their question
- ✗ Make promises you can't keep
- ✗ Use jargon or abbreviations
- ✗ Be defensive or rude
- ✗ Share internal politics or decisions
- ✗ Make medical/legal diagnoses

### Example Response

**Bad:**
```
Hi,

We got your report. We'll look into it.

Thanks,
Public Works
```

**Good:**
```
Hi Alice,

Thank you for reporting this pothole. Safety is our top priority.

We've inspected the location at Main and 5th and added it to our repair queue. Based on current weather and crew availability, we expect to complete repairs within 1-2 weeks.

Your case reference is CR-2024-00087. You can check status anytime at: [link]

We appreciate your patience and contribution to keeping our streets safe.

Best regards,
Public Works Department
City of San Francisco
```

### Sending the Response

```
1. Click [Send Response]
2. Email sent to constituent
3. Case marked RESOLVED
4. You get confirmation
5. Constituent receives email with your response
```

---

## Internal Collaboration

### Adding Internal Notes

Internal notes are **NOT** sent to constituents. Use for:
- Staff-to-staff questions
- Technical notes
- Investigation findings
- Scheduling information

```
Click [+ Add Note]
Select [Internal Note]
Type your note
Choose visibility: "My Team Only" or "All Staff"
Save
```

**Important:** Internal notes are **excluded from public records (FOIA) exports**. Mark things as PUBLIC only if okay to share.

### Assigning Cases to Colleagues

```
1. Open case
2. Click [Reassign]
3. Pick colleague's name
4. (Optional) Add note: "This is in your area"
5. Click [Reassign]

They get notified and case moves to their inbox
```

### Escalating to Manager

If a case is complex or you need help:

```
1. Add internal note: "Needs manager review - customer upset, may need legal?"
2. Click [Escalate to Manager]
3. Case moves to manager's queue
4. You stay CC'd on responses
```

---

## Tips & Best Practices

### Speed

- **Acknowledge quickly:** Respond within 24 hours if possible (even if just "we're looking into it")
- **Set expectations:** "We'll have an answer by Friday" beats silence
- **Follow up:** If waiting for info, let them know: "Update coming Monday"

### Tone

- **Be human:** Not robotic. People can tell if you care.
- **Validate their concern:** "That does sound frustrating..."
- **Offer next steps:** What happens after your response?

### Templates

- Use templates for common issues (saves time, consistent quality)
- Customize each response (don't send identical copy-paste)
- Store effective responses as templates

### AI Drafts

- **Use as starting point:** Don't send unedited AI responses
- **Personalize:** Add specific details, local references
- **Check accuracy:** Make sure all facts are correct
- **Review tone:** Does it sound like you/your department?

### Multi-Language Constituents

- If constituent wrote in Spanish (or other language), respond in Spanish if possible
- If you can't, note it: "Our Spanish-speaking staff will follow up by [date]"
- Never ignore non-English constituents

### Difficult Constituents

- Stay professional (even if angry)
- Don't take it personally
- Escalate to manager if:
  - They're threatening
  - You feel unsafe
  - It's beyond your authority
  - They need mediation

### Complex Issues

- Ask for help from colleagues or manager
- Don't guess or make up answers
- Better to say "We're investigating" than "No"
- Follow up once you have real answer

---

## Keyboard Shortcuts

**In case view:**

| Key | Action |
|-----|--------|
| `R` | Respond |
| `G` | Generate AI Draft |
| `T` | Use Template |
| `S` | Send Response |
| `N` | Add Internal Note |
| `A` | Assign to self |
| `E` | Escalate |
| `C` | Close case |
| `Esc` | Back to inbox |

**Global:**

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open command palette (search cases) |
| `Ctrl+/` | Show all shortcuts |
| `?` | Help |

---

## Troubleshooting

### Can't assign case to yourself

**Cause:** Case already assigned or you lack permissions.

**Fix:**
- Click [Reassign] and select your name
- Ask manager if you don't have permission

### AI Draft isn't working

**Cause:** AI disabled or API key invalid.

**Fix:**
- Ask your admin if AI is enabled
- Use template or write manually

### Email not sending

**Cause:** SMTP misconfigured or network issue.

**Fix:**
- Click [Send] again
- Ask your admin to check email setup
- Check your internet connection

### Can't find a case

**Use search:** Ctrl+K or search box
- Search by case number: `CR-2024-00087`
- Search by name: `Alice Smith`
- Search by email: `alice@example.com`

### Constituent replied but I don't see it

**Cause:** Response came as new case, not reply to old case.

**Fix:**
- Search their email address
- Look for new cases from same person
- Admin can merge if needed

### SLA deadline passed

**Action:**
- Respond immediately (better late than never)
- Add note explaining delay
- Notify your manager
- Case is flagged but you can still resolve it

---

## Daily Workflow Example

**Morning (9 AM - 10 AM)**
1. Check Dashboard — any breached SLAs?
2. Filter Inbox: Status = NEW, Priority = HIGH
3. Assign 3 new cases to yourself
4. Read each thoroughly

**Mid-Morning (10 AM - 12 PM)**
1. Draft responses to 2-3 cases
2. Use AI draft or template where applicable
3. Edit and customize
4. Save drafts (don't send yet)

**After Lunch (1 PM - 2 PM)**
1. Review your draft responses
2. Correct any typos/tone
3. Send all ready responses
4. Monitor for replies

**Late Afternoon (3 PM - 4 PM)**
1. Check Dashboard again
2. Any urgent/at-risk cases?
3. Address those first
4. Wrap up remaining cases

**Before Leaving (4:30 PM)**
1. Check your inbox
2. Any critical cases?
3. If not, handoff to next shift or manager
4. Log out securely

---

## Next Steps

1. **Practice:** Start with simple cases (templates work great)
2. **Ask:** When in doubt, ask a colleague or manager
3. **Review:** Check your responses quality over time
4. **Improve:** Use feedback to get better at writing
5. **Specialize:** Become expert in your department's issues

---

## Quick Reference

**Need help?** Ask your manager or see documentation:
- [ADMIN-GUIDE.md](./ADMIN-GUIDE.md) - Admin features
- [AI-CONFIGURATION.md](./AI-CONFIGURATION.md) - AI drafting details
- [FAQ.md](./FAQ.md) - Common questions

---

**Last Updated:** March 2026

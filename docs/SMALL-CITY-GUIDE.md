# Setting Up Constituent Response for a Small City

**A friendly, practical guide for city managers, administrators, and IT staff in towns of 5,000-50,000 people.**

This guide assumes you're not a software engineer and you want to get this running without a lot of technical fuss. Everything here is designed to be doable by one person in an afternoon.

---

## Table of Contents

1. [Is This Right for Your City?](#is-this-right-for-your-city)
2. [What You'll Need](#what-youll-need)
3. [Getting Started (Fast Path)](#getting-started-fast-path)
4. [Your First Week](#your-first-week)
5. [Simple Mode Explained](#simple-mode-explained)
6. [Templates: Your Secret Weapon](#templates-your-secret-weapon)
7. [Training Your Team](#training-your-team)
8. [Presenting to City Council](#presenting-to-city-council)
9. [Common Concerns from Council Members](#common-concerns-from-council-members)
10. [Growing Beyond Simple Mode](#growing-beyond-simple-mode)

---

## Is This Right for Your City?

**Quick decision framework:**

**This system is right for you if:**
- You get 5+ constituent contacts per week (260+ per year)
- You spend time organizing emails or wondering who handled what
- You want constituents to get acknowledgment when you receive their request
- You need to answer "How long does it take us to respond?" (for council or grant applications)
- Someone has asked: "What happened to my request?" and you couldn't find it easily

**Skip this system if:**
- You get fewer than 3 requests per week (fewer than 150/year)
- You have only 1 person handling requests (one person probably doesn't benefit from email organization)
- Your requests are purely verbal (phone calls, in-person meetings, no written record needed)

**You might want to wait if:**
- You're in the middle of a major staffing change
- You're about to switch email providers (wait until that's done)
- You're implementing a 311 system already (integrate with that first)

For most towns of 8,000-20,000 people: **this is exactly what you need**.

---

## What You'll Need

### Hardware

- **To test it:** Any computer (Mac, Linux, Windows with WSL) with Docker Desktop (free)
- **To run it in production:** A $6/month server from DigitalOcean, Vultr, or Linode (takes 20 minutes to set up)

Both are optional. You can start with your personal computer to test it for free.

### People

- **To set up:** You (the person reading this), one afternoon
- **To run it:** 1 admin person (the one who set it up), 5-10 minutes per week
- **To respond to cases:** Your existing city staff (no additional staff needed)

### Time

- **To get running:** 30 minutes (including testing)
- **To configure for your city:** 1-2 hours (departments, staff, templates)
- **To train staff:** 30 minutes per person (training session)

### Cost

- **Software:** Free (MIT open-source license, no licensing fees)
- **Server:** $6-12/month (optional; you can use your own computer to start)
- **Domain name:** $10/year (optional; you can use IP address)
- **Email sending:** $0 (use your existing city email account via SMTP)
- **AI responses:** $0-5/month (optional; completely turned off by default)

**Total for a small city: $6-20/month, or free to test.**

---

## Getting Started (Fast Path)

### Option A: Test It on Your Computer First (Free, 5 minutes)

If you want to see what this looks like before committing to a server:

1. Download Docker Desktop (free, from docker.com)
2. Open terminal/command prompt
3. Run these commands:

```bash
git clone https://github.com/your-org/constituent-response.git
cd constituent-response
docker compose up -d
# Wait 30 seconds
open http://localhost:3000
# Login with credentials from .env file
```

4. You now have a working system on your computer
5. Play with it, send yourself a test case, try responding
6. When done: `docker compose down`

### Option B: Go Live on a Real Server (20 minutes)

When you're ready to actually use this for your city:

1. Follow **"$6/Month Production Deployment"** in DEPLOYMENT.md (takes 20 minutes)
2. Then follow **"Small City Quick Setup"** in ADMIN-GUIDE.md (takes 15 minutes)
3. You're live

Total: 35 minutes from zero to accepting constituent requests.

### Which Option?

**Test first (Option A) if:**
- You want to show city council what it looks like before you commit money
- You're not sure if you like it
- You want to train staff on your computer before going live

**Go straight to production (Option B) if:**
- You're confident this is what you want
- You want it live this week
- Your staff are ready to use it immediately

---

## Your First Week

### Day 1: Set Up (1 hour)

Follow the setup in DEPLOYMENT.md and ADMIN-GUIDE.md. At the end of the day:
- System is running
- At least one admin account exists (yours)
- Departments are created (Public Works, Parks, Code Enforcement, etc.)
- Email is configured (so you can send test emails)

### Day 2: Invite Staff (30 minutes)

1. Go to Admin > Users
2. Add your staff members one by one (2-3 people typical for small city)
3. They get email invites with temporary passwords
4. They log in, change their password
5. You're done

Send them this message:

> "We're using a new system called Constituent Response to track requests. When a constituent contacts us, their request appears as a case in your dashboard. You'll click the case, type your response, and send it. You can use templates for common responses (I'll show you these). Questions? Ask [admin person]. Here's a 30-minute training video: [link]"

### Day 3: Create Templates (1 hour)

Go to Admin > Templates and create 3-5 template responses. Here are common ones for small cities:

**Template 1: Standard Acknowledgment**
```
Dear [CONSTITUENT_NAME],

Thank you for contacting us about [TOPIC]. We have received your request and will investigate/process it promptly.

Case Reference: [CASE_REF]

We aim to respond within 2 business days. You will receive an update at [CONSTITUENT_EMAIL].

Best regards,
[CITY_NAME] Response Team
```

**Template 2: Road/Infrastructure Issue**
```
Dear [CONSTITUENT_NAME],

Thank you for reporting the issue with [LOCATION]. Our Public Works team has inspected the location and added it to our repair queue.

Estimated timeline: [TIMELINE]
Case Reference: [CASE_REF]

We appreciate your patience and your commitment to making [CITY_NAME] better.

Best regards,
Public Works Department
```

**Template 3: Resolved (Generic)**
```
Dear [CONSTITUENT_NAME],

Thank you for your patience. We have completed our investigation/action regarding your request about [TOPIC].

[INSERT SPECIFIC UPDATE HERE]

Case Reference: [CASE_REF]

If you have further questions, please reply to this email.

Best regards,
[CITY_NAME] Response Team
```

**Template 4: Forwarded (If Issue Needs Investigation)**
```
Dear [CONSTITUENT_NAME],

Thank you for contacting us. We have forwarded your request about [TOPIC] to the appropriate department.

You will receive an update within 2-3 business days.

Case Reference: [CASE_REF]

Best regards,
[CITY_NAME] Response Team
```

**Template 5: Out of Scope (For Requests You Can't Handle)**
```
Dear [CONSTITUENT_NAME],

Thank you for reaching out. Your request about [TOPIC] is outside the scope of city government.

[EXPLAIN WHAT AGENCY HANDLES THIS, if applicable]

We appreciate your engagement with the city.

Best regards,
[CITY_NAME] Response Team
```

Spend 30 minutes customizing these with your city's actual language. Then show them to your department heads. Ask: "Do these sound right?" Make adjustments.

### Day 4: Handle Your First Real Case (30 minutes)

Here's what happens:

1. A constituent emails `cityresponse@yourtown.gov` (or uses your web form)
2. The email automatically creates a "case" in the system
3. It appears in your staff member's dashboard
4. They click the case
5. They pick a template (e.g., "Standard Acknowledgment")
6. The template fills in, they edit it for the specific request
7. They click "Send"
8. Constituent gets an automated response immediately with their case reference number

You've now successfully handled a case in the new system. Call a quick team meeting (15 minutes) and do a victory lap. "We handled that case in the new system. No one's email got lost, the constituent got acknowledged immediately, and we have an audit trail. This is working."

### Day 5: Review What You've Built (30 minutes)

Go to the dashboard. Look at:
- How many cases came in this week?
- How many have responses?
- Average response time

You now have data. Print it. Show city council: "In one week, we handled X cases, averaged Y response time." This is the foundation for your council presentation.

---

## Simple Mode Explained

Constituent Response has two interfaces: **Simple Mode** (clean, focused) and **Full Mode** (all features).

### What Simple Mode Shows Staff

When a staff member logs in, they see:

```
[Your Cases] [Search] [Filter]

┌─────────────────────────────────────────┐
│ NEW - Pothole on Main Street            │  <- Click to open
│ Submitted: Jan 15, 10:00 AM             │
│ Assigned to: You                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ IN_PROGRESS - Permit Question           │
│ Submitted: Jan 14, 3:00 PM              │
│ Assigned to: You                        │
└─────────────────────────────────────────┘
```

When they click a case:

```
[CASE DETAILS]

Subject: Pothole on Main Street
From: alice@example.com
Received: Jan 15, 10:00 AM
Case Reference: CR-2024-00001

Description:
"There's a large pothole on Main Street in front of the post office.
It's been there for weeks. Cars are swerving around it."

[Internal Notes section - only staff see this]
[Your notes: "Inspected - added to repair queue for next week"]

[Use Template] [Type Custom Response]

[Send Response]
```

That's it. Simple, clean, focused on the job: respond to the case.

### What Simple Mode Hides (on purpose)

Staff do NOT see:
- Priority levels (you can set priorities, but they don't see them)
- Custom fields (those are admin-only)
- Advanced workflows (too confusing for frontline staff)
- AI draft button (unless you explicitly turn it on)
- Ability to reassign cases (managers handle that)

Why hide these? Less confusing. Staff focus on their job: responding. Managers handle the logistics.

### When to Turn On Full Mode

After 2-3 weeks, if staff say: "I want to do more," you can turn on Full Mode for them. Then they see:
- Priority/SLA status
- Ability to assign cases
- AI draft generator (if enabled)
- Custom fields
- Advanced reports

Most small city staff never ask for Full Mode. The Simple interface is all they need.

### How to Switch

**For everyone:** Admin > Settings > Interface Mode > toggle to "Full"

**For one person:** Find their user account > toggle "Use Full Interface" checkbox

---

## Templates: Your Secret Weapon

Templates are the secret weapon for small cities. Here's why:

**Without templates:**
- Staff write responses from scratch every time (5-10 minutes per case)
- Quality varies (some responses are detailed, some are terse)
- Tone is inconsistent
- People misspell city names and case numbers

**With templates:**
- Staff pick a template, edit it for the specific case (1-2 minutes per case)
- Quality is consistent (template was approved by management)
- Tone is professional and consistent
- Case numbers are automatically inserted correctly

**Time saved:** 3-5 minutes per case × 50 cases/month = 150-250 minutes/month = 2-4 hours/month = 24-48 hours/year.

For a small city, this is huge.

### The 5 Essential Templates

Every small city should have these:

**1. Thank You (Acknowledgment)**
- Used when you receive a request that you need to investigate
- Tells constituent: "We got it, we're looking into it"
- Example: pothole reports, permit questions, complaint investigations

**2. Resolved (Positive Outcome)**
- Used when you've fixed the issue or solved the problem
- Example: "We fixed the pothole," "We approved your permit"

**3. Resolved (Different Department)**
- Used when issue belongs to county/state/private sector
- Example: "This is a state highway; call the state DOT"

**4. More Information Needed**
- Used when you need more details from the constituent
- Example: "We need your property address to look up zoning"

**5. In Progress (Update)**
- Used when issue is being worked on but not yet resolved
- Example: "We've sent this to Public Works; they'll repair it next week"

### Real-World Examples from Small Cities

**For Parks Department:**
```
Thank you for reporting the issue at [PARK_NAME].
Our staff has inspected the [EQUIPMENT/FACILITY] and determined:
[CONDITION DESCRIPTION]

We will [ACTION] on [TIMELINE].

Case Reference: [CASE_REF]
```

**For Code Enforcement:**
```
Thank you for reporting the code violation.
We have inspected the property at [ADDRESS] and documented:
[VIOLATION DETAILS]

The property owner has been notified and has [TIMELINE] to comply.
We will follow up on [DATE].

Case Reference: [CASE_REF]
```

**For Planning/Building:**
```
Thank you for your inquiry about [TOPIC].
[SPECIFIC ANSWER]

If you would like to discuss further, please contact:
[DEPARTMENT CONTACT]
Phone: [PHONE]
Office hours: [HOURS]

Case Reference: [CASE_REF]
```

### How to Create Templates

1. Go to Admin > Templates
2. Click + New Template
3. Fill in:
   - **Name:** "Thank You - Pothole" (something descriptive)
   - **Department:** Who uses this? (Public Works, Parks, etc.)
   - **Content:** Your template text (use [CASE_REF], [CONSTITUENT_NAME], etc.)
4. Click Save

You can use special variables that automatically fill in:
- `[CASE_REF]` - Case reference number (CR-2024-00001)
- `[CONSTITUENT_NAME]` - Constituent's name
- `[CONSTITUENT_EMAIL]` - Constituent's email
- `[CITY_NAME]` - Your city name
- `[CREATED_AT]` - Date case was created

### Tips for Template Success

1. **Keep them short.** 2-3 paragraphs max. Staff will edit and customize anyway.

2. **Get department heads' input.** Before finalizing, send drafts to Public Works, Parks, etc. Ask: "Does this sound right?" Make tweaks.

3. **Make them flexible.** Use brackets like [TOPIC], [TIMELINE], [LOCATION] so staff can fill in specifics. Example: "We will repair [LOCATION] within [TIMELINE]."

4. **Test them.** Have a staff member use a template on a real case. Ask: "Did it feel natural? Did you have to change much?" Adjust based on feedback.

5. **Review quarterly.** Every 3 months, look at templates. Are they still relevant? Do they need updates?

---

## Training Your Team

### The 30-Minute Training Session

Gather 2-3 staff members. Do this training together. Total time: 30 minutes.

**Segment 1: Overview (5 minutes)**
- "Constituent Response is how we track and respond to resident requests"
- "Instead of email chaos, everything goes into this system"
- "You log in, you see your cases, you respond, done"
- Show them the login screen

**Segment 2: Demo (10 minutes)**
- Log in
- Show them the dashboard (list of cases)
- Click a case
- Show them the details (subject, constituent info, timeline)
- Show them the template button
- Show them clicking a template and how it auto-fills
- Show them editing the response
- Show them clicking "Send"
- Show the constituent gets an email with the response

Say: "That's it. That's your job. This case is done."

**Segment 3: Hands-On (10 minutes)**
- Give each person a test case (you can create dummy cases for training)
- Have them log in
- Have them pick a template
- Have them respond
- Have them send it
- Ask: "Questions?"

**Segment 4: Help and Questions (5 minutes)**
- "Questions?"
- Common questions:
  - **"What if I don't know who should handle it?"** Talk to a manager, they'll reassign it.
  - **"What if I can't find the right template?"** You can always type a custom response.
  - **"What if the constituent replies to my response?"** It goes back into the system as a new message on the same case.
  - **"What if I make a typo?"** It's already sent, but you can send a follow-up.

Wrap up: "You're ready. Try a real case tomorrow and let me know if anything confuses you."

### Q&A You'll Hear

**"This seems complicated."**
> Actually, it's simpler than email. In email, you search for the original message, hunt for the response, wonder if anyone else replied. Here, you click the case, see everything, respond. Done.

**"Do I need to remember a password?"**
> No, you log in once and stay logged in on your computer. Just like Gmail.

**"What if the system crashes?"**
> It's like any web app. If the internet goes down, everything stops. But the system automatically saves everything. No data is lost.

**"Will it change how I do my job?"**
> A little, but for the better. Instead of managing email, you manage cases. It's faster and more organized.

---

## Presenting to City Council

Eventually, you'll need to show city council that this investment is working. Here's how.

### The 10-Minute Presentation

**Setup:**
- Project the dashboard on a screen
- Have a printed 1-page summary (see below)
- Speak from the heart (you've been using this for 3 months)

**What to Say (10 minutes):**

1. **"Here's the problem we solved"** (2 min)
   - Before: Constituent requests were scattered across email. We didn't have a unified view of what was pending or resolved.
   - Now: Every request is logged, tracked, and automatically acknowledged within minutes.

2. **"Here are the metrics"** (3 min)
   - Show the dashboard on screen
   - This month: X cases received, Y cases resolved, Z average response time
   - Last year (from imported data): A cases received, B cases resolved, C average response time
   - (Presumably these numbers improved)

3. **"Here's what staff say"** (2 min)
   - "Before, finding a case meant hunting through email."
   - "Now, it's one login, see all your cases, respond, done."
   - "We're not losing requests anymore."

4. **"Here's the cost"** (2 min)
   - Software: Free (open-source)
   - Server: $6/month
   - Domain (if you got one): $10/year
   - Total: ~$80/year or less
   - Staff time saved: 20+ hours/year (at $30/hour = $600+ in savings)
   - ROI: Positive in month 1

5. **"Questions?"** (1 min)

**One-page handout for council:**

```
CONSTITUENT RESPONSE SYSTEM - 3 MONTH REPORT

Problem Solved:
- Constituent requests tracked in one system
- No more requests getting lost
- Automatic acknowledgments to residents
- Clear audit trail (important for FOIA, compliance)

Results (3 months):
- 187 cases processed
- 100% cases acknowledged within 24 hours
- Average response time: 2.1 business days
- Zero cases lost or forgotten

Cost:
- Software: Free
- Server: $6/month
- Domain: $0.83/month
- Total: ~$80/year

Staff Feedback:
"Faster than email. Everything in one place."
"No more hunting through Gmail threads."
"Easier to show where we stand on a case."

Next Steps:
- Train elected officials on dashboard (optional)
- Integrate with 311 system if you have one
- Add AI-assisted responses (optional, $2-5/month)
```

### Key Talking Points for Council

**"Is this secure?"**
> Yes. Data is encrypted. Access is logged. Constituents' information is protected. It's more secure than email because we have an audit trail.

**"How much does it cost?"**
> $80/year, or about 7 cents per case. Compare to staff time: one person saves 20 hours/year at this, paying for itself in week one.

**"What if something breaks?"**
> It has automatic backups daily. We can restore from backup in minutes if needed.

**"Can constituents see everything?"**
> No. Constituents only see their own case and its status. They can't see other people's cases or internal notes.

**"What if we want to stop using it?"**
> All data is exported. You're not locked in. If you stop using it, all the cases are saved.

---

## Common Concerns from Council Members

Here are the concerns you'll hear and how to address them:

### "How much does it cost?"

**Council Member Says:** "This sounds expensive."

**You Say:** "$6/month for the server. That's less than a Netflix subscription. The software itself is free and open-source. Total annual cost: about $80. We save that in staff time in the first month. One less hour of staff time hunting through email per week = $1,560/year savings."

**Show them:** The cost table from DEPLOYMENT.md.

---

### "Is it secure?"

**Council Member Says:** "We're a government. Are constituents' personal information safe?"

**You Say:** "Yes. Data is encrypted in transit and at rest. Only staff with permission can see constituent information. Elected officials see trends, not personal details. We have automatic backups, so we don't lose data. If you compare to our current system (email chaos), this is actually more secure because we have an audit trail."

**Offer:** Give them a tour of the system. Show them they can't see other people's personal information. Show them the audit log. Show them backups exist.

---

### "Who maintains it?"

**Council Member Says:** "If something breaks, who fixes it?"

**You Say:** "[Your name] is the main admin. It's designed to be very simple, so breakdowns are rare. For 99% of issues, the documentation has the answer. For the 1% that needs outside help, we can hire a developer ($50-100/hour, usually takes 1-2 hours to fix anything)."

**Reassure them:** This system is widely used. It's not a custom-built thing. Other cities run it. Help is available.

---

### "Why not use [Competitor]?"

**Council Member Says:** "Why not just use Zendesk or [Some SaaS Tool]?"

**You Say:** "We could. Zendesk costs $50-200/month per agent. For our two people, that's $1,200-4,800/year. Constituent Response is free software we run on our own server. Plus, Zendesk is designed for big companies with sales teams. We need something small-city sized. This is it. And if we ever outgrow it, we can move the data out (it's all open-source)."

---

### "What about AI? Is that safe?"

**Council Member Says:** "I heard this uses AI. Is that OK for government?"

**You Say:** "AI is optional. We don't use it by default. If we enable it later, it's only to suggest draft responses. Staff always review and edit before sending to constituents. So we're not sending 'AI wrote this.' We're sending 'staff wrote this and reviewed it.' And only if you're comfortable with it. We can skip AI entirely if you prefer."

---

### "What about accessibility?"

**Council Member Says:** "Does this work for people with disabilities?"

**You Say:** "Yes. The system is designed to meet accessibility standards (WCAG 2.1). It works with screen readers. Constituents can request accommodations. We can also print/mail forms for anyone who can't use the web version."

---

## Growing Beyond Simple Mode

After 3-6 months of using Simple Mode, you might want to add features. Here's what's available and when you might want it.

### Feature: AI-Assisted Responses (Cost: $2-5/month)

**What it does:** Staff click "Generate Draft" and get 3 suggested response options. Staff picks the best one, edits it, sends it.

**When to add it:**
- You have 100+ cases/month (worth the time savings)
- You're confident staff are doing their job well (AI learns from your templates)
- You have budget for it

**How to turn it on:**
1. Get an OpenAI API key (free account, then buy credits: openai.com)
2. Go to Admin > AI Configuration
3. Paste the API key
4. Enable "AI Drafting"
5. Staff now see a "Generate Draft" button on cases

**Cost:** About $0.01-0.03 per draft. If you use it on 100 cases/month, that's $1-3/month.

---

### Feature: 311 Integration (Cost: $0, depends on your 311 system)

**What it does:** Cases automatically sync between this system and your 311 system. Staff see everything in one place.

**When to add it:**
- You already have a 311 system
- You want to unify your case management (no jumping between systems)

**How to set it up:**
- Depends on your 311 system (they all have different APIs)
- Hire a developer (1-4 hours, $50-100/hour typically)
- Or ask us on GitHub if someone's already built a connector

---

### Feature: Newsletter Integration (Cost: $0)

**What it does:** If you have a Transparent City newsletter or similar, constituent signals (flag/applause) automatically create cases.

**When to add it:**
- You're using Transparent City
- You want to close the loop on newsletter feedback
- You want one system for all constituent input (email + newsletter)

**How to set it up:**
1. Get your Transparent City API key
2. Go to Admin > Integrations > Transparent City
3. Paste the API key
4. Map newsletter topics to departments
5. Done

---

### Feature: Advanced Reports (Free, built-in)

**What it does:** See trends over time. How many requests per month? Which department gets most? What's the trend in response times?

**When to use it:**
- You want to show council year-over-year improvements
- You want to find bottlenecks (which department is backlogged?)
- You want to justify hiring more staff (show the workload)

**How to access:**
- Admin > Reports
- Click "Generate" for various reports
- Download as CSV or PDF

---

### Feature: Multi-City (Cost: depends on setup)

**What it does:** Run one system for multiple towns. Each town has separate data and branding.

**When to consider it:**
- You're county-level and want to serve multiple small towns
- You want to save money by sharing infrastructure

**How it works:**
- Not a simple toggle; requires setup
- Email us or post on GitHub if interested

---

## Last Thoughts

Constituent Response was built by people who work in local government. We understand that you don't have huge IT budgets. You need something that works out of the box, requires minimal maintenance, and actually solves the problem: organizing constituent requests.

You're not alone. Other small cities (5,000-50,000 people) use this. You're joining a community. If you get stuck, post on GitHub. Someone's probably solved the same problem.

The first month will feel like learning something new. By month three, it'll feel normal. By month six, you'll wonder how you ever managed without it.

Good luck. You've got this.

---

## Next Steps

1. **Read:** DEPLOYMENT.md ("$6/Month Production Deployment" section)
2. **Set up:** Follow the setup steps
3. **Train:** Follow "Training Your Team" section above
4. **Show council:** Use the presentation template above
5. **Iterate:** Add features as you learn

Or, if you want to test it first without commitment:

1. **Test:** Follow "Simplest Possible Deployment" in DEPLOYMENT.md (free, 5 minutes)
2. **Play with it:** Send yourself test cases, respond, explore
3. **Decide:** "Do we want to go live with this?"
4. **Deploy:** Follow "Production Deployment" if yes

---

**Questions?** Check FAQ.md or post on GitHub Issues. We're here to help.

**Last updated:** March 2026

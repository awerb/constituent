# Frequently Asked Questions for Constituent Response

This FAQ is written for small city managers, IT staff, and elected officials who are deciding whether to adopt Constituent Response. Questions are organized by what you actually care about.

---

## "Is This Right For Us?" — Sizing, Cost, and Fit

### We only handle 15 requests per week. Is this overkill?

No. If you're spending any time organizing emails, forwarding between staff, or hunting for who responded to what, this will save you time. Even 15 requests per week (about 780 per year) is exactly why we built this. At 15/week, you might save 1-2 hours per week just on organization. For a small team with limited time, that's significant.

### We're a town of 8,000 people. Is this designed for us?

Yes, absolutely. Constituent Response was originally built with small cities in mind. A town of 8,000 typically handles 500-2,000 constituent requests per year — that's the sweet spot. You don't need fancy features; you need something that organizes requests so staff can focus on answering them, not managing email threads.

### How does this compare to just using shared email?

Shared email (like a shared Gmail account) loses history, has no audit trail, and creates confusion about who's handling what. With this system:
- Every request gets a case number (so constituents can follow up)
- You can see status at a glance (NEW, IN_PROGRESS, RESOLVED)
- All responses are tracked (important for FOIA and audits)
- Staff can't delete or accidentally modify requests
- You get reports (how fast are we responding? what departments get the most requests?)

Shared email is chaos. This system is order.

### What does this do that a Google Form + spreadsheet doesn't?

A form + spreadsheet works until it doesn't. Once you have 50+ open cases, finding the status of a specific request becomes a spreadsheet search nightmare. This system:
- Notifies constituents when you respond (they don't have to check back)
- Prevents duplicate responses
- Automatically routes requests to the right department (if you want)
- Flags overdue requests so nothing falls through cracks
- Gives you actual reports instead of a messy spreadsheet
- Shows elected officials response times (without exposing sensitive details)

It's designed to scale from small to medium without changing your workflow.

### Can we try it without committing?

Yes. You can run it on your own desktop computer (Mac, Linux, or Windows with WSL) in 5 minutes for free. No credit card, no cloud account, nothing. Just download, run `docker compose up -d`, and you have a working system to test. When you're ready for production, you move to a $6/month server. See SMALL-CITY-GUIDE.md for the fastest path.

### What's the minimum viable setup?

- One admin person (20 minutes to set up)
- 2-3 staff members invited by email
- 3-5 response templates for your most common request types
- Email configured so constituents get acknowledgments
- That's it. You're live.

Most small cities go live in their first week with just these basics. Fancy features (AI drafts, 311 integration, advanced reports) can wait until you have time.

---

## "What Will It Cost?" — Real, Honest Cost Breakdown

### What are the ACTUAL monthly costs for a town of 10,000?

Breaking it down:

- **Server:** $6-12/month (DigitalOcean Droplet with 1GB RAM + swap)
- **Domain name:** $1/month (if you want yourdomain.local; optional, can use IP address)
- **Email service:** $0 (use existing city email, no extra service needed)
- **AI (optional):** $0-5/month (only if you enable it and use it)

**Total: $6-18/month** for a town of 10,000 handling 1,500+ requests/year.

This is not a typo. A six-dollar server runs everything perfectly fine for a small city.

### Do we need to pay for AI?

No. AI is completely optional. If you don't turn it on, you pay $0. Templates (pre-written responses you reuse) are often more valuable for small cities anyway, because your request types are predictable.

### Are there per-user fees?

No. You can have 50 staff members logging in, and costs don't change. Pricing is entirely based on the server you run it on, not how many people use it.

### What's the cheapest way to run this?

1. Get a $6/month VPS from Vultr, Linode, or DigitalOcean (1GB RAM is fine; add 2GB swap if you're worried)
2. Run `./setup.sh` (takes 10 minutes)
3. You're done

That's literally it. Total: $6/month forever, assuming you don't get 50,000+ requests per year.

### How do we estimate AI costs?

If you enable AI:
- Each draft costs about $0.01 (using GPT-3.5) or $0.03 (using GPT-4)
- Most small cities use AI on 10-20% of requests (not all)
- 1,000 requests/year × 15% × $0.02 = $3/month

You set a monthly budget in the admin panel and get an alert if you're approaching it. You can turn it off anytime.

### Will costs grow as we add more staff?

No. Server costs are fixed (based on how many requests you get, not how many people respond). If you hire a third staff member, the $6/month server is still plenty. You'd only need to upgrade if you're getting 50,000+ requests per year (which a town of 10,000 is very unlikely to reach).

---

## "Can Our Team Handle This?" — Staffing and Training

### We don't have an IT department. Can we still use this?

Yes. The one-click setup is designed for non-technical people. If you can:
- Copy and paste commands
- Wait 10 minutes for a server to start
- Click buttons in a web browser

Then you can deploy this. You don't need to understand Docker, Linux, or databases. Just follow the steps.

### How long does training take?

For staff who will respond to cases: 30 minutes. They learn:
- How to log in
- Where to find assigned cases
- How to respond to a case
- How to use templates
- How to add internal notes (so team communication is in one place)

For an admin who manages the system: 2 hours. That's learning about users, departments, templates, and basic troubleshooting. Most of it is just "click here to add a user, click here to add a department."

### Our staff isn't tech-savvy. Will they struggle?

No. The interface is designed to look like email. Staff see a list of cases (like an inbox), click one to open it (like opening an email), and respond. There are big buttons labeled "Use Template" and "Send Response." It's intentionally simple.

### What does day-to-day maintenance look like?

Almost nothing. The system runs itself. You might:
- Check the admin dashboard once a week (2 minutes) to see if there are any alerts
- Restart the system if you update something (maybe once a month, takes 5 minutes)
- Review backups exist (check a folder once a month, takes 1 minute)

That's it. It's designed to be boring and reliable.

### What breaks most often?

For small cities: almost nothing. The most common issue is "email isn't sending," which is usually just SMTP credentials in the config (takes 5 minutes to fix). Second most common: a staff member forgets their password (takes 1 minute to reset). Third: disk space fills up (but this takes months/years on a small city).

Network connectivity is the only real risk. If your internet goes down, the system is unavailable. That's true of any cloud system. Running on a local server in city hall doesn't help if internet is down.

---

## "Is It Safe for Government Use?" — Security, Compliance, Legal

### Is our data safe?

Yes, with caveats:

- Data is encrypted in transit (HTTPS)
- Data is encrypted at rest (your responsibility if self-hosted; handled for you if using managed service)
- Access is logged (you can see who accessed what case and when)
- Staff can't accidentally delete cases (audit trail prevents loss)
- Backups are automatic

The main risk is human error: someone sharing the admin password, or leaving a computer unlocked. Treat admin credentials like you treat your city email account.

### Can we meet FOIA requirements?

Yes. FOIA is actually easier with this system because:
- All responses are timestamped and logged
- You can easily export all cases from a date range
- Internal notes can be excluded from export (FOIA doesn't require private staff discussion)
- You have an audit trail of who accessed what

When someone requests records, you go to Admin > Data > Export, select the date range, and download a CSV. Much easier than hunting through email.

### What happens if there's a data breach?

If this system is compromised:
1. Constituent information (name, email, phone) could be exposed
2. Internal notes might be visible
3. Response history would be visible

This is the same risk as email. The system doesn't reduce breach risk; it makes it easier to detect breaches (through audit logs) and easier to respond (because data is organized).

If you're paranoid about security: run it on a server inside city hall that's not exposed to the internet. Only staff on the local network can access it. But that defeats the purpose (elected officials want to access it remotely).

### Does it store data in the cloud?

That's your choice. You can:
- Run it on a $6/month VPS (data is on the VPS provider's servers, encrypted and isolated to you)
- Run it on a server in city hall (data never leaves your building, but you're responsible for backups and uptime)
- Run it on AWS/Google Cloud (more expensive, but with built-in redundancy)

For a small city, the $6/month VPS is a good middle ground.

### Is AI safe for government communications?

AI drafts are optional. If you enable it:
- Staff always review and edit before sending (AI drafts are suggestions, not automatic responses)
- You're not sending "AI wrote this to a constituent" — you're sending "our staff reviewed this and approved it"
- AI never sees constituent names (only their request, which you can redact)

If you're uncomfortable with AI, just don't turn it on. Templates alone are often more useful for small cities anyway.

### Who can see constituent information?

You control this with roles:
- **Admins:** See everything (all cases, all constituents)
- **Department managers:** See cases assigned to their department
- **Staff (agents):** See only cases assigned to them
- **Elected officials:** See trends and statistics, NOT constituent names or case details

You decide who gets which role. If a city councilman shouldn't see pothole reports, they don't get access.

---

## "How Do We Get Started?" — Migration and Setup

### How long does setup take?

15 minutes for a small city:
1. Run setup script (10 min, mostly waiting for server to start)
2. Log in and configure departments (3 min)
3. Invite your staff (2 min)
4. You're live

### Can we migrate from our current email/spreadsheet system?

Yes. We have a CSV importer that:
- Takes your spreadsheet or exported email history
- Maps it to case fields (subject, description, date, status, assigned staff)
- Imports everything with proper dates and metadata

You can import years of history if you want (useful for reports and trends). See ADMIN-GUIDE.md > "Importing Your Existing Data."

### Do we need to stop using our current system right away?

No. You can:
1. Set up this system
2. Run both systems in parallel for a month (test it out)
3. Switch to this full-time when you're confident
4. Archive your old email/spreadsheet

Most small cities do a 2-week parallel run.

### What's the setup process look like step by step?

For a non-technical city manager:

1. **Get a server:** Go to DigitalOcean, click "Create Droplet," pick Ubuntu 22.04, $6/month, get your IP address (5 min)
2. **SSH in:** Open terminal, type `ssh root@YOUR_IP`, paste your SSH key or password (1 min)
3. **Run setup:** Copy the setup script from DEPLOYMENT.md, paste it into terminal, wait 10 minutes
4. **Log in:** Open browser, go to `http://YOUR_IP:3000`, create your admin account
5. **Add departments:** Go to Admin > Departments, add "Public Works," "Parks," etc. (3 min)
6. **Invite staff:** Go to Admin > Users, add their emails, they get invites (2 min)
7. **Add templates:** Go to Admin > Templates, create 5 common responses (5 min, optional but useful)
8. **Test:** Have someone submit a request to test.respond@yourdomain.com, see it appear in the system

Total: 30 minutes for someone without much technical experience.

### Can we start with basic features and add more later?

Yes. Start with just:
- Staff inbox (cases)
- Manual responses (no AI)
- Basic templates

Later, add:
- AI drafts (when you have time to test)
- Newsletter integration (if you have a newsletter)
- 311 system integration (if you have a 311 system)
- Advanced reports (when you care about trends)

You don't need all this stuff day one. Tackle one feature per month.

---

## "What If Something Goes Wrong?" — Support and Durability

### What if the project stops being maintained?

The code is open-source (MIT license) on GitHub. Even if official maintenance stops:
- You own the code and can hire someone to maintain it
- All your data is exported (CSV, JSON)
- You can export everything and move to another system

You're never locked in. This is a big advantage over commercial systems.

### How do we get our data out?

Admin > Data > Export. You can export:
- All cases as CSV or JSON
- With or without internal notes
- Filtered by date range, status, department
- Takes 30 seconds to download

This works at any time. You're never trapped.

### What if the server crashes?

If running on your own server in city hall: bring it back online, system restarts automatically. No data loss (backups are automatic).

If running on DigitalOcean/Linode/etc.: the provider keeps it running. If it does crash, automatic backups restore it within minutes.

Either way: you have daily automated backups. Worst case, you lose 24 hours of data. In practice, you lose 0-1 hours.

### Who do we call for help?

That depends:
- **For questions about how to use it:** See documentation, or post on GitHub
- **For bugs in the code:** GitHub Issues
- **For custom features:** You can hire a developer to add them (it's open-source, so anyone can contribute)
- **For deployment help:** Search GitHub issues (99% of problems are documented)

We recommend keeping a good relationship with a local developer who can help with troubleshooting. For a town of 10,000, they should charge $50-100/hour for occasional support.

### Can we roll back if we don't like it?

Yes. You have your original email/spreadsheet data. You have regular backups. If you stop using this system, all your data is still there and can be exported. You're not locked in.

---

## Integration and Customization

### Can we connect to our existing 311 system?

Maybe. If your 311 system has an API or webhook support, yes. The system supports outbound webhooks that send case updates to your 311 in real-time. A developer can set this up in a few hours.

If your 311 system doesn't have API access (very old systems), you might need to manually copy cases over, or hire someone to build a bridge. Not ideal, but possible.

### Can we customize the look and feel?

Yes. You can:
- Change colors and logo (in Admin > Settings)
- Customize email templates (Admin > Templates)
- Add custom fields (Admin > Case Fields, if you need to track things beyond the standard fields)
- Change department names and structure

The interface is clean and simple, but you can make it yours.

### Does it support Spanish/other languages?

Currently: English, Spanish, Vietnamese, Chinese (Simplified), Tagalog are built in.

If you need another language: it's not hard to add. You'd need someone who speaks both English and the target language to translate the ~200 UI strings. A translation agency could do this for $500-1,000.

### Can we add our own departments and categories?

Yes. You create departments matching your city structure:
- Public Works
- Parks & Recreation
- Planning
- Code Enforcement
- etc.

You can add as many as you want. Staff only see cases for their departments (unless they're admins).

---

## Common Questions About Costs

### What if we grow from 10K people to 50K people?

At 50K people with similar request rates (1 request per 10 people per year), you'd get about 5,000 requests/year. The $6/month server can still handle this. You might upgrade to a $12/month server for safety, but you wouldn't need to.

Real bottleneck: staff capacity. If you're getting 5,000 requests/year and only have 2 people responding, you'll be overworked. Buy more staff, not more server.

### What about email costs?

Assuming you use your city's existing email (Gmail, Outlook, etc.), there are no email costs. The system uses SMTP (standard email sending) that your existing email account already supports.

If you use a service like SendGrid, that's $10-50/month depending on volume. But most small cities use existing email.

### Are there support costs?

No. The software is free (MIT open-source license). We don't charge for support; documentation is free, community is free.

If you need dedicated help (someone to maintain it for you, or build a custom feature), you hire a contractor. Typical cost: $2,000-10,000 for a custom integration.

---

## "How Much Will This Save Us?"

Let's do the math for a town of 10,000:

**Current situation (email chaos):**
- Constituent emails go to shared inbox
- Someone spends 3 hours/week organizing: forwarding, finding status, sending updates
- You get audit requests (FOIA) and spend 10 hours finding all emails
- A request gets lost every other month

**With this system:**
- Requests auto-organize into cases
- Someone spends 30 minutes/week on admin tasks
- FOIA request takes 30 minutes (export CSV)
- Nothing gets lost

**Savings:**
- 2.5 hours/week × 52 weeks = 130 hours/year
- 130 hours × $30/hour (staff cost) = $3,900/year
- Cost: $6/month × 12 = $72/year
- Net savings: $3,828/year

And that's conservative. Most cities save more because they find it easier to follow up with constituents (fewer repeat emails, better information at hand).

For a town of 10,000, this is a no-brainer. It pays for itself in less than a week.

---

## Still have questions?

See the full documentation:
- **SMALL-CITY-GUIDE.md** — Specific guide for small city setup and training
- **DEPLOYMENT.md** — Technical deployment details
- **ADMIN-GUIDE.md** — How to manage the system
- **STAFF-GUIDE.md** — How staff use it daily

Or ask in the GitHub discussions.

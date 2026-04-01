import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clean up existing data
  console.log("Cleaning up existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.kbArticle.deleteMany();
  await prisma.slaConfig.deleteMany();
  await prisma.template.deleteMany();
  await prisma.caseMessage.deleteMany();
  await prisma.newsletterSignal.deleteMany();
  await prisma.case.deleteMany();
  await prisma.newsletterItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.constituent.deleteMany();
  await prisma.department.deleteMany();
  await prisma.city.deleteMany();

  // Create City
  console.log("Creating city...");
  const city = await prisma.city.create({
    data: {
      name: "Demo City",
      slug: "demo-city",
      state: "CA",
      timezone: "America/Los_Angeles",
      transparentCityApiKey: "demo-api-key-12345",
      transparentCityWebhookSecret: "demo-webhook-secret",
      settings: {
        logo: "https://example.com/logo.png",
        colors: {
          primary: "#0066cc",
          secondary: "#00cc66",
          accent: "#ff6600",
        },
        supportedLanguages: ["en", "es", "fr"],
        features: {
          newsletter: true,
          publicRecords: true,
          videoConferencing: true,
          multiLanguageSupport: true,
        },
        contactEmail: "support@democity.gov",
        phoneNumber: "555-0100",
      },
      isActive: true,
    },
  });

  console.log(`Created city: ${city.id}`);

  // Create Departments
  console.log("Creating departments...");
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Public Works",
        slug: "public-works",
        description: "Street maintenance, pothole repair, and infrastructure",
        topicTags: ["roads", "streets", "potholes", "infrastructure", "maintenance"],
        defaultSlaHours: 48,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Parks and Recreation",
        slug: "parks-recreation",
        description: "Park maintenance, recreation programs, and community events",
        topicTags: ["parks", "recreation", "trails", "playgrounds", "facilities"],
        defaultSlaHours: 72,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Planning and Zoning",
        slug: "planning-zoning",
        description: "Development permits, zoning variances, and land use",
        topicTags: ["zoning", "permits", "development", "planning", "land-use"],
        defaultSlaHours: 96,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Police Department",
        slug: "police",
        description: "Community policing and public safety",
        topicTags: ["safety", "crime", "enforcement", "community"],
        defaultSlaHours: 24,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Fire Department",
        slug: "fire",
        description: "Fire suppression and emergency response",
        topicTags: ["emergency", "fire", "safety", "response"],
        defaultSlaHours: 24,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Water and Utilities",
        slug: "water-utilities",
        description: "Water supply, sewage, and utility services",
        topicTags: ["water", "utilities", "sewage", "infrastructure"],
        defaultSlaHours: 48,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Building and Safety",
        slug: "building-safety",
        description: "Building inspections and code enforcement",
        topicTags: ["building", "safety", "inspections", "code"],
        defaultSlaHours: 72,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Finance Department",
        slug: "finance",
        description: "Budget questions and financial inquiries",
        topicTags: ["budget", "finance", "taxes", "spending"],
        defaultSlaHours: 96,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Human Services",
        slug: "human-services",
        description: "Social services and community programs",
        topicTags: ["services", "community", "programs", "support"],
        defaultSlaHours: 48,
        isActive: true,
      },
    }),
    prisma.department.create({
      data: {
        cityId: city.id,
        name: "Community Development",
        slug: "community-development",
        description: "Economic development and community initiatives",
        topicTags: ["development", "economic", "business", "initiatives"],
        defaultSlaHours: 72,
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${departments.length} departments`);

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Users
  console.log("Creating users...");
  const admin = await prisma.user.create({
    data: {
      cityId: city.id,
      email: "admin@democity.gov",
      name: "Admin User",
      passwordHash: hashedPassword,
      role: "ADMIN",
      departmentId: departments[0].id,
      isActive: true,
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      cityId: city.id,
      email: "agent1@democity.gov",
      name: "Sarah Johnson",
      passwordHash: hashedPassword,
      role: "AGENT",
      departmentId: departments[0].id,
      isActive: true,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      cityId: city.id,
      email: "agent2@democity.gov",
      name: "Michael Chen",
      passwordHash: hashedPassword,
      role: "AGENT",
      departmentId: departments[1].id,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      cityId: city.id,
      email: "manager@democity.gov",
      name: "Jessica Martinez",
      passwordHash: hashedPassword,
      role: "MANAGER",
      departmentId: departments[0].id,
      isActive: true,
    },
  });

  const electedOfficial = await prisma.user.create({
    data: {
      cityId: city.id,
      email: "councilmember@democity.gov",
      name: "Robert Wilson",
      passwordHash: hashedPassword,
      role: "ELECTED_OFFICIAL",
      isActive: true,
    },
  });

  console.log("Created 5 users");

  // Create Templates
  console.log("Creating templates...");
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        cityId: city.id,
        title: "General Acknowledgment",
        category: "Acknowledgment",
        departmentId: null,
        content: `Thank you for contacting {{cityName}}. We have received your inquiry regarding {{subject}} and have assigned it reference number {{caseNumber}}.

Our team will review your concern and respond within {{responseTime}} business hours.

Best regards,
{{departmentName}}`,
        variables: {
          cityName: "Demo City",
          subject: "string",
          caseNumber: "string",
          responseTime: "number",
          departmentName: "string",
        },
        status: "APPROVED",
        createdById: admin.id,
        approvedById: admin.id,
        version: 1,
      },
    }),
    prisma.template.create({
      data: {
        cityId: city.id,
        title: "Public Works Issue",
        category: "Issue Response",
        departmentId: departments[0].id,
        content: `Thank you for reporting this public works issue: {{issueType}}

We have scheduled an inspection for {{inspectionDate}}. Our crew will investigate the {{location}} and determine the appropriate action.

Reference Number: {{caseNumber}}
Status: {{status}}

For updates, please reference this number in future correspondence.`,
        variables: {
          issueType: "string",
          inspectionDate: "date",
          location: "string",
          caseNumber: "string",
          status: "string",
        },
        status: "APPROVED",
        createdById: admin.id,
        approvedById: admin.id,
        version: 1,
      },
    }),
    prisma.template.create({
      data: {
        cityId: city.id,
        title: "Budget Question Response",
        category: "Informational",
        departmentId: departments[7].id,
        content: `Thank you for your question regarding {{budgetArea}}.

The current budget allocation for {{fiscalYear}} is:
- Total: ${{totalAmount}}
- Allocation: {{allocation}}

For more detailed information, please visit our budget portal or attend a public budget hearing.

Sincerely,
Finance Department`,
        variables: {
          budgetArea: "string",
          fiscalYear: "number",
          totalAmount: "number",
          allocation: "string",
        },
        status: "APPROVED",
        createdById: admin.id,
        approvedById: admin.id,
        version: 1,
      },
    }),
    prisma.template.create({
      data: {
        cityId: city.id,
        title: "Referral to Other Department",
        category: "Referral",
        departmentId: null,
        content: `Thank you for your submission. Your concern regarding {{topic}} falls under the purview of the {{referralDepartment}}.

We are forwarding your case to {{referralDepartment}} for handling. You will receive a separate acknowledgment from them with your new case reference number.

Original Reference Number: {{originalCaseNumber}}`,
        variables: {
          topic: "string",
          referralDepartment: "string",
          originalCaseNumber: "string",
        },
        status: "APPROVED",
        createdById: admin.id,
        approvedById: admin.id,
        version: 1,
      },
    }),
    prisma.template.create({
      data: {
        cityId: city.id,
        title: "Case Resolution",
        category: "Resolution",
        departmentId: null,
        content: `Your case (Reference #{{caseNumber}}) has been resolved.

Summary of Action Taken:
{{resolutionSummary}}

If you are satisfied with the resolution, please confirm. If you have additional concerns, please respond to this message or submit a new case.

Resolved By: {{resolvedBy}}
Date: {{resolutionDate}}`,
        variables: {
          caseNumber: "string",
          resolutionSummary: "string",
          resolvedBy: "string",
          resolutionDate: "date",
        },
        status: "DRAFT",
        createdById: admin.id,
        version: 1,
      },
    }),
  ]);

  console.log(`Created ${templates.length} templates`);

  // Create Constituents
  console.log("Creating constituents...");
  const constituent1 = await prisma.constituent.create({
    data: {
      cityId: city.id,
      email: "john.doe@example.com",
      name: "John Doe",
      phone: "555-0101",
      address: "123 Main St, Demo City, CA 90210",
      ward: "Ward 1",
      district: "District A",
      languagePreference: "en",
      privacyStatus: "ACTIVE",
      metadata: {
        source: "web_form",
        referrer: "google",
        tags: ["streets", "pothole"],
      },
    },
  });

  const constituent2 = await prisma.constituent.create({
    data: {
      cityId: city.id,
      email: "jane.smith@example.com",
      name: "Jane Smith",
      phone: "555-0102",
      address: "456 Oak Ave, Demo City, CA 90211",
      ward: "Ward 2",
      district: "District B",
      languagePreference: "es",
      privacyStatus: "ACTIVE",
      metadata: {
        source: "phone",
        tags: ["parks", "playground"],
      },
    },
  });

  console.log("Created 2 constituents");

  // Create Newsletter Items
  console.log("Creating newsletter items...");
  const newsItems = await Promise.all([
    prisma.newsletterItem.create({
      data: {
        cityId: city.id,
        externalId: "news-001",
        title: "Downtown Street Resurfacing Project",
        summary:
          "The city is planning to resurface Main Street between 1st and 5th Avenue. Work will begin in Q2 2026.",
        topicTags: ["roads", "infrastructure", "downtown"],
        sourceUrl: "https://example.com/news/downtown-resurfacing",
        transparentCityDataUrl: "https://transparentcity.example.com/data/001",
        flagCount: 5,
        applaudCount: 2,
        publishedAt: new Date("2026-03-15"),
      },
    }),
    prisma.newsletterItem.create({
      data: {
        cityId: city.id,
        externalId: "news-002",
        title: "New Community Center Opening",
        summary:
          "The newly renovated community center in Ward 3 will open to the public next month with expanded programs.",
        topicTags: ["community", "recreation", "facilities"],
        sourceUrl: "https://example.com/news/community-center",
        transparentCityDataUrl: "https://transparentcity.example.com/data/002",
        flagCount: 12,
        applaudCount: 18,
        publishedAt: new Date("2026-03-20"),
      },
    }),
    prisma.newsletterItem.create({
      data: {
        cityId: city.id,
        externalId: "news-003",
        title: "Water Service Improvement Plan",
        summary:
          "The Water Department announces a three-year plan to upgrade aging infrastructure across the city.",
        topicTags: ["water", "utilities", "infrastructure"],
        sourceUrl: "https://example.com/news/water-plan",
        transparentCityDataUrl: "https://transparentcity.example.com/data/003",
        flagCount: 3,
        applaudCount: 1,
        publishedAt: new Date("2026-03-25"),
      },
    }),
  ]);

  console.log("Created 3 newsletter items");

  // Create Cases
  console.log("Creating cases...");
  const cases = await Promise.all([
    prisma.case.create({
      data: {
        cityId: city.id,
        referenceNumber: "CASE-2026-001",
        constituentId: constituent1.id,
        subject: "Large pothole on Main Street",
        description:
          "There is a large pothole at the intersection of Main Street and 2nd Avenue that is hazardous to vehicles.",
        status: "ASSIGNED",
        priority: "HIGH",
        source: "WEB_FORM",
        departmentId: departments[0].id,
        assignedToId: agent1.id,
        transparentCityContext: {
          location: "Main St & 2nd Ave",
          severity: "high",
        },
        detectedLanguage: "en",
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        slaBreached: false,
        createdAt: new Date("2026-03-28"),
      },
    }),
    prisma.case.create({
      data: {
        cityId: city.id,
        referenceNumber: "CASE-2026-002",
        constituentId: constituent2.id,
        subject: "Playground equipment needs repair",
        description:
          "The swing set at Central Park has a broken swing that is unsafe for children.",
        status: "IN_PROGRESS",
        priority: "NORMAL",
        source: "PHONE",
        departmentId: departments[1].id,
        assignedToId: agent2.id,
        transparentCityContext: {
          parkName: "Central Park",
          equipment: "swing set",
        },
        detectedLanguage: "en",
        slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
        slaBreached: false,
        createdAt: new Date("2026-03-27"),
        firstRespondedAt: new Date("2026-03-28"),
      },
    }),
    prisma.case.create({
      data: {
        cityId: city.id,
        referenceNumber: "CASE-2026-003",
        constituentId: constituent1.id,
        subject: "Question about zoning regulations",
        description:
          "Is my property zoned for commercial use? I am considering opening a small retail shop.",
        status: "AWAITING_RESPONSE",
        priority: "NORMAL",
        source: "EMAIL",
        departmentId: departments[2].id,
        assignedToId: null,
        transparentCityContext: {
          propertyAddress: "123 Main St",
          inquiryType: "zoning",
        },
        detectedLanguage: "en",
        slaDeadline: new Date(Date.now() + 96 * 60 * 60 * 1000),
        slaBreached: false,
        createdAt: new Date("2026-03-26"),
      },
    }),
    prisma.case.create({
      data: {
        cityId: city.id,
        referenceNumber: "CASE-2026-004",
        constituentId: constituent2.id,
        subject: "Water bill inquiry",
        description: "My water bill has doubled this month. Can you help me understand why?",
        status: "RESOLVED",
        priority: "NORMAL",
        source: "WEB_FORM",
        departmentId: departments[5].id,
        assignedToId: agent1.id,
        transparentCityContext: {
          accountNumber: "WTR-123456",
          billAmount: 150.75,
        },
        detectedLanguage: "en",
        slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        slaBreached: false,
        createdAt: new Date("2026-03-20"),
        firstRespondedAt: new Date("2026-03-21"),
        resolvedAt: new Date("2026-03-23"),
      },
    }),
    prisma.case.create({
      data: {
        cityId: city.id,
        referenceNumber: "CASE-2026-005",
        constituentId: constituent1.id,
        subject: "Street lighting out on residential block",
        description:
          "Multiple street lights are out on our block making it dark and unsafe at night.",
        status: "CLOSED",
        priority: "LOW",
        source: "WALK_IN",
        departmentId: departments[0].id,
        assignedToId: agent1.id,
        transparentCityContext: {
          location: "Elm Street, Block 7-8",
          lightsOutCount: 4,
        },
        detectedLanguage: "en",
        slaDeadline: new Date(Date.now() - 72 * 60 * 60 * 1000),
        slaBreached: false,
        createdAt: new Date("2026-03-10"),
        firstRespondedAt: new Date("2026-03-11"),
        resolvedAt: new Date("2026-03-15"),
        closedAt: new Date("2026-03-22"),
      },
    }),
  ]);

  console.log(`Created ${cases.length} cases`);

  // Create Case Messages
  console.log("Creating case messages...");
  await Promise.all([
    prisma.caseMessage.create({
      data: {
        caseId: cases[0].id,
        authorType: "CONSTITUENT",
        authorId: constituent1.id,
        content:
          "I reported this pothole three weeks ago and it still has not been fixed. This is affecting my car.",
        contentLanguage: "en",
        isInternalNote: false,
        isPublicRecordsExcluded: false,
        createdAt: new Date("2026-03-28"),
      },
    }),
    prisma.caseMessage.create({
      data: {
        caseId: cases[0].id,
        authorType: "STAFF",
        authorId: agent1.id,
        content:
          "We have scheduled a repair crew to visit the location on March 30th. Thank you for your patience.",
        contentLanguage: "en",
        isInternalNote: false,
        isPublicRecordsExcluded: false,
        createdAt: new Date("2026-03-28T14:30:00"),
      },
    }),
    prisma.caseMessage.create({
      data: {
        caseId: cases[1].id,
        authorType: "STAFF",
        authorId: agent2.id,
        content:
          "We are obtaining a replacement swing. The repair should be completed by April 2nd.",
        contentLanguage: "en",
        isInternalNote: false,
        isPublicRecordsExcluded: false,
        createdAt: new Date("2026-03-28T09:15:00"),
      },
    }),
    prisma.caseMessage.create({
      data: {
        caseId: cases[3].id,
        authorType: "STAFF",
        authorId: agent1.id,
        content:
          "Your bill increased due to seasonal usage patterns and a minor rate adjustment. Your usage is within normal range for a home your size.",
        contentLanguage: "en",
        isInternalNote: false,
        isPublicRecordsExcluded: false,
        createdAt: new Date("2026-03-22"),
      },
    }),
    prisma.caseMessage.create({
      data: {
        caseId: cases[4].id,
        authorType: "SYSTEM",
        authorId: "system",
        content: "This case has been automatically closed as the issue was resolved.",
        contentLanguage: "en",
        isInternalNote: true,
        isPublicRecordsExcluded: true,
        createdAt: new Date("2026-03-22"),
      },
    }),
  ]);

  console.log("Created 5 case messages");

  // Create Newsletter Signals
  console.log("Creating newsletter signals...");
  await Promise.all([
    prisma.newsletterSignal.create({
      data: {
        cityId: city.id,
        newsletterItemId: newsItems[0].id,
        constituentId: constituent1.id,
        signalType: "FLAG",
        note: "This project will block my access to the hardware store",
        noteLanguage: "en",
        caseId: cases[0].id,
      },
    }),
    prisma.newsletterSignal.create({
      data: {
        cityId: city.id,
        newsletterItemId: newsItems[1].id,
        constituentId: constituent2.id,
        signalType: "APPLAUD",
        note: "Great addition to the community!",
        noteLanguage: "en",
      },
    }),
    prisma.newsletterSignal.create({
      data: {
        cityId: city.id,
        newsletterItemId: newsItems[0].id,
        constituentId: constituent2.id,
        signalType: "FLAG",
        note: null,
        noteLanguage: null,
      },
    }),
  ]);

  console.log("Created 3 newsletter signals");

  // Create SLA Configs for departments and priorities
  console.log("Creating SLA configurations...");
  const priorities = ["URGENT", "HIGH", "NORMAL", "LOW"];

  // Create SLA configs for first 3 departments with all priorities
  for (let i = 0; i < 3; i++) {
    for (const priority of priorities) {
      let responseHours = 24;
      let resolutionHours = 72;

      if (priority === "URGENT") {
        responseHours = 2;
        resolutionHours = 24;
      } else if (priority === "HIGH") {
        responseHours = 8;
        resolutionHours = 48;
      } else if (priority === "NORMAL") {
        responseHours = 24;
        resolutionHours = 72;
      } else if (priority === "LOW") {
        responseHours = 48;
        resolutionHours = 120;
      }

      await prisma.slaConfig.create({
        data: {
          cityId: city.id,
          departmentId: departments[i].id,
          priority: priority as any,
          responseHours,
          resolutionHours,
          escalationChain: {
            level1: "manager",
            level2: "director",
          },
          businessHoursStart: "08:00",
          businessHoursEnd: "17:00",
          businessDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
      });
    }
  }

  console.log("Created 12 SLA configurations");

  // Create KB Article
  console.log("Creating KB article...");
  const kbArticle = await prisma.kbArticle.create({
    data: {
      cityId: city.id,
      title: "How to Report a Pothole",
      content: `# How to Report a Pothole

Potholes are dangerous road hazards that damage vehicles and create safety risks. Here's how to report one:

## Online Report
1. Visit our website and select "Report a Pothole"
2. Enter the location (address or intersection)
3. Optionally upload photos
4. Submit the form

## By Phone
Call our Public Works Department at 555-0200 to report the location and severity.

## By Mail
Send a letter with the location details to:
Public Works Department
Demo City Hall
100 City Center
Demo City, CA 90210

## Response Timeline
Once reported, our team will:
- Inspect the location within 5 business days
- Repair URGENT potholes within 2 weeks
- Repair NORMAL potholes within 30 days

## What to Include
- Exact location (address or major intersection)
- Photos (if possible)
- When you first noticed it
- Any safety concerns (near school, etc.)

Thank you for helping keep our streets safe!`,
      category: "Public Works",
      departmentId: departments[0].id,
      createdById: admin.id,
      useCount: 0,
      isPublished: true,
    },
  });

  console.log("Created 1 KB article");

  // Create Webhooks
  console.log("Creating webhooks...");
  const webhook = await prisma.webhook.create({
    data: {
      cityId: city.id,
      name: "Case Status Updates",
      url: "https://example.com/webhooks/cases",
      events: ["case.created", "case.updated", "case.resolved", "case.closed"],
      secret: "webhook-secret-key-12345",
      isActive: true,
    },
  });

  console.log("Created 1 webhook");

  // Create Audit Log entries
  console.log("Creating audit logs...");
  await Promise.all([
    prisma.auditLog.create({
      data: {
        cityId: city.id,
        userId: admin.id,
        action: "CREATE",
        resourceType: "Department",
        resourceId: departments[0].id,
        details: {
          name: "Public Works",
          reason: "Initial seed data",
        },
        ipAddress: "192.168.1.1",
      },
    }),
    prisma.auditLog.create({
      data: {
        cityId: city.id,
        userId: agent1.id,
        action: "UPDATE",
        resourceType: "Case",
        resourceId: cases[0].id,
        details: {
          previousStatus: "NEW",
          newStatus: "ASSIGNED",
          assignedTo: agent1.id,
        },
        ipAddress: "192.168.1.2",
      },
    }),
    prisma.auditLog.create({
      data: {
        cityId: city.id,
        userId: null,
        action: "SYSTEM",
        resourceType: "Case",
        resourceId: cases[4].id,
        details: {
          status: "CLOSED",
          reason: "Issue resolved",
        },
        ipAddress: null,
      },
    }),
  ]);

  console.log("Created 3 audit log entries");

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

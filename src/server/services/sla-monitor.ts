import { prisma } from "@/lib/db";
import { getTimeRemainingInBusinessHours, calculateSlaDeadline, type SLAConfig } from "@/lib/sla";
import { notify } from "./notifier";
import { NotificationEvent } from "@/lib/notifications";

/**
 * Check all open cases for SLA violations
 * Handles warning notifications (within 2 hours) and breach notifications
 */
export async function checkAllSlas(cityId?: string): Promise<void> {
  try {
    console.log(`Checking SLAs${cityId ? ` for city ${cityId}` : " for all cities"}`);

    // Find all open cases with SLA deadlines
    const cases = await prisma.case.findMany({
      where: {
        ...(cityId && { cityId }),
        status: { in: ["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_RESPONSE"] },
        slaDeadline: { not: null },
      },
      include: {
        city: true,
        department: true,
        assignedTo: true,
      },
    });

    console.log(`Found ${cases.length} open cases with SLA deadlines`);

    for (const caseRecord of cases) {
      await checkCaseSla(caseRecord.id);
    }
  } catch (error) {
    console.error("Error checking all SLAs:", error);
    throw error;
  }
}

/**
 * Check a single case for SLA breach
 */
export async function checkCaseSla(caseId: string): Promise<void> {
  try {
    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        city: true,
        department: true,
        assignedTo: true,
      },
    });

    if (!caseRecord.slaDeadline) {
      console.log(`Case ${caseId} has no SLA deadline`);
      return;
    }

    // Get SLA config
    const slaConfig = await prisma.slaConfig.findFirst({
      where: {
        cityId: caseRecord.cityId,
        departmentId: caseRecord.departmentId,
        priority: caseRecord.priority,
      },
    });

    if (!slaConfig) {
      console.log(
        `No SLA config found for case ${caseId} (dept: ${caseRecord.department.name}, priority: ${caseRecord.priority})`
      );
      return;
    }

    const config: SLAConfig = {
      businessHoursStart: slaConfig.businessHoursStart,
      businessHoursEnd: slaConfig.businessHoursEnd,
      businessDays: slaConfig.businessDays,
      timezone: caseRecord.city.timezone,
    };

    const remaining = getTimeRemainingInBusinessHours(caseRecord.slaDeadline, config);

    if (remaining.isBreached && !caseRecord.slaBreached) {
      // Breach detected
      console.log(`SLA BREACHED for case ${caseId}`);

      await prisma.case.update({
        where: { id: caseId },
        data: { slaBreached: true },
      });

      // Notify assignee and managers
      await sendBreachNotifications(caseRecord);
    } else if (!remaining.isBreached && remaining.hours < 2 && !caseRecord.slaBreached) {
      // Warning: less than 2 hours remaining
      console.log(
        `SLA WARNING for case ${caseId} - ${remaining.hours}h ${remaining.minutes}m remaining`
      );

      await sendWarningNotifications(caseRecord, remaining);
    }
  } catch (error) {
    console.error(`Error checking SLA for case ${caseId}:`, error);
  }
}

/**
 * Send notifications for SLA breach
 */
async function sendBreachNotifications(caseRecord: any): Promise<void> {
  const notificationUsers = [];

  // Add assigned user
  if (caseRecord.assignedTo) {
    notificationUsers.push(caseRecord.assignedTo.id);
  }

  // Add department managers
  const managers = await prisma.user.findMany({
    where: {
      cityId: caseRecord.cityId,
      departmentId: caseRecord.departmentId,
      role: { in: ["MANAGER", "ADMIN"] },
      isActive: true,
    },
  });

  for (const manager of managers) {
    if (!notificationUsers.includes(manager.id)) {
      notificationUsers.push(manager.id);
    }
  }

  // Send notifications
  for (const userId of notificationUsers) {
    try {
      await notify(userId, NotificationEvent.SLA_BREACHED, {
        caseId: caseRecord.id,
        referenceNumber: caseRecord.referenceNumber,
        constituentName: caseRecord.constituentId,
        subject: caseRecord.subject,
        deadline: caseRecord.slaDeadline?.toISOString(),
      });
    } catch (error) {
      console.error(`Failed to notify user ${userId} about SLA breach:`, error);
    }
  }
}

/**
 * Send warnings for approaching SLA deadline
 */
async function sendWarningNotifications(
  caseRecord: any,
  remaining: { hours: number; minutes: number; isBreached: boolean }
): Promise<void> {
  const notificationUsers = [];

  // Add assigned user
  if (caseRecord.assignedTo) {
    notificationUsers.push(caseRecord.assignedTo.id);
  }

  // Add department managers
  const managers = await prisma.user.findMany({
    where: {
      cityId: caseRecord.cityId,
      departmentId: caseRecord.departmentId,
      role: { in: ["MANAGER", "ADMIN"] },
      isActive: true,
    },
  });

  for (const manager of managers) {
    if (!notificationUsers.includes(manager.id)) {
      notificationUsers.push(manager.id);
    }
  }

  // Send notifications
  for (const userId of notificationUsers) {
    try {
      await notify(userId, NotificationEvent.SLA_WARNING, {
        caseId: caseRecord.id,
        referenceNumber: caseRecord.referenceNumber,
        constituentName: caseRecord.constituentId,
        subject: caseRecord.subject,
        deadline: caseRecord.slaDeadline?.toISOString(),
        hoursRemaining: remaining.hours,
        minutesRemaining: remaining.minutes,
      });
    } catch (error) {
      console.error(`Failed to notify user ${userId} about SLA warning:`, error);
    }
  }
}

/**
 * Escalate a breached case
 */
export async function escalateCase(caseId: string): Promise<void> {
  try {
    console.log(`Escalating case ${caseId}`);

    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        department: true,
      },
    });

    // Get escalation chain from SLA config
    const slaConfig = await prisma.slaConfig.findFirst({
      where: {
        cityId: caseRecord.cityId,
        departmentId: caseRecord.departmentId,
        priority: caseRecord.priority,
      },
    });

    if (!slaConfig || !slaConfig.escalationChain) {
      console.log("No escalation chain configured");
      return;
    }

    const escalationChain = slaConfig.escalationChain as any;
    const escalationPath = escalationChain.path || [];

    if (escalationPath.length === 0) {
      console.log("No escalation path defined");
      return;
    }

    // Notify escalation contacts
    for (const contact of escalationPath) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: contact.userId },
        });

        if (user && user.isActive) {
          await notify(user.id, NotificationEvent.SLA_BREACHED, {
            caseId: caseRecord.id,
            referenceNumber: caseRecord.referenceNumber,
            subject: caseRecord.subject,
            escalationLevel: contact.level || 1,
            escalationReason: "SLA Breach - Case requires immediate attention",
          });
        }
      } catch (error) {
        console.error(`Failed to escalate to contact:`, error);
      }
    }

    console.log(`Case ${caseId} escalated to ${escalationPath.length} contacts`);
  } catch (error) {
    console.error("Error escalating case:", error);
    throw error;
  }
}

/**
 * Get SLA status for a case
 */
export async function getCaseSlaStatus(
  caseId: string
): Promise<{
  deadline: Date | null;
  isBreached: boolean;
  hoursRemaining: number | null;
  minutesRemaining: number | null;
  status: "on-track" | "warning" | "breached";
}> {
  try {
    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        city: true,
        department: true,
      },
    });

    if (!caseRecord.slaDeadline) {
      return {
        deadline: null,
        isBreached: false,
        hoursRemaining: null,
        minutesRemaining: null,
        status: "on-track",
      };
    }

    const slaConfig = await prisma.slaConfig.findFirst({
      where: {
        cityId: caseRecord.cityId,
        departmentId: caseRecord.departmentId,
        priority: caseRecord.priority,
      },
    });

    if (!slaConfig) {
      return {
        deadline: caseRecord.slaDeadline,
        isBreached: caseRecord.slaBreached,
        hoursRemaining: null,
        minutesRemaining: null,
        status: caseRecord.slaBreached ? "breached" : "on-track",
      };
    }

    const config: SLAConfig = {
      businessHoursStart: slaConfig.businessHoursStart,
      businessHoursEnd: slaConfig.businessHoursEnd,
      businessDays: slaConfig.businessDays,
      timezone: caseRecord.city.timezone,
    };

    const remaining = getTimeRemainingInBusinessHours(caseRecord.slaDeadline, config);

    let status: "on-track" | "warning" | "breached" = "on-track";
    if (remaining.isBreached) {
      status = "breached";
    } else if (remaining.hours < 2) {
      status = "warning";
    }

    return {
      deadline: caseRecord.slaDeadline,
      isBreached: remaining.isBreached,
      hoursRemaining: remaining.hours,
      minutesRemaining: remaining.minutes,
      status,
    };
  } catch (error) {
    console.error("Error getting SLA status:", error);
    throw error;
  }
}

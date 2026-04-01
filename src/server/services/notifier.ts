import { prisma } from "@/lib/db";
import { NotificationEvent } from "@/lib/notifications";
import { sendNotificationEmail } from "./email-sender";
import { webhookQueue } from "@/lib/queue";

export interface NotificationPayload {
  [key: string]: any;
}

/**
 * Dispatch a notification to a user through configured channels
 * Respects user notification preferences and sends via email and/or webhook
 */
export async function notify(
  userId: string,
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  try {
    console.log(`Notifying user ${userId} of event: ${event}`);

    // Get user and their preferences
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.isActive) {
      console.log(`User ${userId} is inactive, skipping notification`);
      return;
    }

    const preferences = (user.notificationPreferences as any) || {};

    // Check if user wants to receive notifications for this event
    const eventPreferences = preferences.events?.[event];
    if (eventPreferences === false) {
      console.log(`User ${userId} has disabled notifications for ${event}`);
      return;
    }

    // Determine channels
    const channels = getPreferredChannels(preferences);

    if (channels.length === 0) {
      console.log(`User ${userId} has no notification channels enabled`);
      return;
    }

    // Send through each channel
    for (const channel of channels) {
      try {
        if (channel === "email") {
          await sendEmailNotification(user, event, payload);
        } else if (channel === "webhook") {
          await queueWebhookNotification(user, event, payload);
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification to ${user.id}:`, error);
      }
    }

    console.log(`Notification sent to user ${userId} via ${channels.join(", ")}`);
  } catch (error) {
    console.error(`Error notifying user ${userId}:`, error);
  }
}

/**
 * Get user's preferred notification channels
 */
function getPreferredChannels(preferences: any): string[] {
  const channels = [];

  // Email is always available
  if (preferences.email !== false) {
    channels.push("email");
  }

  // Webhook if configured
  if (preferences.webhook !== false) {
    channels.push("webhook");
  }

  // Default to email if nothing configured
  if (channels.length === 0) {
    channels.push("email");
  }

  return channels;
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  user: any,
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  const template = getNotificationTemplate(event);
  const subject = template.subject;

  let body = template.body;

  // Replace variables in template
  Object.entries(payload).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    body = body.replace(new RegExp(placeholder, "g"), String(value));
  });

  await sendNotificationEmail({
    to: user.email,
    subject,
    body,
    isInternalNote: true,
  });
}

/**
 * Queue webhook notification
 */
async function queueWebhookNotification(
  user: any,
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  try {
    // Queue for later dispatch
    await webhookQueue.add(
      "notification",
      {
        userId: user.id,
        event,
        payload,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );
  } catch (error) {
    console.error("Failed to queue webhook notification:", error);
    throw error;
  }
}

/**
 * Get notification template for an event
 */
function getNotificationTemplate(
  event: NotificationEvent
): { subject: string; body: string } {
  const templates: Record<NotificationEvent, { subject: string; body: string }> = {
    [NotificationEvent.CASE_CREATED]: {
      subject: "New Case Created",
      body: `A new case ({{referenceNumber}}) has been created:\n\nConstituent: {{constituentName}}\nSubject: {{subject}}\n\nPlease review and take action as needed.`,
    },
    [NotificationEvent.CASE_ASSIGNED]: {
      subject: "Case Assigned to You",
      body: `Case {{referenceNumber}} has been assigned to you:\n\nSubject: {{subject}}\n\nPlease log in to review the case details.`,
    },
    [NotificationEvent.SLA_WARNING]: {
      subject: "SLA Warning - {{hoursRemaining}} Hours Remaining",
      body: `Case {{referenceNumber}} is approaching its SLA deadline.\n\nSubject: {{subject}}\nHours Remaining: {{hoursRemaining}}h {{minutesRemaining}}m\nDeadline: {{deadline}}\n\nPlease respond to this case promptly.`,
    },
    [NotificationEvent.SLA_BREACHED]: {
      subject: "SLA BREACHED - {{referenceNumber}}",
      body: `Case {{referenceNumber}} has breached its SLA deadline.\n\nSubject: {{subject}}\nConstituent: {{constituentName}}\nDeadline: {{deadline}}\n\nImmediate action required.`,
    },
    [NotificationEvent.CASE_CONSTITUENTREPLY]: {
      subject: "Constituent Reply - {{referenceNumber}}",
      body: `The constituent has replied to case {{referenceNumber}}:\n\nSubject: {{subject}}\n\nPlease review their response and take appropriate action.`,
    },
    [NotificationEvent.CASE_ESCALATED]: {
      subject: "Case Escalated - {{referenceNumber}}",
      body: `Case {{referenceNumber}} has been escalated.\n\nSubject: {{subject}}\nReason: {{reason}}\n\nPlease review and address this urgent matter.`,
    },
    [NotificationEvent.TEMPLATE_APPROVED]: {
      subject: "Template Approved",
      body: `Your template has been approved and is ready for use.`,
    },
    [NotificationEvent.SIGNAL_FLAGGED]: {
      subject: "Signal Flagged",
      body: `A newsletter item has been flagged by constituents:\n\nNewsletter: {{newsletterTitle}}\nFlags: {{flagCount}}\n\nPlease review if action is needed.`,
    },
  };

  return (
    templates[event] || {
      subject: "Notification",
      body: "You have a new notification. Please log in to view details.",
    }
  );
}

/**
 * Notify all managers in a department about a critical event
 */
export async function notifyDepartmentManagers(
  cityId: string,
  departmentId: string,
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  try {
    const managers = await prisma.user.findMany({
      where: {
        cityId,
        departmentId,
        role: { in: ["MANAGER", "ADMIN"] },
        isActive: true,
      },
    });

    console.log(`Notifying ${managers.length} managers in department ${departmentId}`);

    for (const manager of managers) {
      await notify(manager.id, event, payload);
    }
  } catch (error) {
    console.error("Error notifying department managers:", error);
  }
}

/**
 * Notify all admins in a city about a system event
 */
export async function notifyCityAdmins(
  cityId: string,
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: {
        cityId,
        role: { in: ["SUPER_ADMIN", "ADMIN"] },
        isActive: true,
      },
    });

    console.log(`Notifying ${admins.length} admins in city ${cityId}`);

    for (const admin of admins) {
      await notify(admin.id, event, payload);
    }
  } catch (error) {
    console.error("Error notifying city admins:", error);
  }
}

/**
 * Update a user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: any
): Promise<void> {
  try {
    console.log(`Updating notification preferences for user ${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: preferences,
      },
    });

    console.log("Notification preferences updated");
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
}

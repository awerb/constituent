import { emailQueue } from "@/lib/queue";

export enum NotificationEvent {
  CASE_CREATED = "case.created",
  CASE_ASSIGNED = "case.assigned",
  CASE_STATUS_CHANGED = "case.status_changed",
  CASE_RESOLVED = "case.resolved",
  CASE_CLOSED = "case.closed",
  MESSAGE_ADDED = "message.added",
  SLA_WARNING = "sla.warning",
  SLA_BREACHED = "sla.breached",
  CONSTITUENT_REPLIED = "constituent.replied",
  TEMPLATE_APPROVED = "template.approved",
  SIGNAL_FLAGGED = "signal.flagged",
  USER_INVITED = "user.invited",
}

export interface NotificationData {
  userId: string;
  event: NotificationEvent;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type NotificationChannel = "email" | "in_app" | "sms" | "push";

export interface NotificationPreferences {
  email?: boolean;
  in_app?: boolean;
  sms?: boolean;
  push?: boolean;
  events?: {
    [key in NotificationEvent]?: boolean;
  };
  [key: string]: unknown;
}

/**
 * Send a notification to a user through configured channels
 * Respects user's notification preferences
 */
export async function sendNotification(
  userId: string,
  event: NotificationEvent,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; channels: NotificationChannel[] }> {
  const channels: NotificationChannel[] = [];

  try {
    // Fetch user notification preferences
    const preferences = await getUserNotificationPreferences(userId);

    // Determine which channels are enabled for this event
    const eventSpecificSettings = preferences.events?.[event];
    const channelsToUse: NotificationChannel[] = [];

    if (eventSpecificSettings === false) {
      // User has explicitly disabled this event
      return { success: true, channels: [] };
    }

    // Check general channel preferences
    if (preferences.email !== false) {
      channelsToUse.push("email");
    }
    if (preferences.in_app !== false) {
      channelsToUse.push("in_app");
    }
    if (preferences.sms) {
      channelsToUse.push("sms");
    }
    if (preferences.push) {
      channelsToUse.push("push");
    }

    // Default to email if no channels are configured
    if (channelsToUse.length === 0) {
      channelsToUse.push("email");
    }

    // Dispatch notifications through each channel
    for (const channel of channelsToUse) {
      if (channel === "email") {
        await dispatchEmailNotification(userId, event, data, metadata);
        channels.push("email");
      } else if (channel === "in_app") {
        await dispatchInAppNotification(userId, event, data, metadata);
        channels.push("in_app");
      } else if (channel === "sms") {
        await dispatchSmsNotification(userId, event, data, metadata);
        channels.push("sms");
      } else if (channel === "push") {
        await dispatchPushNotification(userId, event, data, metadata);
        channels.push("push");
      }
    }

    return { success: true, channels };
  } catch (error) {
    console.error(`Failed to send notification for event ${event}:`, error);
    return { success: false, channels };
  }
}

/**
 * Get user's notification preferences from their profile
 */
async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    // This would normally fetch from database
    // For now, return default preferences
    return {
      email: true,
      in_app: true,
      sms: false,
      push: false,
    };
  } catch (error) {
    console.error("Failed to fetch user preferences:", error);
    return {
      email: true,
      in_app: true,
    };
  }
}

/**
 * Dispatch email notification via queue
 */
async function dispatchEmailNotification(
  userId: string,
  event: NotificationEvent,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await emailQueue.add(
      "notification",
      {
        userId,
        event,
        data,
        metadata,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
      }
    );
  } catch (error) {
    console.error("Failed to dispatch email notification:", error);
  }
}

/**
 * Dispatch in-app notification
 */
async function dispatchInAppNotification(
  userId: string,
  event: NotificationEvent,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // In-app notifications would typically be stored in database
    // or sent via WebSocket/Server-Sent Events
    console.log(`In-app notification for user ${userId}:`, event, data);
  } catch (error) {
    console.error("Failed to dispatch in-app notification:", error);
  }
}

/**
 * Dispatch SMS notification
 */
async function dispatchSmsNotification(
  userId: string,
  event: NotificationEvent,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // SMS notifications would use a third-party provider like Twilio
    console.log(`SMS notification for user ${userId}:`, event, data);
  } catch (error) {
    console.error("Failed to dispatch SMS notification:", error);
  }
}

/**
 * Dispatch push notification
 */
async function dispatchPushNotification(
  userId: string,
  event: NotificationEvent,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Push notifications would use web-push or similar service
    console.log(`Push notification for user ${userId}:`, event, data);
  } catch (error) {
    console.error("Failed to dispatch push notification:", error);
  }
}

/**
 * Get notification template for an event
 */
export function getNotificationTemplate(event: NotificationEvent): {
  subject: string;
  template: string;
  category: string;
} {
  const templates: Record<
    NotificationEvent,
    { subject: string; template: string; category: string }
  > = {
    [NotificationEvent.CASE_CREATED]: {
      subject: "New Case Created",
      template: "case-created",
      category: "Cases",
    },
    [NotificationEvent.CASE_ASSIGNED]: {
      subject: "Case Assigned to You",
      template: "case-assigned",
      category: "Cases",
    },
    [NotificationEvent.CASE_STATUS_CHANGED]: {
      subject: "Case Status Updated",
      template: "case-status-changed",
      category: "Cases",
    },
    [NotificationEvent.CASE_RESOLVED]: {
      subject: "Case Resolved",
      template: "case-resolved",
      category: "Cases",
    },
    [NotificationEvent.CASE_CLOSED]: {
      subject: "Case Closed",
      template: "case-closed",
      category: "Cases",
    },
    [NotificationEvent.MESSAGE_ADDED]: {
      subject: "New Message",
      template: "message-added",
      category: "Messages",
    },
    [NotificationEvent.SLA_WARNING]: {
      subject: "SLA Warning",
      template: "sla-warning",
      category: "SLA",
    },
    [NotificationEvent.SLA_BREACHED]: {
      subject: "SLA Breached",
      template: "sla-breached",
      category: "SLA",
    },
    [NotificationEvent.CONSTITUENT_REPLIED]: {
      subject: "Constituent Reply",
      template: "constituent-replied",
      category: "Messages",
    },
    [NotificationEvent.TEMPLATE_APPROVED]: {
      subject: "Template Approved",
      template: "template-approved",
      category: "Templates",
    },
    [NotificationEvent.SIGNAL_FLAGGED]: {
      subject: "Signal Flagged",
      template: "signal-flagged",
      category: "Signals",
    },
    [NotificationEvent.USER_INVITED]: {
      subject: "You've Been Invited",
      template: "user-invited",
      category: "Account",
    },
  };

  return templates[event] || { subject: "Notification", template: "default", category: "General" };
}

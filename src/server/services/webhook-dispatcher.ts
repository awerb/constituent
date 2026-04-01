import { prisma } from "@/lib/db";
import { webhookQueue } from "@/lib/queue";
import crypto from "crypto";

export interface WebhookPayload {
  [key: string]: any;
}

/**
 * Dispatch a webhook to all active webhooks for a given event
 */
export async function dispatchWebhook(
  cityId: string,
  event: string,
  payload: WebhookPayload
): Promise<void> {
  try {
    console.log(`Dispatching webhook for city ${cityId}, event: ${event}`);

    // Find all active webhooks configured for this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        cityId,
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    console.log(`Found ${webhooks.length} active webhooks for event ${event}`);

    // Queue each webhook for delivery
    for (const webhook of webhooks) {
      try {
        // Add to queue for async processing
        await webhookQueue.add(
          "delivery",
          {
            webhookId: webhook.id,
            event,
            payload,
            signature: generateWebhookSignature(payload, webhook.secret),
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: true,
          }
        );

        console.log(`Queued webhook delivery: ${webhook.id}`);
      } catch (error) {
        console.error(`Failed to queue webhook ${webhook.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error dispatching webhooks:", error);
  }
}

/**
 * Process webhook delivery - actually send the HTTP request
 * Called by the webhook queue worker
 */
export async function processWebhookDelivery(
  webhookId: string,
  event: string,
  payload: WebhookPayload,
  signature: string,
  attempt: number = 1
): Promise<void> {
  try {
    console.log(`Processing webhook delivery: ${webhookId}, attempt ${attempt}`);

    const webhook = await prisma.webhook.findUniqueOrThrow({
      where: { id: webhookId },
    });

    if (!webhook.isActive) {
      console.log(`Webhook ${webhookId} is no longer active`);
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": event,
      "X-Webhook-Signature": signature,
      "X-Webhook-Delivery": new Date().toISOString(),
    };

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    console.log(`Sending POST request to ${webhook.url}`);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${await response.text().catch(() => "Unknown error")}`
      );
    }

    console.log(`Webhook delivered successfully to ${webhook.url}`);

    // Update webhook success timestamp
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      },
    });
  } catch (error) {
    console.error(`Error processing webhook delivery:`, error);

    // Update failure count
    const webhook = await prisma.webhook.findUnique({
      where: { webhookId },
    });

    if (webhook) {
      const newFailureCount = (webhook.failureCount || 0) + 1;

      // Deactivate after 10 consecutive failures
      if (newFailureCount >= 10) {
        console.error(`Webhook ${webhookId} deactivated after 10 failures`);

        await prisma.webhook.update({
          where: { id: webhookId },
          data: {
            isActive: false,
            failureCount: newFailureCount,
          },
        });

        // Notify admin about webhook failure
        await notifyAdminWebhookFailure(webhook);
      } else {
        await prisma.webhook.update({
          where: { id: webhookId },
          data: {
            failureCount: newFailureCount,
          },
        });
      }
    }

    throw error;
  }
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  payload: WebhookPayload,
  secret: string
): string {
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  return signature;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Notify admin that a webhook has failed repeatedly
 */
async function notifyAdminWebhookFailure(webhook: any): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: {
        cityId: webhook.cityId,
        role: "ADMIN",
        isActive: true,
      },
    });

    if (admins.length === 0) {
      console.log("No admins found to notify");
      return;
    }

    // Import notifier to send notifications
    const { notifyCityAdmins } = await import("./notifier");
    const { NotificationEvent } = await import("@/lib/notifications");

    await notifyCityAdmins(webhook.cityId, NotificationEvent.SLA_BREACHED, {
      subject: "Webhook Failure Alert",
      body: `Webhook "${webhook.name}" (${webhook.url}) has been deactivated due to repeated failures (10+ consecutive failures).`,
    });
  } catch (error) {
    console.error("Error notifying admin about webhook failure:", error);
  }
}

/**
 * Test a webhook by sending a test payload
 */
export async function testWebhook(webhookId: string): Promise<boolean> {
  try {
    const webhook = await prisma.webhook.findUniqueOrThrow({
      where: { id: webhookId },
    });

    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      test: true,
    };

    const signature = generateWebhookSignature(testPayload, webhook.secret);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": "webhook.test",
      "X-Webhook-Signature": signature,
      "X-Webhook-Delivery": new Date().toISOString(),
    };

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
      timeout: 30000,
    });

    const success = response.ok;

    console.log(`Webhook test for ${webhookId}: ${success ? "SUCCESS" : "FAILED"}`);

    return success;
  } catch (error) {
    console.error(`Error testing webhook:`, error);
    return false;
  }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    // Note: In a production system, you'd have a separate WebhookDelivery table
    // For now, we'll return metadata from the webhook record
    const webhook = await prisma.webhook.findUniqueOrThrow({
      where: { id: webhookId },
    });

    return [
      {
        id: webhook.id,
        url: webhook.url,
        lastTriggered: webhook.lastTriggeredAt,
        failureCount: webhook.failureCount,
        isActive: webhook.isActive,
      },
    ];
  } catch (error) {
    console.error("Error getting webhook deliveries:", error);
    throw error;
  }
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  cityId: string,
  name: string,
  url: string,
  events: string[],
  secret: string
): Promise<any> {
  try {
    console.log(`Creating webhook: ${name} for ${url}`);

    const webhook = await prisma.webhook.create({
      data: {
        cityId,
        name,
        url,
        events,
        secret,
        isActive: true,
      },
    });

    console.log(`Webhook created: ${webhook.id}`);

    return webhook;
  } catch (error) {
    console.error("Error creating webhook:", error);
    throw error;
  }
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  webhookId: string,
  updates: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
  }
): Promise<any> {
  try {
    console.log(`Updating webhook: ${webhookId}`);

    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: updates,
    });

    console.log(`Webhook updated: ${webhookId}`);

    return webhook;
  } catch (error) {
    console.error("Error updating webhook:", error);
    throw error;
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  try {
    console.log(`Deleting webhook: ${webhookId}`);

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    console.log(`Webhook deleted: ${webhookId}`);
  } catch (error) {
    console.error("Error deleting webhook:", error);
    throw error;
  }
}

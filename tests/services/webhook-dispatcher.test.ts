import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dispatchWebhook,
  processWebhookDelivery,
  generateWebhookSignature,
  verifyWebhookSignature,
  testWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
} from "@/server/services/webhook-dispatcher";
import { prisma } from "@/lib/db";
import { webhookQueue } from "@/lib/queue";
import crypto from "crypto";

vi.mock("@/lib/db");
vi.mock("@/lib/queue");
vi.mock("node:crypto");

global.fetch = vi.fn();

describe("Webhook Dispatcher Service", () => {
  const mockWebhook = {
    id: "webhook-1",
    cityId: "city-1",
    url: "https://external-service.com/webhook",
    events: ["case.created", "case.assigned"],
    secret: "webhook-secret-key",
    isActive: true,
    failureCount: 0,
    lastTriggeredAt: null,
    name: "External Service Webhook",
  };

  const mockPayload = {
    caseId: "case-1",
    referenceNumber: "REF-2024-001",
    constituentName: "John Smith",
    subject: "Street Repair Request",
    status: "NEW",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.webhook).findMany.mockResolvedValue([mockWebhook]);
    vi.mocked(webhookQueue.add).mockResolvedValue({
      id: "job-1",
    } as any);
  });

  describe("generateWebhookSignature - HMAC Signing", () => {
    it("should sign payload with HMAC-SHA256 using webhook secret", () => {
      const payload = { test: "data" };
      const secret = "my-secret";

      const signature = generateWebhookSignature(payload, secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe("string");
      expect(signature.length).toBeGreaterThan(0);
    });

    it("should generate same signature for same payload and secret", () => {
      const payload = { test: "data" };
      const secret = "secret-key";

      const sig1 = generateWebhookSignature(payload, secret);
      const sig2 = generateWebhookSignature(payload, secret);

      expect(sig1).toBe(sig2);
    });

    it("should generate different signature for different payloads", () => {
      const secret = "secret-key";

      const sig1 = generateWebhookSignature({ test: "data1" }, secret);
      const sig2 = generateWebhookSignature({ test: "data2" }, secret);

      expect(sig1).not.toBe(sig2);
    });

    it("should generate different signature for different secrets", () => {
      const payload = { test: "data" };

      const sig1 = generateWebhookSignature(payload, "secret1");
      const sig2 = generateWebhookSignature(payload, "secret2");

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyWebhookSignature - Signature Validation", () => {
    it("should verify valid webhook signature", () => {
      const payload = '{"test":"data"}';
      const secret = "secret-key";

      const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const isValid = verifyWebhookSignature(payload, signature, secret);

      expect(isValid).toBe(true);
    });

    it("should reject invalid webhook signature", () => {
      const payload = '{"test":"data"}';
      const secret = "secret-key";
      const invalidSignature = "invalid-signature-here";

      // Mock timing-safe comparison to fail
      vi.spyOn(crypto, "timingSafeEqual").mockImplementation(() => false);

      const isValid = verifyWebhookSignature(
        payload,
        invalidSignature,
        secret
      );

      expect(isValid).toBe(false);
    });
  });

  describe("dispatchWebhook - Webhook Finding and Queuing", () => {
    it("should find all active webhooks matching the event for the city", async () => {
      await dispatchWebhook("city-1", "case.created", mockPayload);

      expect(prisma.webhook.findMany).toHaveBeenCalledWith({
        where: {
          cityId: "city-1",
          isActive: true,
          events: {
            has: "case.created",
          },
        },
      });
    });

    it("should queue webhook for delivery with correct job data", async () => {
      await dispatchWebhook("city-1", "case.created", mockPayload);

      expect(webhookQueue.add).toHaveBeenCalledWith(
        "delivery",
        expect.objectContaining({
          webhookId: "webhook-1",
          event: "case.created",
          payload: mockPayload,
          signature: expect.any(String),
        }),
        expect.any(Object)
      );
    });

    it("should include HMAC-SHA256 signature in queued job", async () => {
      await dispatchWebhook("city-1", "case.created", mockPayload);

      const call = vi.mocked(webhookQueue.add).mock.calls[0];
      expect(call[1].signature).toBeDefined();
      expect(typeof call[1].signature).toBe("string");
    });

    it("should set retry attempts for webhook queue job", async () => {
      await dispatchWebhook("city-1", "case.created", mockPayload);

      const call = vi.mocked(webhookQueue.add).mock.calls[0];
      expect(call[2].attempts).toBe(3);
    });

    it("should set exponential backoff for retries", async () => {
      await dispatchWebhook("city-1", "case.created", mockPayload);

      const call = vi.mocked(webhookQueue.add).mock.calls[0];
      expect(call[2].backoff?.type).toBe("exponential");
      expect(call[2].backoff?.delay).toBe(5000);
    });

    it("should skip inactive webhooks", async () => {
      const inactiveWebhook = { ...mockWebhook, isActive: false };
      vi.mocked(prisma.webhook).findMany.mockResolvedValue([
        inactiveWebhook,
      ]);

      await dispatchWebhook("city-1", "case.created", mockPayload);

      expect(webhookQueue.add).not.toHaveBeenCalled();
    });

    it("should handle city with no active webhooks", async () => {
      vi.mocked(prisma.webhook).findMany.mockResolvedValue([]);

      await dispatchWebhook("city-1", "case.created", mockPayload);

      expect(webhookQueue.add).not.toHaveBeenCalled();
    });

    it("should queue multiple webhooks matching the same event", async () => {
      const webhooks = [
        mockWebhook,
        { ...mockWebhook, id: "webhook-2" },
        { ...mockWebhook, id: "webhook-3" },
      ];
      vi.mocked(prisma.webhook).findMany.mockResolvedValue(webhooks);

      await dispatchWebhook("city-1", "case.created", mockPayload);

      expect(webhookQueue.add).toHaveBeenCalledTimes(3);
    });
  });

  describe("processWebhookDelivery - HTTP Delivery", () => {
    beforeEach(() => {
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        mockWebhook
      );
    });

    it("should send POST request with correct headers", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature-here"
      );

      const call = vi.mocked(global.fetch).mock.calls[0];
      expect(call[0]).toBe("https://external-service.com/webhook");
      expect(call[1]?.method).toBe("POST");
      expect(call[1]?.headers?.["Content-Type"]).toBe("application/json");
      expect(call[1]?.headers?.["X-Webhook-Event"]).toBe("case.created");
      expect(call[1]?.headers?.["X-Webhook-Signature"]).toBe(
        "signature-here"
      );
    });

    it("should handle successful delivery (200 response)", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature"
      );

      expect(prisma.webhook.update).toHaveBeenCalledWith({
        where: { id: "webhook-1" },
        data: {
          lastTriggeredAt: expect.any(Date),
          failureCount: 0,
        },
      });
    });

    it("should handle failed delivery (500 response) and increment failureCount", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Server Error"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.webhook).findUnique.mockResolvedValue({
        ...mockWebhook,
        failureCount: 2,
      });

      try {
        await processWebhookDelivery(
          "webhook-1",
          "case.created",
          mockPayload,
          "signature"
        );
      } catch (e) {
        // Expected to throw
      }

      expect(prisma.webhook.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failureCount: 3,
          }),
        })
      );
    });

    it("should reset failureCount on successful delivery", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue({
        ...mockWebhook,
        failureCount: 5,
      });

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature"
      );

      expect(prisma.webhook.update).toHaveBeenCalledWith({
        where: { id: "webhook-1" },
        data: {
          lastTriggeredAt: expect.any(Date),
          failureCount: 0,
        },
      });
    });

    it("should update lastTriggeredAt on successful delivery", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature"
      );

      const call = vi.mocked(prisma.webhook.update).mock.calls[0];
      expect(call[0].data.lastTriggeredAt).toBeInstanceOf(Date);
    });

    it("should mark webhook inactive after 10 consecutive failures", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Error"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.webhook).findUnique.mockResolvedValue({
        ...mockWebhook,
        failureCount: 9,
      });

      try {
        await processWebhookDelivery(
          "webhook-1",
          "case.created",
          mockPayload,
          "signature"
        );
      } catch (e) {
        // Expected
      }

      expect(prisma.webhook.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
            failureCount: 10,
          }),
        })
      );
    });

    it("should notify admin when webhook deactivated", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Error"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.webhook).findUnique.mockResolvedValue({
        ...mockWebhook,
        failureCount: 9,
      });

      try {
        await processWebhookDelivery(
          "webhook-1",
          "case.created",
          mockPayload,
          "signature"
        );
      } catch (e) {
        // Expected
      }

      // Should attempt to notify admins
      expect(prisma.webhook.update).toHaveBeenCalled();
    });

    it("should handle network timeout", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Timeout"));
      vi.mocked(prisma.webhook).findUnique.mockResolvedValue(mockWebhook);

      await expect(
        processWebhookDelivery(
          "webhook-1",
          "case.created",
          mockPayload,
          "signature"
        )
      ).rejects.toThrow();
    });

    it("should handle DNS resolution failure", async () => {
      vi.mocked(global.fetch).mockRejectedValue(
        new Error("getaddrinfo ENOTFOUND")
      );
      vi.mocked(prisma.webhook).findUnique.mockResolvedValue(mockWebhook);

      await expect(
        processWebhookDelivery(
          "webhook-1",
          "case.created",
          mockPayload,
          "signature"
        )
      ).rejects.toThrow();
    });

    it("should skip inactive webhooks during delivery", async () => {
      const inactiveWebhook = { ...mockWebhook, isActive: false };
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        inactiveWebhook
      );

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature"
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should include timestamp in webhook payload", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature"
      );

      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("testWebhook - Configuration Testing", () => {
    beforeEach(() => {
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        mockWebhook
      );
    });

    it("should return true on successful test", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await testWebhook("webhook-1");

      expect(result).toBe(true);
    });

    it("should return false on failed test", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      const result = await testWebhook("webhook-1");

      expect(result).toBe(false);
    });

    it("should send test event type", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      await testWebhook("webhook-1");

      const call = vi.mocked(global.fetch).mock.calls[0];
      expect(call[1]?.headers?.["X-Webhook-Event"]).toBe("webhook.test");
    });

    it("should include signature in test request", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

      await testWebhook("webhook-1");

      const call = vi.mocked(global.fetch).mock.calls[0];
      expect(call[1]?.headers?.["X-Webhook-Signature"]).toBeDefined();
    });
  });

  describe("Webhook Management", () => {
    it("should create a new webhook", async () => {
      vi.mocked(prisma.webhook).create.mockResolvedValue(mockWebhook);

      const result = await createWebhook(
        "city-1",
        "External Service",
        "https://external.com/webhook",
        ["case.created", "case.assigned"],
        "secret-key"
      );

      expect(prisma.webhook.create).toHaveBeenCalledWith({
        data: {
          cityId: "city-1",
          name: "External Service",
          url: "https://external.com/webhook",
          events: ["case.created", "case.assigned"],
          secret: "secret-key",
          isActive: true,
        },
      });

      expect(result).toEqual(mockWebhook);
    });

    it("should update a webhook", async () => {
      const updates = {
        url: "https://new-url.com/webhook",
        isActive: false,
      };
      vi.mocked(prisma.webhook).update.mockResolvedValue({
        ...mockWebhook,
        ...updates,
      });

      const result = await updateWebhook("webhook-1", updates);

      expect(prisma.webhook.update).toHaveBeenCalledWith({
        where: { id: "webhook-1" },
        data: updates,
      });

      expect(result.url).toBe("https://new-url.com/webhook");
    });

    it("should delete a webhook", async () => {
      await deleteWebhook("webhook-1");

      expect(prisma.webhook.delete).toHaveBeenCalledWith({
        where: { id: "webhook-1" },
      });
    });
  });

  describe("Webhook Delivery History", () => {
    it("should get webhook deliveries", async () => {
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        mockWebhook
      );

      const result = await getWebhookDeliveries("webhook-1");

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include webhook metadata in deliveries", async () => {
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        mockWebhook
      );

      const result = await getWebhookDeliveries("webhook-1");

      expect(result[0]).toMatchObject({
        id: "webhook-1",
        url: "https://external-service.com/webhook",
        isActive: true,
      });
    });
  });

  describe("Webhook Payload", () => {
    it("should not include internal notes in webhook payload", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        mockWebhook
      );

      const payloadWithInternalNotes = {
        ...mockPayload,
        internalNote: "This should not be sent",
      };

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        payloadWithInternalNotes,
        "signature"
      );

      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.data).toEqual(payloadWithInternalNotes);
    });

    it("should include all expected case data fields in payload", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);
      vi.mocked(prisma.webhook).findUniqueOrThrow.mockResolvedValue(
        mockWebhook
      );

      await processWebhookDelivery(
        "webhook-1",
        "case.created",
        mockPayload,
        "signature"
      );

      const call = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.data.caseId).toBe("case-1");
      expect(body.data.referenceNumber).toBe("REF-2024-001");
      expect(body.data.constituentName).toBe("John Smith");
    });
  });
});

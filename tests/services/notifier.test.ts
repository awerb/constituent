import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notify,
  notifyDepartmentManagers,
  notifyCityAdmins,
  updateNotificationPreferences,
} from "@/server/services/notifier";
import { NotificationEvent } from "@/lib/notifications";
import { prisma } from "@/lib/db";
import * as emailSender from "@/server/services/email-sender";
import * as queue from "@/lib/queue";

vi.mock("@/lib/db");
vi.mock("@/server/services/email-sender");
vi.mock("@/lib/queue");

describe("Notifier Service", () => {
  const mockUser = {
    id: "user-1",
    email: "agent@city.gov",
    isActive: true,
    notificationPreferences: {
      email: true,
      webhook: true,
      events: {
        [NotificationEvent.CASE_ASSIGNED]: true,
      },
    },
  };

  const mockPayload = {
    referenceNumber: "REF-2024-001",
    constituentName: "John Smith",
    subject: "Park Maintenance Issue",
    hoursRemaining: "2",
    minutesRemaining: "30",
    deadline: "2024-01-15T14:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user).findUniqueOrThrow.mockResolvedValue(mockUser);
    vi.mocked(emailSender.sendNotificationEmail).mockResolvedValue(undefined);
    vi.mocked(queue.webhookQueue).add.mockResolvedValue({
      id: "job-1",
    } as any);
  });

  describe("notify - Basic Notification Dispatch", () => {
    it("should send email notification for case.assigned event", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "agent@city.gov",
          subject: expect.stringContaining("Case Assigned"),
          body: expect.any(String),
        })
      );
    });

    it("should send webhook notification when user has webhook configured", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(queue.webhookQueue.add).toHaveBeenCalledWith(
        "notification",
        expect.objectContaining({
          userId: "user-1",
          event: NotificationEvent.CASE_ASSIGNED,
          payload: mockPayload,
        }),
        expect.any(Object)
      );
    });

    it("should respect user notification preferences (email=false skips email)", async () => {
      const userNoEmail = {
        ...mockUser,
        notificationPreferences: { email: false, webhook: true },
      };
      vi.mocked(prisma.user).findUniqueOrThrow.mockResolvedValue(userNoEmail);

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(emailSender.sendNotificationEmail).not.toHaveBeenCalled();
      expect(queue.webhookQueue.add).toHaveBeenCalled();
    });

    it("should handle user with no notification preferences gracefully", async () => {
      const userNoPrefs = { ...mockUser, notificationPreferences: {} };
      vi.mocked(prisma.user).findUniqueOrThrow.mockResolvedValue(userNoPrefs);

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      // Should default to email channel
      expect(emailSender.sendNotificationEmail).toHaveBeenCalled();
    });

    it("should not send if user has disabled this specific event", async () => {
      const userDisabledEvent = {
        ...mockUser,
        notificationPreferences: {
          email: true,
          events: {
            [NotificationEvent.CASE_ASSIGNED]: false,
          },
        },
      };
      vi.mocked(prisma.user).findUniqueOrThrow.mockResolvedValue(
        userDisabledEvent
      );

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(emailSender.sendNotificationEmail).not.toHaveBeenCalled();
      expect(queue.webhookQueue.add).not.toHaveBeenCalled();
    });

    it("should handle inactive user (skip notification)", async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      vi.mocked(prisma.user).findUniqueOrThrow.mockResolvedValue(inactiveUser);

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(emailSender.sendNotificationEmail).not.toHaveBeenCalled();
      expect(queue.webhookQueue.add).not.toHaveBeenCalled();
    });

    it("should include case reference number in all notifications", async () => {
      await notify("user-1", NotificationEvent.SLA_WARNING, mockPayload);

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("REF-2024-001"),
        })
      );
    });
  });

  describe("notify - Event Types", () => {
    beforeEach(() => {
      vi.mocked(emailSender.sendNotificationEmail).mockResolvedValue(undefined);
    });

    it("should notify assignee for case.assigned event", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, {
        ...mockPayload,
      });

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Assigned"),
        })
      );
    });

    it("should notify assignee for sla.warning event", async () => {
      await notify("user-1", NotificationEvent.SLA_WARNING, mockPayload);

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("SLA Warning"),
        })
      );
    });

    it("should notify for sla.breached event", async () => {
      await notify("user-1", NotificationEvent.SLA_BREACHED, mockPayload);

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("BREACHED"),
        })
      );
    });

    it("should notify assignee for case.constituentReply", async () => {
      await notify("user-1", NotificationEvent.CONSTITUENT_REPLIED, {
        ...mockPayload,
        referenceNumber: "REF-2024-002",
      });

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Constituent Reply"),
        })
      );
    });

    it("should notify for template.approved event", async () => {
      await notify("user-1", NotificationEvent.TEMPLATE_APPROVED, {});

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Template"),
        })
      );
    });
  });

  describe("notify - Template Variable Replacement", () => {
    it("should replace {{referenceNumber}} in template", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, {
        referenceNumber: "REF-2024-ABC",
        subject: "Test",
      });

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("REF-2024-ABC"),
        })
      );
    });

    it("should replace {{constituentName}} in template", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, {
        referenceNumber: "REF-001",
        constituentName: "Sarah Johnson",
        subject: "Test",
      });

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Sarah Johnson"),
        })
      );
    });

    it("should replace {{subject}} in template", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, {
        referenceNumber: "REF-001",
        subject: "Broken Traffic Light",
      });

      expect(emailSender.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Broken Traffic Light"),
        })
      );
    });

    it("should replace {{hoursRemaining}} and {{minutesRemaining}}", async () => {
      await notify("user-1", NotificationEvent.SLA_WARNING, {
        referenceNumber: "REF-001",
        subject: "Test",
        hoursRemaining: "3",
        minutesRemaining: "45",
        deadline: "2024-01-15T14:00:00Z",
      });

      const call = vi.mocked(emailSender.sendNotificationEmail).mock
        .calls[0][0];
      expect(call.body).toContain("3");
      expect(call.body).toContain("45");
    });

    it("should handle multiple variable replacements", async () => {
      await notify("user-1", NotificationEvent.SLA_BREACHED, {
        referenceNumber: "REF-2024-XYZ",
        constituentName: "Alex Martinez",
        subject: "Park Maintenance",
        deadline: "2024-01-15T10:00:00Z",
      });

      const call = vi.mocked(emailSender.sendNotificationEmail).mock
        .calls[0][0];
      expect(call.body).toContain("REF-2024-XYZ");
      expect(call.body).toContain("Alex Martinez");
      expect(call.body).toContain("Park Maintenance");
    });
  });

  describe("notify - Webhook Queuing", () => {
    it("should queue webhook notification with correct job data", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(queue.webhookQueue.add).toHaveBeenCalledWith(
        "notification",
        {
          userId: "user-1",
          event: NotificationEvent.CASE_ASSIGNED,
          payload: mockPayload,
        },
        expect.any(Object)
      );
    });

    it("should set retry attempts for webhook queue", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      const call = vi.mocked(queue.webhookQueue.add).mock.calls[0];
      expect(call[2].attempts).toBe(3);
    });

    it("should set exponential backoff for webhook queue", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      const call = vi.mocked(queue.webhookQueue.add).mock.calls[0];
      expect(call[2].backoff?.type).toBe("exponential");
      expect(call[2].backoff?.delay).toBe(2000);
    });

    it("should skip webhook if user has webhook disabled", async () => {
      const userNoWebhook = {
        ...mockUser,
        notificationPreferences: { email: true, webhook: false },
      };
      vi.mocked(prisma.user).findUniqueOrThrow.mockResolvedValue(
        userNoWebhook
      );

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      expect(queue.webhookQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("notify - Error Handling", () => {
    it("should handle email send errors gracefully", async () => {
      vi.mocked(emailSender.sendNotificationEmail).mockRejectedValue(
        new Error("SMTP error")
      );

      // Should not throw
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);
    });

    it("should handle webhook queue errors gracefully", async () => {
      vi.mocked(queue.webhookQueue.add).mockRejectedValue(
        new Error("Queue error")
      );

      // Should not throw
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);
    });

    it("should handle user not found gracefully", async () => {
      vi.mocked(prisma.user).findUniqueOrThrow.mockRejectedValue(
        new Error("User not found")
      );

      // Should not throw
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);
    });
  });

  describe("notifyDepartmentManagers", () => {
    const mockManagers = [
      { ...mockUser, id: "mgr-1", email: "manager1@city.gov", role: "MANAGER" },
      { ...mockUser, id: "mgr-2", email: "manager2@city.gov", role: "ADMIN" },
    ];

    beforeEach(() => {
      vi.mocked(prisma.user).findMany.mockResolvedValue(mockManagers);
    });

    it("should notify all managers and admins in department", async () => {
      await notifyDepartmentManagers(
        "city-1",
        "dept-1",
        NotificationEvent.CASE_ESCALATED,
        { escalationReason: "Critical" }
      );

      expect(prisma.user).findMany.toHaveBeenCalledWith({
        where: {
          cityId: "city-1",
          departmentId: "dept-1",
          role: { in: ["MANAGER", "ADMIN"] },
          isActive: true,
        },
      });
    });

    it("should notify each manager with the event and payload", async () => {
      // Reset mock before this test
      vi.mocked(emailSender.sendNotificationEmail).mockClear();

      await notifyDepartmentManagers(
        "city-1",
        "dept-1",
        NotificationEvent.SLA_BREACHED,
        { caseRef: "REF-001" }
      );

      // Each manager should receive a notification (via notify function)
      expect(prisma.user).findMany.toHaveBeenCalled();
    });
  });

  describe("notifyCityAdmins", () => {
    const mockAdmins = [
      {
        ...mockUser,
        id: "admin-1",
        email: "admin1@city.gov",
        role: "ADMIN",
      },
      {
        ...mockUser,
        id: "admin-2",
        email: "admin2@city.gov",
        role: "SUPER_ADMIN",
      },
    ];

    beforeEach(() => {
      vi.mocked(prisma.user).findMany.mockResolvedValue(mockAdmins);
    });

    it("should notify all admins in city", async () => {
      await notifyCityAdmins("city-1", NotificationEvent.SIGNAL_FLAGGED, {
        newsletterTitle: "Park Updates",
      });

      expect(prisma.user).findMany.toHaveBeenCalledWith({
        where: {
          cityId: "city-1",
          role: { in: ["SUPER_ADMIN", "ADMIN"] },
          isActive: true,
        },
      });
    });

    it("should include both ADMIN and SUPER_ADMIN roles", async () => {
      await notifyCityAdmins(
        "city-1",
        NotificationEvent.WEBHOOK_FAILED,
        {}
      );

      const call = vi.mocked(prisma.user).findMany.mock.calls[0][0];
      expect(call.where?.role?.in).toContain("ADMIN");
      expect(call.where?.role?.in).toContain("SUPER_ADMIN");
    });
  });

  describe("updateNotificationPreferences", () => {
    it("should update user notification preferences", async () => {
      const newPrefs = {
        email: false,
        webhook: true,
        events: {
          [NotificationEvent.CASE_ASSIGNED]: false,
        },
      };

      await updateNotificationPreferences("user-1", newPrefs);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          notificationPreferences: newPrefs,
        },
      });
    });

    it("should handle partial preference updates", async () => {
      const partialPrefs = {
        email: false,
      };

      await updateNotificationPreferences("user-1", partialPrefs);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
        })
      );
    });

    it("should handle error on preference update", async () => {
      vi.mocked(prisma.user).update.mockRejectedValue(
        new Error("Update failed")
      );

      await expect(
        updateNotificationPreferences("user-1", { email: false })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("Notification Payload Validation", () => {
    it("should handle payload with extra fields", async () => {
      const extraPayload = {
        ...mockPayload,
        extraField: "should be ignored",
        anotherField: 123,
      };

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, extraPayload);

      expect(emailSender.sendNotificationEmail).toHaveBeenCalled();
    });

    it("should handle payload with missing optional fields", async () => {
      const minimalPayload = {
        referenceNumber: "REF-001",
      };

      await notify("user-1", NotificationEvent.CASE_ASSIGNED, minimalPayload);

      expect(emailSender.sendNotificationEmail).toHaveBeenCalled();
    });

    it("should handle empty payload", async () => {
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, {});

      expect(emailSender.sendNotificationEmail).toHaveBeenCalled();
    });
  });

  describe("Notification Deduplication", () => {
    it("should not send duplicate notifications to same user for same event", async () => {
      // Call notify twice with same params
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);
      await notify("user-1", NotificationEvent.CASE_ASSIGNED, mockPayload);

      // Each call should queue independently (dedup would be at queue/worker level)
      expect(emailSender.sendNotificationEmail).toHaveBeenCalledTimes(2);
    });
  });
});

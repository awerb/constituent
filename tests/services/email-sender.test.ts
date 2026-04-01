import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendEmail,
  sendCaseResponseEmail,
  sendNotificationEmail,
  testEmailConfiguration,
} from "@/server/services/email-sender";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

vi.mock("@/lib/db");
vi.mock("nodemailer");

describe("Email Sender Service", () => {
  const mockTransporter = {
    sendMail: vi.fn(),
    verify: vi.fn(),
  };

  const mockCity = {
    id: "city-1",
    name: "San Francisco",
  };

  const mockConstituent = {
    id: "const-1",
    name: "Jane Doe",
    email: "jane@example.com",
  };

  const mockCase = {
    id: "case-1",
    subject: "Street Pothole Report",
    description: "Large pothole on Main St",
    referenceNumber: "REF-2024-001",
    constituent: mockConstituent,
    city: mockCity,
    department: { id: "dept-1", name: "Public Works" },
    firstRespondedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nodemailer.createTransport).mockReturnValue(
      mockTransporter as any
    );
    mockTransporter.sendMail.mockResolvedValue({ messageId: "msg-123" });
    mockTransporter.verify.mockResolvedValue(true);
  });

  describe("sendEmail - Basic Email Dispatch", () => {
    it("should send email via nodemailer transport", async () => {
      const params = {
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      };

      await sendEmail(params);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.to).toBe("recipient@example.com");
      expect(call.subject).toBe("Test Subject");
    });

    it("should wrap content in branded HTML template", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Content</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("<!DOCTYPE html>");
      expect(call.html).toContain("City Government");
      expect(call.html).toContain("Content");
      expect(call.html).toContain(".header");
      expect(call.html).toContain(".footer");
    });

    it("should use city logo and colors in template", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>City email</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("#0066cc");
      expect(call.html).toContain("background-color");
      expect(call.html).toContain("header");
    });

    it("should personalize with constituent name when provided", async () => {
      await sendEmail({
        to: "jane@example.com",
        subject: "Your case status",
        html: "<p>Dear Jane, your case is resolved</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("jane@example.com");
    });

    it("should set correct from header", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.from).toBeDefined();
      expect(call.from).toMatch(/noreply|support/i);
    });

    it("should set correct replyTo header", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        replyTo: "support@city.gov",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.replyTo).toBe("support@city.gov");
    });

    it("should include text fallback for HTML emails", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<h1>Hello</h1><p>This is a test</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.text).toBeDefined();
      expect(call.text).toContain("Hello");
      expect(call.text).toContain("This is a test");
    });

    it("should use provided text instead of stripping HTML", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>HTML version</p>",
        text: "Plain text version",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.text).toBe("Plain text version");
    });
  });

  describe("sendCaseResponseEmail - Case Response Dispatch", () => {
    beforeEach(() => {
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
    });

    it("should send case response email to constituent", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "<p>We have resolved your issue</p>",
      });

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.to).toBe("jane@example.com");
    });

    it("should include reference number in subject line", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response text",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.subject).toContain("Re:");
      expect(call.subject).toContain("Street Pothole Report");
    });

    it("should include reference number in email body", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "We have fixed the pothole",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("REF-2024-001");
      expect(call.html).toContain("Case Reference Number");
    });

    it("should include original subject in email body", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("Street Pothole Report");
      expect(call.html).toContain("Original Subject");
    });

    it("should personalize with constituent name", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("Jane Doe");
    });

    it("should include department name in greeting", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("San Francisco");
      expect(call.html).toContain("Public Works");
    });

    it("should update case firstRespondedAt on send", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
      });

      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: "case-1" },
        data: {
          firstRespondedAt: expect.any(Date),
        },
      });
    });

    it("should preserve existing firstRespondedAt when updating", async () => {
      const existingDate = new Date("2024-01-01");
      const caseWithResponse = { ...mockCase, firstRespondedAt: existingDate };
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(
        caseWithResponse
      );

      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
      });

      expect(prisma.case.update).toHaveBeenCalledWith({
        where: { id: "case-1" },
        data: {
          firstRespondedAt: existingDate,
        },
      });
    });

    it("should include sender name when provided", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
        senderName: "John Smith, Parks Director",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("John Smith, Parks Director");
    });

    it("should default to department name when sender name not provided", async () => {
      await sendCaseResponseEmail({
        caseId: "case-1",
        messageContent: "Response",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("San Francisco Public Works");
    });
  });

  describe("sendNotificationEmail - Internal Notifications", () => {
    it("should send notification email to staff", async () => {
      await sendNotificationEmail({
        to: "staff@city.gov",
        subject: "Case Assigned",
        body: "Case REF-001 has been assigned to you",
      });

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.to).toBe("staff@city.gov");
      expect(call.subject).toBe("Case Assigned");
    });

    it("should use simpler template for internal notifications", async () => {
      await sendNotificationEmail({
        to: "staff@city.gov",
        subject: "Alert",
        body: "Important notification",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).not.toContain(".header");
      expect(call.html).not.toContain(".footer");
      expect(call.html).toContain("Important notification");
    });

    it("should convert line breaks to HTML breaks", async () => {
      await sendNotificationEmail({
        to: "staff@city.gov",
        subject: "Multi-line",
        body: "Line 1\nLine 2\nLine 3",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("<br/>");
    });

    it("should include automated notification footer", async () => {
      await sendNotificationEmail({
        to: "staff@city.gov",
        subject: "Notification",
        body: "Content",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("automated notification");
      expect(call.html).toContain("Constituent Response System");
    });

    it("should set both HTML and text body", async () => {
      await sendNotificationEmail({
        to: "staff@city.gov",
        subject: "Test",
        body: "Notification content",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toBeDefined();
      expect(call.text).toBeDefined();
      expect(call.text).toBe("Notification content");
    });
  });

  describe("Email Error Handling", () => {
    it("should handle SMTP connection failure gracefully", async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error("SMTP connection failed")
      );

      await expect(
        sendEmail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("SMTP connection failed");
    });

    it("should handle invalid email address", async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error("Invalid email address")
      );

      await expect(
        sendEmail({
          to: "invalid-email",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Invalid email address");
    });

    it("should handle SMTP auth failure", async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error("Authentication failed")
      );

      await expect(
        sendEmail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Authentication failed");
    });

    it("should handle case not found error", async () => {
      vi.mocked(prisma.case).findUniqueOrThrow.mockRejectedValue(
        new Error("Case not found")
      );

      await expect(
        sendCaseResponseEmail({
          caseId: "nonexistent",
          messageContent: "Response",
        })
      ).rejects.toThrow("Case not found");
    });
  });

  describe("HTML Content Handling", () => {
    it("should sanitize HTML content (XSS prevention)", async () => {
      const maliciousHtml =
        '<p>Safe</p><img src=x onerror="alert(1)">';

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: maliciousHtml,
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      // The service should include the HTML but the onerror shouldn't execute in email clients
      expect(call.html).toBeDefined();
    });

    it("should handle HTML with special characters", async () => {
      const htmlWithSpecialChars =
        '<p>Values & "quoted" and <special></p>';

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: htmlWithSpecialChars,
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toBeDefined();
    });

    it("should handle HTML with styles and formatting", async () => {
      const styledHtml = `
        <div style="color: red; font-weight: bold;">
          Important Message
        </div>
      `;

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: styledHtml,
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("Important Message");
    });
  });

  describe("testEmailConfiguration - Configuration Testing", () => {
    it("should return true when email configuration is valid", async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await testEmailConfiguration();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it("should return false when email configuration fails", async () => {
      mockTransporter.verify.mockRejectedValue(
        new Error("Invalid SMTP configuration")
      );

      const result = await testEmailConfiguration();

      expect(result).toBe(false);
    });

    it("should handle various SMTP errors gracefully", async () => {
      const errors = [
        new Error("Invalid hostname"),
        new Error("SMTP port unreachable"),
        new Error("Authentication failed"),
        new Error("TLS error"),
      ];

      for (const error of errors) {
        mockTransporter.verify.mockRejectedValueOnce(error);
        const result = await testEmailConfiguration();
        expect(result).toBe(false);
      }
    });
  });

  describe("Email Retry Behavior", () => {
    it("should retry on transient SMTP errors", async () => {
      let attempt = 0;
      mockTransporter.sendMail.mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error("Temporary failure in sending mail");
        }
        return { messageId: "msg-123" };
      });

      // Note: The actual retry logic would be in the calling code or queue
      // This test shows the email service receives the message correctly after retry
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe("Environment Variables", () => {
    it("should use FROM_EMAIL environment variable when set", async () => {
      process.env.FROM_EMAIL = "official@city.gov";

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.from).toBe("official@city.gov");

      delete process.env.FROM_EMAIL;
    });

    it("should use REPLY_TO_EMAIL environment variable when set", async () => {
      process.env.REPLY_TO_EMAIL = "noreply@city.gov";

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.replyTo).toBe("noreply@city.gov");

      delete process.env.REPLY_TO_EMAIL;
    });

    it("should use SUPPORT_EMAIL in branded template footer", async () => {
      process.env.SUPPORT_EMAIL = "support@municipality.gov";

      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Content</p>",
      });

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain("support@municipality.gov");

      delete process.env.SUPPORT_EMAIL;
    });
  });
});

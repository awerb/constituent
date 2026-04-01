import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendCaseResponseEmailParams {
  caseId: string;
  messageContent: string;
  senderName?: string;
}

export interface SendNotificationEmailParams {
  to: string;
  subject: string;
  body: string;
  isInternalNote?: boolean;
}

// Initialize nodemailer transporter
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || "localhost";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  console.log(`Creating SMTP transporter for ${smtpHost}:${smtpPort}`);

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });
};

/**
 * Send a branded email with city logo/colors and template
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    const { to, subject, html, text, from, replyTo } = params;

    console.log(`Sending email to ${to}: ${subject}`);

    const transporter = getTransporter();

    // Extract city context from email if possible
    // For now, use default branding
    const brandedHtml = wrapWithBrandedTemplate(html, {
      cityName: "City Government",
      citySupportEmail: process.env.SUPPORT_EMAIL || "support@city.gov",
    });

    const mailOptions = {
      from: from || process.env.FROM_EMAIL || "noreply@city.gov",
      to,
      subject,
      html: brandedHtml,
      text: text || stripHtml(html),
      replyTo: replyTo || process.env.REPLY_TO_EMAIL,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email to ${params.to}:`, error);
    throw error;
  }
}

/**
 * Send a case response email to constituent
 */
export async function sendCaseResponseEmail(
  params: SendCaseResponseEmailParams
): Promise<void> {
  try {
    const { caseId, messageContent, senderName } = params;

    console.log(`Sending case response email for case ${caseId}`);

    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        constituent: true,
        city: true,
        department: true,
      },
    });

    const transporter = getTransporter();

    // Build email content
    const subject = `Re: ${caseRecord.subject}`;
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear ${caseRecord.constituent.name || "Valued Resident"},</p>

  <p>Thank you for contacting the ${caseRecord.city.name} ${caseRecord.department.name}.</p>

  <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <p><strong>Case Reference Number:</strong> ${caseRecord.referenceNumber}</p>
    <p><strong>Original Subject:</strong> ${caseRecord.subject}</p>
  </div>

  <p>Here is our response:</p>

  <div style="background-color: #ffffff; padding: 15px; border: 1px solid #ddd; margin: 20px 0;">
    ${messageContent}
  </div>

  <p>If you have any follow-up questions, please reply to this email with your case reference number.</p>

  <p>Sincerely,<br/>
  ${senderName || "The " + caseRecord.city.name + " " + caseRecord.department.name}</p>
</div>`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@city.gov",
      to: caseRecord.constituent.email,
      subject,
      html: wrapWithBrandedTemplate(html, {
        cityName: caseRecord.city.name,
        citySupportEmail: process.env.SUPPORT_EMAIL || "support@city.gov",
      }),
      text: stripHtml(html),
      replyTo: process.env.REPLY_TO_EMAIL,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Case response email sent to ${caseRecord.constituent.email}: ${info.messageId}`);

    // Record that we've sent the response
    await prisma.case.update({
      where: { id: caseId },
      data: {
        firstRespondedAt: caseRecord.firstRespondedAt || new Date(),
      },
    });
  } catch (error) {
    console.error(`Error sending case response email:`, error);
    throw error;
  }
}

/**
 * Send internal notification email to staff
 */
export async function sendNotificationEmail(
  params: SendNotificationEmailParams
): Promise<void> {
  try {
    const { to, subject, body, isInternalNote } = params;

    console.log(
      `Sending ${isInternalNote ? "internal" : "external"} notification email to ${to}`
    );

    const transporter = getTransporter();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>${body.replace(/\n/g, "<br/>")}</p>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
  <p style="font-size: 12px; color: #666;">
    This is an automated notification from the Constituent Response System.
  </p>
</div>`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@city.gov",
      to,
      subject,
      html,
      text: body,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Notification email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending notification email to ${params.to}:`, error);
    throw error;
  }
}

/**
 * Wrap HTML content with branded template
 */
function wrapWithBrandedTemplate(
  content: string,
  branding: { cityName: string; citySupportEmail: string }
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${branding.cityName}</h1>
  </div>

  <div class="content">
    ${content}
  </div>

  <div class="footer">
    <p>For questions or assistance, contact us at ${branding.citySupportEmail}</p>
    <p>&copy; ${new Date().getFullYear()} ${branding.cityName}. All rights reserved.</p>
  </div>
</body>
</html>`;
}

/**
 * Strip HTML tags from content for plain text email
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("Email configuration verified successfully");
    return true;
  } catch (error) {
    console.error("Email configuration test failed:", error);
    return false;
  }
}

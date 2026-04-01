import type { Constituent as PrismaConstituent, PrivacyStatus } from "@prisma/client";

// Constituent with all relations
export interface ConstituentDetail extends PrismaConstituent {
  caseCount?: number;
  signalCount?: number;
  lastCaseDate?: Date;
}

// Constituent list item
export interface ConstituentListItem {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  ward?: string;
  district?: string;
  languagePreference: string;
  privacyStatus: PrivacyStatus;
  createdAt: Date;
  caseCount?: number;
  lastInteraction?: Date;
}

// Create constituent input
export interface CreateConstituentInput {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  ward?: string;
  district?: string;
  languagePreference?: string;
  metadata?: Record<string, unknown>;
}

// Update constituent input
export interface UpdateConstituentInput {
  name?: string;
  phone?: string;
  address?: string;
  ward?: string;
  district?: string;
  languagePreference?: string;
  metadata?: Record<string, unknown>;
}

// Constituent search filters
export interface ConstituentSearchFilters {
  search?: string; // searches name, email, phone
  email?: string;
  ward?: string;
  district?: string;
  languagePreference?: string;
  privacyStatus?: PrivacyStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  hasActiveCases?: boolean;
  caseCountMin?: number;
  caseCountMax?: number;
}

// Constituent with cases
export interface ConstituentWithCaseHistory extends PrismaConstituent {
  caseCount: number;
  cases: Array<{
    id: string;
    referenceNumber: string;
    subject: string;
    status: string;
    createdAt: Date;
  }>;
}

// Privacy request
export interface PrivacyRequest {
  constituentId: string;
  type: "export" | "delete" | "anonymize";
  reason?: string;
  requestedAt: Date;
  completedAt?: Date;
  status: "pending" | "processing" | "completed" | "failed";
}

// Export data request
export interface ExportDataRequest {
  constituentId: string;
  includeMessages: boolean;
  includeMetadata: boolean;
  requestedAt: Date;
  expiresAt: Date;
  downloadUrl?: string;
}

// Constituent statistics
export interface ConstituentStats {
  totalConstituents: number;
  activeConstituents: number; // with recent activity
  constituentsByWard: Record<string, number>;
  constituentsByLanguage: Record<string, number>;
  constituentsByPrivacyStatus: Record<PrivacyStatus, number>;
  averageCasesPerConstituent: number;
  constituentDiversityScore?: number; // 0-1
}

// Constituent contact preferences
export interface ContactPreferences {
  constituentId: string;
  preferredLanguage: string;
  preferredContactMethod: "email" | "phone" | "sms" | "mail";
  allowEmails: boolean;
  allowPhoneContact: boolean;
  allowSMS: boolean;
  allowNewsletterSignals: boolean;
  marketingConsent: boolean;
  marketingConsentDate?: Date;
}

// Constituent profile
export interface ConstituentProfile extends PrismaConstituent {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  lastCaseDate?: Date;
  preferredLanguageName: string;
  contactPreferences?: ContactPreferences;
}

// Constituent bulk operations
export interface BulkUpdateConstituentsInput {
  constituentIds: string[];
  update: {
    languagePreference?: string;
    ward?: string;
    district?: string;
  };
}

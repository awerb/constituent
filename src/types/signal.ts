import type { NewsletterSignal, SignalType } from "@prisma/client";

// Newsletter signal with related data
export interface NewsletterSignalDetail extends NewsletterSignal {
  newsletterItemTitle?: string;
  newsletterItemSummary?: string;
  constituentEmail?: string;
  constituentName?: string;
  caseReferenceNumber?: string;
}

// Signal summary for newsletter item
export interface SignalSummary {
  newsletterItemId: string;
  flagCount: number;
  applaudCount: number;
  sentimentScore?: number; // -1 to 1
  commonThemes?: string[];
  urgencyLevel: "low" | "medium" | "high";
}

// Create signal input
export interface CreateSignalInput {
  newsletterItemId: string;
  signalType: SignalType;
  note?: string;
  noteLanguage?: string;
}

// Update signal input
export interface UpdateSignalInput {
  note?: string;
  noteLanguage?: string;
  caseId?: string; // associate with a case
}

// Signal with case conversion
export interface SignalWithCaseConversion extends NewsletterSignal {
  convertedToCase?: {
    id: string;
    referenceNumber: string;
    subject: string;
    status: string;
  };
}

// Signal analytics
export interface SignalAnalytics {
  totalSignals: number;
  flagCount: number;
  applaudCount: number;
  flagPercentage: number;
  applaudPercentage: number;
  averageNoteLength: number;
  constituentParticipationRate: number;
  conversionRate: number; // signals converted to cases
  topSignalThemes?: Array<{
    theme: string;
    count: number;
  }>;
}

// Newsletter item with signals
export interface NewsletterItemWithSignals {
  id: string;
  title: string;
  summary: string;
  topicTags: string[];
  publishedAt: Date;
  totalSignals: number;
  flags: NewsletterSignalDetail[];
  applauds: NewsletterSignalDetail[];
  signalSummary: SignalSummary;
}

// Signal aggregation for reporting
export interface SignalAggregation {
  period: "day" | "week" | "month";
  startDate: Date;
  endDate: Date;
  totalSignals: number;
  flags: number;
  applauds: number;
  uniqueConstituents: number;
  itemsWithSignals: number;
  conversionRate: number;
  sentimentTrend: Array<{
    date: Date;
    flagCount: number;
    applaudCount: number;
  }>;
}

// Signal search filters
export interface SignalSearchFilters {
  signalType?: SignalType;
  newsletterItemId?: string;
  constituentId?: string;
  hasNote?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  caseId?: string;
  search?: string; // searches notes and constituent names
}

// Bulk signal operations
export interface BulkCreateSignalsInput {
  signals: CreateSignalInput[];
}

export interface BulkConvertSignalsInput {
  signalIds: string[];
  templateId?: string;
}

// Signal notification
export interface SignalNotification {
  signalId: string;
  newsletterItemId: string;
  signalType: SignalType;
  constituentEmail: string;
  note?: string;
  noteLanguage?: string;
  createdAt: Date;
}

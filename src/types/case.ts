import type { Case, CaseMessage, NewsletterSignal, CaseStatus, CasePriority, CaseSource, AuthorType } from "@prisma/client";
import type { Constituent } from "./constituent";
import type { User } from "@/types/index";

// Case with all relations
export interface CaseDetail extends Case {
  constituent: Constituent;
  assignedTo: User | null;
  messages: CaseMessageDetail[];
  newsletterSignals: NewsletterSignal[];
}

// Case list item (minimal data)
export interface CaseListItem {
  id: string;
  referenceNumber: string;
  subject: string;
  status: CaseStatus;
  priority: CasePriority;
  constituentEmail: string;
  constituentName?: string;
  departmentId: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  slaDeadline?: Date;
  slaBreached: boolean;
  firstRespondedAt?: Date;
  resolvedAt?: Date;
}

// Case message with author info
export interface CaseMessageDetail extends CaseMessage {
  authorName?: string;
  authorEmail?: string;
  isFromConstituent: boolean;
}

// Case creation input
export interface CreateCaseInput {
  constituentId: string;
  subject: string;
  description: string;
  source: CaseSource;
  departmentId: string;
  priority?: CasePriority;
  assignedToId?: string;
  newsletterItemId?: string;
}

// Case update input
export interface UpdateCaseInput {
  subject?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  departmentId?: string;
  assignedToId?: string;
}

// Case status update
export interface UpdateCaseStatusInput {
  status: CaseStatus;
  closedAt?: Date;
  resolvedAt?: Date;
}

// Add message to case
export interface AddMessageInput {
  content: string;
  isInternalNote?: boolean;
  isPublicRecordsExcluded?: boolean;
  contentLanguage?: string;
  attachments?: Record<string, unknown>[];
}

// Case search filters
export interface CaseSearchFilters {
  status?: CaseStatus[];
  priority?: CasePriority[];
  source?: CaseSource[];
  departmentId?: string;
  assignedToId?: string;
  constituentId?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  slaBreached?: boolean;
  hasMessages?: boolean;
}

// Case metrics
export interface CaseMetrics {
  totalCases: number;
  casesByStatus: Record<CaseStatus, number>;
  casesByPriority: Record<CasePriority, number>;
  casesBySource: Record<CaseSource, number>;
  averageResolutionTime: number; // in hours
  medianResolutionTime: number; // in hours
  slaBreachCount: number;
  slaBreachRate: number; // percentage
  averageFirstResponseTime: number; // in hours
  casesWithoutAssignee: number;
}

// Case statistics for dashboard
export interface CaseStats {
  newCount: number;
  assignedCount: number;
  inProgressCount: number;
  awaitingResponseCount: number;
  resolvedCount: number;
  closedCount: number;
  urgentCount: number;
  slaBreachedCount: number;
}

// Bulk operations
export interface BulkUpdateCasesInput {
  caseIds: string[];
  update: {
    status?: CaseStatus;
    priority?: CasePriority;
    assignedToId?: string;
    departmentId?: string;
  };
}

// Case audit information
export interface CaseAuditInfo {
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string;
  deletedAt?: Date;
}

// Case history entry
export interface CaseHistoryEntry {
  id: string;
  caseId: string;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  userId?: string;
  createdAt: Date;
}

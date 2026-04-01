import type { User as PrismaUser, Case as PrismaCase, Constituent as PrismaConstituent, CaseMessage as PrismaCaseMessage, Department as PrismaDepartment, Role, CaseStatus, CasePriority, CaseSource } from "@prisma/client";

// Extended User type with role information
export interface User extends PrismaUser {
  role: Role;
}

// Extended Case type with related data
export interface CaseWithRelations extends PrismaCase {
  constituent: PrismaConstituent;
  department: PrismaDepartment;
  assignedTo?: User | null;
  messages: CaseMessage[];
}

// Extended Constituent type
export interface ConstituentWithCases extends PrismaConstituent {
  cases: PrismaCase[];
}

// Extended CaseMessage type
export interface CaseMessage extends PrismaCaseMessage {
  authorName?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalCases: number;
  newCases: number;
  activeCases: number;
  resolvedCases: number;
  closedCases: number;
  avgResolutionTime: number;
  slaBreachRate: number;
  casesByPriority: Record<CasePriority, number>;
  casesByStatus: Record<CaseStatus, number>;
  casesBySource: Record<CaseSource, number>;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter options
export interface CaseFilterOptions {
  status?: CaseStatus[];
  priority?: CasePriority[];
  source?: CaseSource[];
  departmentId?: string;
  assignedToId?: string;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  slaBreach?: boolean;
}

// Sort options
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

// API Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: Date;
    requestId?: string;
  };
}

// Error details
export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Export all Prisma types
export type {
  User as PrismaUserType,
  Case as PrismaCaseType,
  Constituent as PrismaConstituentType,
  CaseMessage as PrismaCaseMessageType,
  Department,
  Role,
  CaseStatus,
  CasePriority,
  CaseSource,
  CaseMessage as CaseMessageType,
  NewsletterSignal,
  NewsletterItem,
  Template,
  SlaConfig,
  KbArticle,
  Webhook,
  AuditLog,
  PrivacyStatus,
  SignalType,
  TemplateStatus,
  AuthorType,
} from "@prisma/client";

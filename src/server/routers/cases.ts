import { z } from "zod";
import { router, protectedProcedure, managerProcedure } from "@/server/trpc";
import { CaseStatus, CasePriority, AuthorType, CaseSource } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

const caseFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.nativeEnum(CaseStatus).optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  departmentId: z.string().optional(),
  assignedToId: z.string().optional(),
  source: z.nativeEnum(CaseSource).optional(),
  search: z.string().optional(),
});

const createCaseSchema = z.object({
  constituentEmail: z.string().email(),
  constituentName: z.string().optional(),
  subject: z.string().min(1),
  description: z.string().min(1),
  source: z.nativeEnum(CaseSource),
  departmentId: z.string(),
  priority: z.nativeEnum(CasePriority).optional().default(CasePriority.NORMAL),
});

const updateCaseSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(CaseStatus).optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  departmentId: z.string().optional(),
  assignedToId: z.string().optional(),
});

const addMessageSchema = z.object({
  caseId: z.string(),
  content: z.string().min(1),
  isInternalNote: z.boolean().optional().default(false),
  contentLanguage: z.string().optional(),
});

const mergeSchema = z.object({
  targetCaseId: z.string(),
  sourceCaseId: z.string(),
});

const batchRespondSchema = z.object({
  caseIds: z.string().array().min(1),
  content: z.string().min(1),
  isFromTemplate: z.boolean().optional().default(false),
});

export const casesRouter = router({
  list: protectedProcedure.input(caseFilterSchema).query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.limit;

    const where: any = {
      cityId: ctx.cityId,
    };

    if (input.status) where.status = input.status;
    if (input.priority) where.priority = input.priority;
    if (input.departmentId) where.departmentId = input.departmentId;
    if (input.assignedToId) where.assignedToId = input.assignedToId;
    if (input.source) where.source = input.source;

    if (input.search) {
      where.OR = [
        { referenceNumber: { contains: input.search, mode: "insensitive" } },
        { subject: { contains: input.search, mode: "insensitive" } },
        { constituent: { email: { contains: input.search, mode: "insensitive" } } },
      ];
    }

    const [cases, total] = await Promise.all([
      ctx.prisma.case.findMany({
        where,
        include: {
          constituent: true,
          department: true,
          assignedTo: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: input.limit,
      }),
      ctx.prisma.case.count({ where }),
    ]);

    return {
      cases,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const caseRecord = await ctx.prisma.case.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
        include: {
          constituent: true,
          department: true,
          assignedTo: true,
          messages: {
            include: {
              case: true,
            },
            orderBy: { createdAt: "asc" },
          },
          newsletterItem: true,
          newsletterSignals: true,
        },
      });

      if (!caseRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      return caseRecord;
    }),

  create: protectedProcedure
    .input(createCaseSchema)
    .mutation(async ({ ctx, input }) => {
      const constituent = await ctx.prisma.constituent.upsert({
        where: {
          cityId_email: {
            cityId: ctx.cityId,
            email: input.constituentEmail,
          },
        },
        update: {
          name: input.constituentName || undefined,
        },
        create: {
          email: input.constituentEmail,
          name: input.constituentName || input.constituentEmail,
          cityId: ctx.cityId,
        },
      });

      const referenceNumber = `${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;

      const department = await ctx.prisma.department.findFirst({
        where: {
          id: input.departmentId,
          cityId: ctx.cityId,
        },
      });

      if (!department) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      const slaConfig = await ctx.prisma.slaConfig.findFirst({
        where: {
          cityId: ctx.cityId,
          departmentId: input.departmentId,
          priority: input.priority || CasePriority.NORMAL,
        },
      });

      const responseHours = slaConfig?.responseHours || department.defaultSlaHours;
      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + responseHours);

      const caseRecord = await ctx.prisma.case.create({
        data: {
          cityId: ctx.cityId,
          referenceNumber,
          constituentId: constituent.id,
          subject: input.subject,
          description: input.description,
          source: input.source,
          departmentId: input.departmentId,
          priority: input.priority || CasePriority.NORMAL,
          slaDeadline,
        },
        include: {
          constituent: true,
          department: true,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "CREATE",
          resourceType: "CASE",
          resourceId: caseRecord.id,
          details: {
            referenceNumber: caseRecord.referenceNumber,
            constituent: constituent.email,
          },
        },
      });

      return caseRecord;
    }),

  update: protectedProcedure
    .input(updateCaseSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.case.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      const updateData: any = {};

      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === CaseStatus.RESOLVED) {
          updateData.resolvedAt = new Date();
        }
      }

      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }

      if (input.departmentId !== undefined) {
        updateData.departmentId = input.departmentId;
      }

      if (input.assignedToId !== undefined) {
        updateData.assignedToId = input.assignedToId;
        if (existing.status === CaseStatus.NEW) {
          updateData.status = CaseStatus.ASSIGNED;
        }
      }

      const updated = await ctx.prisma.case.update({
        where: { id: input.id },
        data: updateData,
        include: {
          constituent: true,
          department: true,
          assignedTo: true,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "UPDATE",
          resourceType: "CASE",
          resourceId: input.id,
          details: {
            changes: input,
          },
        },
      });

      return updated;
    }),

  addMessage: protectedProcedure
    .input(addMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const caseRecord = await ctx.prisma.case.findFirst({
        where: {
          id: input.caseId,
          cityId: ctx.cityId,
        },
      });

      if (!caseRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      const message = await ctx.prisma.caseMessage.create({
        data: {
          caseId: input.caseId,
          authorType: AuthorType.STAFF,
          authorId: ctx.user.id,
          content: input.content,
          isInternalNote: input.isInternalNote,
          contentLanguage: input.contentLanguage,
        },
      });

      let statusUpdate = {};

      if (!input.isInternalNote && caseRecord.status === CaseStatus.AWAITING_RESPONSE) {
        statusUpdate = { status: CaseStatus.IN_PROGRESS };
      }

      if (!input.isInternalNote && !caseRecord.firstRespondedAt) {
        statusUpdate = { ...statusUpdate, firstRespondedAt: new Date() };
      }

      if (Object.keys(statusUpdate).length > 0) {
        await ctx.prisma.case.update({
          where: { id: input.caseId },
          data: statusUpdate,
        });
      }

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "ADD_MESSAGE",
          resourceType: "CASE",
          resourceId: input.caseId,
          details: {
            messageId: message.id,
            isInternal: input.isInternalNote,
          },
        },
      });

      return message;
    }),

  merge: managerProcedure
    .input(mergeSchema)
    .mutation(async ({ ctx, input }) => {
      const [targetCase, sourceCase] = await Promise.all([
        ctx.prisma.case.findFirst({
          where: { id: input.targetCaseId, cityId: ctx.cityId },
        }),
        ctx.prisma.case.findFirst({
          where: { id: input.sourceCaseId, cityId: ctx.cityId },
        }),
      ]);

      if (!targetCase || !sourceCase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both cases not found",
        });
      }

      await ctx.prisma.caseMessage.updateMany({
        where: { caseId: input.sourceCaseId },
        data: { caseId: input.targetCaseId },
      });

      const closedCase = await ctx.prisma.case.update({
        where: { id: input.sourceCaseId },
        data: {
          status: CaseStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      await ctx.prisma.caseMessage.create({
        data: {
          caseId: input.targetCaseId,
          authorType: AuthorType.SYSTEM,
          authorId: ctx.user.id,
          content: `Case merged with ${input.targetCaseId}`,
          isInternalNote: true,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "MERGE",
          resourceType: "CASE",
          resourceId: input.targetCaseId,
          details: {
            sourceCaseId: input.sourceCaseId,
          },
        },
      });

      return closedCase;
    }),

  batchRespond: protectedProcedure
    .input(batchRespondSchema)
    .mutation(async ({ ctx, input }) => {
      const cases = await ctx.prisma.case.findMany({
        where: {
          id: { in: input.caseIds },
          cityId: ctx.cityId,
        },
      });

      if (cases.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No cases found",
        });
      }

      const messages = await Promise.all(
        cases.map((caseRecord) =>
          ctx.prisma.caseMessage.create({
            data: {
              caseId: caseRecord.id,
              authorType: AuthorType.STAFF,
              authorId: ctx.user.id,
              content: input.content,
              isInternalNote: false,
            },
          })
        )
      );

      await Promise.all(
        cases.map((caseRecord) =>
          ctx.prisma.case.update({
            where: { id: caseRecord.id },
            data: {
              status: CaseStatus.IN_PROGRESS,
              firstRespondedAt: caseRecord.firstRespondedAt || new Date(),
            },
          })
        )
      );

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "BATCH_RESPOND",
          resourceType: "CASE",
          resourceId: "BATCH",
          details: {
            caseCount: cases.length,
            caseIds: input.caseIds,
          },
        },
      });

      return { messageCount: messages.length, messages };
    }),

  getViewers: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const viewers = await ctx.redis.smembers(`case:${input.caseId}:viewers`);
      return { viewers };
    }),

  setViewing: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `case:${input.caseId}:viewers`;
      await ctx.redis.sadd(key, ctx.user.id);
      await ctx.redis.expire(key, 300);
      return { success: true };
    }),
});

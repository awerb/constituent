import { z } from "zod";
import { router, adminProcedure } from "@/server/trpc";
import { CasePriority } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

const departmentCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  topicTags: z.string().array(),
  defaultSlaHours: z.number().int().positive().optional().default(48),
});

const departmentUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  topicTags: z.string().array().optional(),
  defaultSlaHours: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "AGENT", "ELECTED_OFFICIAL"]),
  departmentId: z.string().optional(),
  ward: z.string().optional(),
});

const userUpdateSchema = z.object({
  id: z.string(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "AGENT", "ELECTED_OFFICIAL"]).optional(),
  departmentId: z.string().optional(),
  ward: z.string().optional(),
  isActive: z.boolean().optional(),
});

const slaConfigSchema = z.object({
  id: z.string().optional(),
  departmentId: z.string(),
  priority: z.nativeEnum(CasePriority),
  responseHours: z.number().int().positive(),
  resolutionHours: z.number().int().positive(),
  escalationChain: z.record(z.string()),
  businessHoursStart: z.string().optional().default("08:00"),
  businessHoursEnd: z.string().optional().default("17:00"),
  businessDays: z.string().array().optional().default(["MON", "TUE", "WED", "THU", "FRI"]),
});

const webhookCreateSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.string().array().min(1),
});

const webhookUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.string().array().optional(),
  isActive: z.boolean().optional(),
});

const webhookDeleteSchema = z.object({
  id: z.string(),
});

const auditLogSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
  action: z.string().optional(),
  userId: z.string().optional(),
});

const processPrivacySchema = z.object({
  constituentId: z.string(),
  action: z.enum(["export", "delete"]),
});

export const adminRouter = router({
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const city = await ctx.prisma.city.findUnique({
      where: { id: ctx.cityId },
    });

    if (!city) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "City not found",
      });
    }

    return {
      name: city.name,
      slug: city.slug,
      state: city.state,
      timezone: city.timezone,
      settings: city.settings,
      isActive: city.isActive,
    };
  }),

  updateSettings: adminProcedure
    .input(
      z.object({
        settings: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.city.update({
        where: { id: ctx.cityId },
        data: {
          settings: input.settings,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "UPDATE_SETTINGS",
          resourceType: "CITY",
          resourceId: ctx.cityId,
          details: { changes: input.settings },
        },
      });

      return updated;
    }),

  listDepartments: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.department.findMany({
      where: { cityId: ctx.cityId },
      orderBy: { name: "asc" },
    });
  }),

  createDepartment: adminProcedure
    .input(departmentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.department.findFirst({
        where: {
          cityId: ctx.cityId,
          slug: input.slug,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Department with this slug already exists",
        });
      }

      const department = await ctx.prisma.department.create({
        data: {
          cityId: ctx.cityId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          topicTags: input.topicTags,
          defaultSlaHours: input.defaultSlaHours,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "CREATE",
          resourceType: "DEPARTMENT",
          resourceId: department.id,
          details: { name: department.name },
        },
      });

      return department;
    }),

  updateDepartment: adminProcedure
    .input(departmentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.department.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.topicTags !== undefined) updateData.topicTags = input.topicTags;
      if (input.defaultSlaHours !== undefined) updateData.defaultSlaHours = input.defaultSlaHours;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const updated = await ctx.prisma.department.update({
        where: { id: input.id },
        data: updateData,
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "UPDATE",
          resourceType: "DEPARTMENT",
          resourceId: input.id,
          details: { changes: input },
        },
      });

      return updated;
    }),

  listUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { cityId: ctx.cityId },
      include: { department: true },
      orderBy: { name: "asc" },
    });
  }),

  createUser: adminProcedure
    .input(userCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: {
          cityId: ctx.cityId,
          email: input.email,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const user = await ctx.prisma.user.create({
        data: {
          cityId: ctx.cityId,
          email: input.email,
          name: input.name,
          role: input.role,
          departmentId: input.departmentId,
          ward: input.ward,
        },
        include: { department: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "CREATE",
          resourceType: "USER",
          resourceId: user.id,
          details: { email: user.email, role: user.role },
        },
      });

      return user;
    }),

  updateUser: adminProcedure
    .input(userUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updateData: any = {};
      if (input.role !== undefined) updateData.role = input.role;
      if (input.departmentId !== undefined) updateData.departmentId = input.departmentId;
      if (input.ward !== undefined) updateData.ward = input.ward;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const updated = await ctx.prisma.user.update({
        where: { id: input.id },
        data: updateData,
        include: { department: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "UPDATE",
          resourceType: "USER",
          resourceId: input.id,
          details: { changes: input },
        },
      });

      return updated;
    }),

  getSlaConfigs: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.slaConfig.findMany({
      where: { cityId: ctx.cityId },
      include: { department: true },
    });
  }),

  upsertSlaConfig: adminProcedure
    .input(slaConfigSchema)
    .mutation(async ({ ctx, input }) => {
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

      const config = await ctx.prisma.slaConfig.upsert({
        where: {
          cityId_departmentId_priority: {
            cityId: ctx.cityId,
            departmentId: input.departmentId,
            priority: input.priority,
          },
        },
        create: {
          cityId: ctx.cityId,
          departmentId: input.departmentId,
          priority: input.priority,
          responseHours: input.responseHours,
          resolutionHours: input.resolutionHours,
          escalationChain: input.escalationChain,
          businessHoursStart: input.businessHoursStart,
          businessHoursEnd: input.businessHoursEnd,
          businessDays: input.businessDays,
        },
        update: {
          responseHours: input.responseHours,
          resolutionHours: input.resolutionHours,
          escalationChain: input.escalationChain,
          businessHoursStart: input.businessHoursStart,
          businessHoursEnd: input.businessHoursEnd,
          businessDays: input.businessDays,
        },
        include: { department: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "UPSERT",
          resourceType: "SLA_CONFIG",
          resourceId: config.id,
          details: { departmentId: input.departmentId, priority: input.priority },
        },
      });

      return config;
    }),

  listWebhooks: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.webhook.findMany({
      where: { cityId: ctx.cityId },
      orderBy: { createdAt: "desc" },
    });
  }),

  createWebhook: adminProcedure
    .input(webhookCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const secret = nanoid(32);

      const webhook = await ctx.prisma.webhook.create({
        data: {
          cityId: ctx.cityId,
          name: input.name,
          url: input.url,
          events: input.events,
          secret,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "CREATE",
          resourceType: "WEBHOOK",
          resourceId: webhook.id,
          details: { name: webhook.name, url: webhook.url },
        },
      });

      return webhook;
    }),

  updateWebhook: adminProcedure
    .input(webhookUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.webhook.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook not found",
        });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.url !== undefined) updateData.url = input.url;
      if (input.events !== undefined) updateData.events = input.events;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const updated = await ctx.prisma.webhook.update({
        where: { id: input.id },
        data: updateData,
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "UPDATE",
          resourceType: "WEBHOOK",
          resourceId: input.id,
          details: { changes: input },
        },
      });

      return updated;
    }),

  deleteWebhook: adminProcedure
    .input(webhookDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.webhook.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Webhook not found",
        });
      }

      const deleted = await ctx.prisma.webhook.delete({
        where: { id: input.id },
      });

      await ctx.prisma.auditLog.create({
        data: {
          cityId: ctx.cityId,
          userId: ctx.user.id,
          action: "DELETE",
          resourceType: "WEBHOOK",
          resourceId: input.id,
          details: { name: existing.name },
        },
      });

      return deleted;
    }),

  getAuditLog: adminProcedure.input(auditLogSchema).query(async ({ ctx, input }) => {
    const skip = (input.page - 1) * input.limit;

    const where: any = {
      cityId: ctx.cityId,
    };

    if (input.action) where.action = input.action;
    if (input.userId) where.userId = input.userId;

    const [logs, total] = await Promise.all([
      ctx.prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: input.limit,
      }),
      ctx.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    };
  }),

  getPrivacyQueue: adminProcedure.query(async ({ ctx }) => {
    const constituents = await ctx.prisma.constituent.findMany({
      where: {
        cityId: ctx.cityId,
        privacyStatus: { in: ["EXPORT_REQUESTED", "DELETION_REQUESTED"] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        privacyStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return constituents;
  }),

  processPrivacyRequest: adminProcedure
    .input(processPrivacySchema)
    .mutation(async ({ ctx, input }) => {
      const constituent = await ctx.prisma.constituent.findFirst({
        where: {
          id: input.constituentId,
          cityId: ctx.cityId,
        },
      });

      if (!constituent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Constituent not found",
        });
      }

      if (input.action === "delete") {
        const updated = await ctx.prisma.constituent.update({
          where: { id: input.constituentId },
          data: {
            privacyStatus: "ANONYMIZED",
            name: "Anonymized",
            email: `anonymized-${nanoid()}@anonymized.local`,
            phone: null,
            address: null,
            ward: null,
            district: null,
          },
        });

        await ctx.prisma.auditLog.create({
          data: {
            cityId: ctx.cityId,
            userId: ctx.user.id,
            action: "DELETE_CONSTITUENT_DATA",
            resourceType: "CONSTITUENT",
            resourceId: input.constituentId,
            details: { action: "anonymized" },
          },
        });

        return updated;
      } else {
        const updated = await ctx.prisma.constituent.update({
          where: { id: input.constituentId },
          data: { privacyStatus: "ACTIVE" },
        });

        await ctx.prisma.auditLog.create({
          data: {
            cityId: ctx.cityId,
            userId: ctx.user.id,
            action: "EXPORT_CONSTITUENT_DATA",
            resourceType: "CONSTITUENT",
            resourceId: input.constituentId,
            details: { action: "export_completed" },
          },
        });

        return updated;
      }
    }),
});

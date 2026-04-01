import { z } from "zod";
import { router, protectedProcedure, adminProcedure, managerProcedure } from "@/server/trpc";
import { TemplateStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const listSchema = z.object({
  departmentId: z.string().optional(),
  category: z.string().optional(),
  status: z.nativeEnum(TemplateStatus).optional(),
});

const getByIdSchema = z.object({
  id: z.string(),
});

const createSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  departmentId: z.string().optional(),
  content: z.string().min(1),
  variables: z.record(z.string()),
});

const updateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  variables: z.record(z.string()).optional(),
  status: z.nativeEnum(TemplateStatus).optional(),
});

const approveSchema = z.object({
  id: z.string(),
});

const archiveSchema = z.object({
  id: z.string(),
});

const renderSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.string()),
});

export const templatesRouter = router({
  list: protectedProcedure.input(listSchema).query(async ({ ctx, input }) => {
    const where: any = {
      cityId: ctx.cityId,
    };

    if (input.departmentId) where.departmentId = input.departmentId;
    if (input.category) where.category = input.category;
    if (input.status) where.status = input.status;

    const templates = await ctx.prisma.template.findMany({
      where,
      include: {
        createdBy: true,
        approvedBy: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return templates;
  }),

  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const template = await ctx.prisma.template.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
      include: {
        createdBy: true,
        approvedBy: true,
        department: true,
      },
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    return template;
  }),

  create: adminProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
    if (input.departmentId) {
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
    }

    const template = await ctx.prisma.template.create({
      data: {
        cityId: ctx.cityId,
        title: input.title,
        category: input.category,
        departmentId: input.departmentId,
        content: input.content,
        variables: input.variables,
        createdById: ctx.user.id,
        status: TemplateStatus.DRAFT,
      },
      include: {
        createdBy: true,
        department: true,
      },
    });

    await ctx.prisma.auditLog.create({
      data: {
        cityId: ctx.cityId,
        userId: ctx.user.id,
        action: "CREATE",
        resourceType: "TEMPLATE",
        resourceId: template.id,
        details: { title: template.title },
      },
    });

    return template;
  }),

  update: adminProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.template.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.variables !== undefined) updateData.variables = input.variables;
    if (input.status !== undefined) updateData.status = input.status;

    updateData.version = { increment: 1 };

    const updated = await ctx.prisma.template.update({
      where: { id: input.id },
      data: updateData,
      include: {
        createdBy: true,
        approvedBy: true,
        department: true,
      },
    });

    await ctx.prisma.auditLog.create({
      data: {
        cityId: ctx.cityId,
        userId: ctx.user.id,
        action: "UPDATE",
        resourceType: "TEMPLATE",
        resourceId: input.id,
        details: { changes: input },
      },
    });

    return updated;
  }),

  approve: managerProcedure.input(approveSchema).mutation(async ({ ctx, input }) => {
    const template = await ctx.prisma.template.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    const updated = await ctx.prisma.template.update({
      where: { id: input.id },
      data: {
        status: TemplateStatus.APPROVED,
        approvedById: ctx.user.id,
      },
      include: {
        createdBy: true,
        approvedBy: true,
        department: true,
      },
    });

    await ctx.prisma.auditLog.create({
      data: {
        cityId: ctx.cityId,
        userId: ctx.user.id,
        action: "APPROVE",
        resourceType: "TEMPLATE",
        resourceId: input.id,
        details: { title: template.title },
      },
    });

    return updated;
  }),

  archive: adminProcedure.input(archiveSchema).mutation(async ({ ctx, input }) => {
    const template = await ctx.prisma.template.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    const updated = await ctx.prisma.template.update({
      where: { id: input.id },
      data: { status: TemplateStatus.ARCHIVED },
      include: {
        createdBy: true,
        approvedBy: true,
        department: true,
      },
    });

    await ctx.prisma.auditLog.create({
      data: {
        cityId: ctx.cityId,
        userId: ctx.user.id,
        action: "ARCHIVE",
        resourceType: "TEMPLATE",
        resourceId: input.id,
        details: { title: template.title },
      },
    });

    return updated;
  }),

  render: protectedProcedure.input(renderSchema).query(async ({ ctx, input }) => {
    const template = await ctx.prisma.template.findFirst({
      where: {
        id: input.templateId,
        cityId: ctx.cityId,
      },
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    let rendered = template.content;

    Object.entries(input.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, String(value));
    });

    return { rendered, variables: input.variables };
  }),
});

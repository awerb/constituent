import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const listSchema = z.object({
  category: z.string().optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
});

const getByIdSchema = z.object({
  id: z.string(),
});

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  departmentId: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

const incrementUseCountSchema = z.object({
  id: z.string(),
});

export const kbRouter = router({
  list: protectedProcedure.input(listSchema).query(async ({ ctx, input }) => {
    const where: any = {
      cityId: ctx.cityId,
    };

    if (input.category) where.category = input.category;
    if (input.departmentId) where.departmentId = input.departmentId;

    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: "insensitive" } },
        { content: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const articles = await ctx.prisma.kbArticle.findMany({
      where,
      include: {
        createdBy: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return articles;
  }),

  getById: protectedProcedure.input(getByIdSchema).query(async ({ ctx, input }) => {
    const article = await ctx.prisma.kbArticle.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
      include: {
        createdBy: true,
        department: true,
      },
    });

    if (!article) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }

    return article;
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

    const article = await ctx.prisma.kbArticle.create({
      data: {
        cityId: ctx.cityId,
        title: input.title,
        content: input.content,
        category: input.category,
        departmentId: input.departmentId,
        createdById: ctx.user.id,
        isPublished: true,
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
        resourceType: "KB_ARTICLE",
        resourceId: article.id,
        details: { title: article.title },
      },
    });

    return article;
  }),

  update: adminProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.kbArticle.findFirst({
      where: {
        id: input.id,
        cityId: ctx.cityId,
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Article not found",
      });
    }

    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;

    const updated = await ctx.prisma.kbArticle.update({
      where: { id: input.id },
      data: updateData,
      include: {
        createdBy: true,
        department: true,
      },
    });

    await ctx.prisma.auditLog.create({
      data: {
        cityId: ctx.cityId,
        userId: ctx.user.id,
        action: "UPDATE",
        resourceType: "KB_ARTICLE",
        resourceId: input.id,
        details: { changes: input },
      },
    });

    return updated;
  }),

  incrementUseCount: protectedProcedure
    .input(incrementUseCountSchema)
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.prisma.kbArticle.findFirst({
        where: {
          id: input.id,
          cityId: ctx.cityId,
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      const updated = await ctx.prisma.kbArticle.update({
        where: { id: input.id },
        data: { useCount: { increment: 1 } },
        include: {
          createdBy: true,
          department: true,
        },
      });

      return updated;
    }),
});

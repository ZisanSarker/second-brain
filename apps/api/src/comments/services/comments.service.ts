import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionService } from '../../collab/permission.service';
import { MentionService } from './mention.service';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private permission: PermissionService,
    private mentionService: MentionService,
    private audit: AuditService,
  ) {}

  async create(data: {
    workspaceId: string;
    documentId?: string;
    collectionId?: string;
    generatedContentId?: string;
    userId: string;
    content: string;
    parentId?: string;
  }) {
    const entityType = data.documentId
      ? 'DOCUMENT'
      : data.collectionId
        ? 'COLLECTION'
        : 'GENERATED_CONTENT';
    const entityId = data.documentId || data.collectionId || data.generatedContentId || '';

    await this.permission.requireComment(data.workspaceId, entityType, entityId, data.userId);

    const comment = await this.prisma.comment.create({ data });

    await this.mentionService.parseAndCreate(
      data.workspaceId,
      'COMMENT',
      comment.id,
      data.content,
      data.userId,
    );

    await this.audit.log({
      workspaceId: data.workspaceId,
      userId: data.userId,
      action: 'COMMENT_ADDED',
      details: { commentId: comment.id, entityType, entityId },
    });

    return this.prisma.comment.findUnique({
      where: { id: comment.id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async list(entityType: string, entityId: string) {
    const where: any = { deletedAt: null };
    if (entityType === 'DOCUMENT') where.documentId = entityId;
    else if (entityType === 'COLLECTION') where.collectionId = entityId;
    else if (entityType === 'GENERATED_CONTENT') where.generatedContentId = entityId;

    const comments = await this.prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.filter((c) => !c.parentId);
  }

  async update(id: string, content: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId) throw new Error('Not authorized');
    if (comment.deletedAt) throw new Error('Comment deleted');

    return this.prisma.comment.update({ where: { id }, data: { content, editedAt: new Date() } });
  }

  async softDelete(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId) throw new Error('Not authorized');

    return this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date(), content: '[deleted]' },
    });
  }

  async resolve(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Only the comment author can resolve');

    return this.prisma.comment.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedBy: userId },
    });
  }

  async addReaction(commentId: string, userId: string, type: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.deletedAt) throw new Error('Comment not found');

    return this.prisma.reaction.create({
      data: { userId, entityType: 'COMMENT', entityId: commentId, type: type as any },
    });
  }

  async removeReaction(commentId: string, userId: string, type: string) {
    const existing = await this.prisma.reaction.findUnique({
      where: {
        entityType_entityId_userId_type: {
          entityType: 'COMMENT',
          entityId: commentId,
          userId,
          type: type as any,
        },
      },
    });
    if (existing) await this.prisma.reaction.delete({ where: { id: existing.id } });
  }
}

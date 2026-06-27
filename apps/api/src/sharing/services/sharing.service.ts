import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionService } from '../../collab/permission.service';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class SharingService {
  constructor(
    private prisma: PrismaService,
    private permission: PermissionService,
    private audit: AuditService,
  ) {}

  async createPermission(data: {
    workspaceId: string;
    entityType: string;
    entityId: string;
    userId: string;
    role: string;
    createdBy: string;
  }) {
    await this.permission.requireEdit(
      data.workspaceId,
      data.entityType,
      data.entityId,
      data.createdBy,
    );

    const perm = await this.prisma.resourcePermission.upsert({
      where: {
        entityType_entityId_userId: {
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
        },
      },
      create: data,
      update: { role: data.role },
    });

    await this.audit.log({
      workspaceId: data.workspaceId,
      userId: data.createdBy,
      action: 'SHARING_CHANGED',
      details: {
        entityType: data.entityType,
        entityId: data.entityId,
        targetUserId: data.userId,
        role: data.role,
      },
    });

    return perm;
  }

  async listPermissions(entityType: string, entityId: string, requestingUserId: string) {
    return this.prisma.resourcePermission.findMany({
      where: { entityType, entityId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
    });
  }

  async updatePermission(id: string, role: string, userId: string) {
    const perm = await this.prisma.resourcePermission.findUnique({ where: { id } });
    if (!perm) throw new Error('Permission not found');

    return this.prisma.resourcePermission.update({ where: { id }, data: { role } });
  }

  async deletePermission(id: string, userId: string) {
    const perm = await this.prisma.resourcePermission.findUnique({ where: { id } });
    if (!perm) throw new Error('Permission not found');

    await this.prisma.resourcePermission.delete({ where: { id } });
  }

  async createLink(data: {
    workspaceId: string;
    documentId?: string;
    collectionId?: string;
    generatedContentId?: string;
    createdBy: string;
    permission?: string;
    expiresAt?: Date;
  }) {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    return this.prisma.sharedLink.create({
      data: { ...data, token, permission: data.permission ?? 'VIEWER' },
    });
  }

  async getLinkByToken(token: string) {
    const link = await this.prisma.sharedLink.findUnique({ where: { token } });
    if (!link) throw new Error('Link not found');
    if (link.expiresAt && link.expiresAt < new Date()) throw new Error('Link expired');

    await this.prisma.sharedLink.update({
      where: { id: link.id },
      data: { lastAccessedAt: new Date() },
    });
    return link;
  }

  async listLinks(entityType: string, entityId: string) {
    const where: any = {};
    if (entityType === 'DOCUMENT') where.documentId = entityId;
    else if (entityType === 'COLLECTION') where.collectionId = entityId;
    else if (entityType === 'GENERATED_CONTENT') where.generatedContentId = entityId;

    return this.prisma.sharedLink.findMany({ where });
  }

  async deleteLink(id: string) {
    await this.prisma.sharedLink.delete({ where: { id } });
  }
}

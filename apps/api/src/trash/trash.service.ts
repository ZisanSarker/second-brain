import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { StorageService } from '../shared/services/storage.service';

@Injectable()
export class TrashService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async findAll(workspaceId: string, userId: string, page = 1, limit = 50) {
    await this.requireMember(workspaceId, userId);
    const skip = (page - 1) * limit;

    const [documents, collections, docTotal] = await Promise.all([
      this.prisma.document.findMany({
        where: { workspaceId, deletedAt: { not: null } },
        skip,
        take: limit,
        include: {
          collection: { select: { id: true, name: true } },
          tags: { select: { id: true, name: true, color: true } },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.collection.findMany({
        where: { workspaceId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.document.count({
        where: { workspaceId, deletedAt: { not: null } },
      }),
      this.prisma.collection.count({
        where: { workspaceId, deletedAt: { not: null } },
      }),
    ]);

    return {
      documents,
      collections,
      meta: {
        total: docTotal,
        page,
        limit,
        totalPages: Math.ceil(docTotal / limit),
      },
    };
  }

  async restoreDocument(workspaceId: string, documentId: string, userId: string) {
    await this.requireMember(workspaceId, userId);

    return this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: null },
    });
  }

  async permanentDeleteDocument(workspaceId: string, documentId: string, userId: string) {
    await this.requireMember(workspaceId, userId);

    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
    });
    for (const v of versions) {
      try {
        await this.storage.deleteObject(v.storageKey);
      } catch {
        // Ignore storage errors
      }
    }

    return this.prisma.document.delete({ where: { id: documentId } });
  }

  async emptyTrash(workspaceId: string, userId: string) {
    await this.requireEditor(workspaceId, userId);

    const documents = await this.prisma.document.findMany({
      where: { workspaceId, deletedAt: { not: null } },
      include: { versions: true },
    });

    for (const doc of documents) {
      for (const v of doc.versions) {
        try {
          await this.storage.deleteObject(v.storageKey);
        } catch {
          // Ignore storage errors
        }
      }
    }

    const [deletedDocs, deletedCollections] = await Promise.all([
      this.prisma.document.deleteMany({
        where: { workspaceId, deletedAt: { not: null } },
      }),
      this.prisma.collection.deleteMany({
        where: { workspaceId, deletedAt: { not: null } },
      }),
    ]);

    return {
      deletedDocuments: deletedDocs.count,
      deletedCollections: deletedCollections.count,
    };
  }

  async cleanupExpired() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const documents = await this.prisma.document.findMany({
      where: { deletedAt: { lte: thirtyDaysAgo } },
      include: { versions: true },
    });

    for (const doc of documents) {
      for (const v of doc.versions) {
        try {
          await this.storage.deleteObject(v.storageKey);
        } catch {
          // Ignore
        }
      }
    }

    const [deletedDocs] = await Promise.all([
      this.prisma.document.deleteMany({
        where: { deletedAt: { lte: thirtyDaysAgo } },
      }),
      this.prisma.collection.deleteMany({
        where: { deletedAt: { lte: thirtyDaysAgo } },
      }),
    ]);

    return deletedDocs.count;
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }

  private async requireEditor(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    const hierarchy: Record<string, number> = {
      VIEWER: 20,
      MEMBER: 40,
      EDITOR: 60,
      ADMIN: 80,
      OWNER: 100,
    };
    if ((hierarchy[member.role] ?? 0) < 60) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { StorageService } from '../shared/services/storage.service';
import { QueueService } from '../jobs/queue.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
  AssignTagsDto,
  CreateVersionDto,
} from './dto/document.dto';
import { Prisma } from '@prisma/client';

const DOCUMENT_INCLUDE = {
  collection: { select: { id: true, name: true } },
  folder: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true } },
  tags: { select: { id: true, name: true, color: true } },
  _count: { select: { versions: true, comments: true } },
} satisfies Prisma.DocumentInclude;

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private queue: QueueService,
  ) {}

  async create(userId: string, workspaceId: string, dto: CreateDocumentDto) {
    const versionNumber = 1;

    const document = await this.prisma.document.create({
      data: {
        workspaceId,
        ownerId: userId,
        title: dto.title,
        originalName: dto.originalName,
        fileType: dto.fileType,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        uploadStatus: 'UPLOADED',
        versionNumber,
        sourceType: 'FILE' as any,
        status: 'READY' as any,
        collectionId: dto.collectionId,
        folderId: dto.folderId,
        description: dto.description,
        language: dto.language,
        author: dto.author,
        versions: {
          create: {
            versionNumber,
            storageKey: dto.storageKey || '',
            fileName: dto.originalName || dto.title,
            fileSize: dto.fileSize || BigInt(0),
            mimeType: dto.mimeType || 'application/octet-stream',
            checksum: dto.checksum || '',
          },
        },
      },
      include: {
        ...DOCUMENT_INCLUDE,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          select: { id: true, versionNumber: true },
        },
      },
    });

    // Move file from uploads/ to documents/ if storageKey exists
    if (dto.storageKey) {
      try {
        const permanentKey = await this.storage.moveToPermanent(
          dto.storageKey,
          workspaceId,
          document.id,
          versionNumber,
        );
        await this.prisma.documentVersion.updateMany({
          where: { documentId: document.id, versionNumber },
          data: { storageKey: permanentKey },
        });
      } catch {
        // File may already have been moved or uploaded directly
      }
    }

    // Enqueue document processing if there is content to process
    if (dto.fileType && dto.fileType !== 'link') {
      this.queue
        .enqueueProcessDocument(document.id, workspaceId, document.versions[0].id)
        .catch((err) => {
          // Don't fail the create if enqueue fails
        });
    }

    return document;
  }

  async findAll(workspaceId: string, userId: string, filter: DocumentFilterDto) {
    await this.requireWorkspaceAccess(workspaceId, userId);

    const where: Prisma.DocumentWhereInput = {
      workspaceId,
      deletedAt: null,
    };

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { originalName: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { author: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.collectionId) where.collectionId = filter.collectionId;
    if (filter.folderId) where.folderId = filter.folderId;
    if (filter.fileType) where.fileType = filter.fileType;
    if (filter.author) where.author = { contains: filter.author, mode: 'insensitive' };
    if (filter.tagId) {
      where.tags = { some: { id: filter.tagId } };
    }

    const orderBy: Prisma.DocumentOrderByWithRelationInput = {};
    if (filter.sortBy === 'title') orderBy.title = filter.sortOrder || 'asc';
    else if (filter.sortBy === 'fileType') orderBy.fileType = filter.sortOrder || 'asc';
    else if (filter.sortBy === 'createdAt') orderBy.createdAt = filter.sortOrder || 'desc';
    else orderBy.updatedAt = 'desc';

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: DOCUMENT_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(workspaceId: string, documentId: string, userId: string) {
    await this.requireWorkspaceDocument(workspaceId, documentId, userId);
    return this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
      include: {
        ...DOCUMENT_INCLUDE,
        versions: {
          orderBy: { versionNumber: 'desc' },
          select: {
            id: true,
            versionNumber: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            checksum: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async update(workspaceId: string, documentId: string, userId: string, dto: UpdateDocumentDto) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.collectionId !== undefined) data.collectionId = dto.collectionId;
    if (dto.folderId !== undefined) data.folderId = dto.folderId;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.author !== undefined) data.author = dto.author;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.docCreatedAt !== undefined) data.docCreatedAt = new Date(dto.docCreatedAt);
    if (dto.docModifiedAt !== undefined) data.docModifiedAt = new Date(dto.docModifiedAt);
    if (dto.pageCount !== undefined) data.pageCount = dto.pageCount;
    if (dto.wordCount !== undefined) data.wordCount = dto.wordCount;
    if (dto.readingTime !== undefined) data.readingTime = dto.readingTime;

    return this.prisma.document.update({
      where: { id: documentId },
      data,
      include: DOCUMENT_INCLUDE,
    });
  }

  async softDelete(workspaceId: string, documentId: string, userId: string) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    return this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(workspaceId: string, documentId: string, userId: string) {
    await this.requireWorkspaceAccess(workspaceId, userId);

    return this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: null },
    });
  }

  async permanentDelete(workspaceId: string, documentId: string, userId: string) {
    await this.requireWorkspaceAccess(workspaceId, userId);

    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });

    // Delete from storage
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
    });
    for (const v of versions) {
      try {
        await this.storage.deleteObject(v.storageKey);
      } catch {
        // Ignore storage errors during cleanup
      }
    }

    return this.prisma.document.delete({ where: { id: documentId } });
  }

  async addVersion(workspaceId: string, documentId: string, userId: string, dto: CreateVersionDto) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    const doc = await this.prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });

    const versionNumber = doc.versionNumber + 1;

    const [version] = await this.prisma.$transaction([
      this.prisma.documentVersion.create({
        data: {
          documentId,
          versionNumber,
          storageKey: dto.storageKey,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
          mimeType: dto.mimeType,
          checksum: dto.checksum || '',
        },
      }),
      this.prisma.document.update({
        where: { id: documentId },
        data: {
          versionNumber,
          uploadStatus: 'UPLOADED',
          originalName: dto.fileName,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
        },
      }),
    ]);

    return version;
  }

  async getVersions(workspaceId: string, documentId: string, userId: string) {
    await this.requireWorkspaceDocument(workspaceId, documentId, userId);

    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async getVersion(workspaceId: string, documentId: string, versionId: string, userId: string) {
    await this.requireWorkspaceDocument(workspaceId, documentId, userId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { id: versionId, documentId },
    });
    if (!version) throw new NotFoundException('Version not found');

    return version;
  }

  async restoreVersion(
    workspaceId: string,
    documentId: string,
    versionNumber: number,
    userId: string,
  ) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    const version = await this.prisma.documentVersion.findFirst({
      where: { documentId, versionNumber },
    });
    if (!version) throw new NotFoundException('Version not found');

    // Create a new version with the same content
    const newVersionNumber = await this.getNextVersionNumber(documentId);

    return this.prisma.$transaction([
      this.prisma.documentVersion.create({
        data: {
          documentId,
          versionNumber: newVersionNumber,
          storageKey: version.storageKey,
          fileName: version.fileName,
          fileSize: version.fileSize,
          mimeType: version.mimeType,
          checksum: version.checksum,
          metadata: { restoredFrom: versionNumber },
        },
      }),
      this.prisma.document.update({
        where: { id: documentId },
        data: { versionNumber: newVersionNumber },
      }),
    ]);
  }

  async trackView(documentId: string, userId: string) {
    await this.prisma.recentDocument.upsert({
      where: { userId_documentId: { userId, documentId } },
      create: { userId, documentId },
      update: { lastAccessedAt: new Date() },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { lastAccessedAt: new Date() },
    });
  }

  async assignTags(workspaceId: string, documentId: string, userId: string, dto: AssignTagsDto) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        tags: {
          set: dto.tagIds.map((id) => ({ id })),
        },
      },
      include: {
        tags: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async removeTag(workspaceId: string, documentId: string, tagId: string, userId: string) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
      include: {
        tags: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async getProcessingStatus(workspaceId: string, documentId: string, userId: string) {
    await this.requireWorkspaceDocument(workspaceId, documentId, userId);

    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        status: true,
        processingStatus: true,
        parsingStatus: true,
        embeddingStatus: true,
        indexStatus: true,
      },
    });

    const jobs = await this.prisma.backgroundJob.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { document: doc, recentJobs: jobs };
  }

  async retryProcessing(workspaceId: string, documentId: string, userId: string) {
    await this.requireEditAccess(workspaceId, documentId, userId);

    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, versionNumber: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const version = await this.prisma.documentVersion.findFirst({
      where: { documentId, versionNumber: doc.versionNumber },
      select: { id: true },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: 'PENDING',
        parsingStatus: 'PENDING',
        embeddingStatus: 'PENDING',
        indexStatus: 'PENDING',
      },
    });

    if (version) {
      await this.queue.enqueueProcessDocument(documentId, workspaceId, version.id);
    }

    return { message: 'Processing retry queued' };
  }

  async getPresignedUrl(workspaceId: string, storageKey: string) {
    return this.storage.getPresignedUrl(storageKey);
  }

  async getPresignedUploadUrl(workspaceId: string, userId: string, fileName: string) {
    return this.storage.getPresignedUploadUrl(workspaceId, userId, fileName);
  }

  private async getNextVersionNumber(documentId: string): Promise<number> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { versionNumber: true },
    });
    return (doc?.versionNumber || 0) + 1;
  }

  private async requireWorkspaceAccess(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }

  private async requireWorkspaceDocument(workspaceId: string, documentId: string, userId: string) {
    await this.requireWorkspaceAccess(workspaceId, userId);

    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });
    if (!doc || doc.workspaceId !== workspaceId) {
      throw new NotFoundException('Document not found');
    }
  }

  private async requireEditAccess(workspaceId: string, documentId: string, userId: string) {
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
      throw new ForbiddenException('Insufficient permissions to modify documents');
    }
  }
}

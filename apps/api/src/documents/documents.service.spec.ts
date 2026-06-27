import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { StorageService } from '../shared/services/storage.service';
import { QueueService } from '../jobs/queue.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;
  let storage: any;

  const mockPrisma = {
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documentVersion: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    recentDocument: { upsert: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
    workspace: { findUnique: jest.fn() },
    favorite: { findUnique: jest.fn() },
    tag: { findUnique: jest.fn(), findFirst: jest.fn() },
    collection: { findFirst: jest.fn() },
    folder: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockStorage = {
    moveToPermanent: jest.fn(),
    getPresignedUrl: jest.fn(),
    getPresignedUploadUrl: jest.fn(),
    deleteObject: jest.fn(),
  };

  const mockQueue = {
    enqueueProcessDocument: jest.fn().mockResolvedValue('job-1'),
    enqueueReprocessDocument: jest.fn().mockResolvedValue('job-1'),
    enqueueDeleteVectors: jest.fn().mockResolvedValue('job-1'),
    enqueueWebsiteImport: jest.fn().mockResolvedValue('job-1'),
    enqueueGitHubImport: jest.fn().mockResolvedValue('job-1'),
    enqueueYouTubeImport: jest.fn().mockResolvedValue('job-1'),
    enqueueGenerateSummary: jest.fn().mockResolvedValue('job-1'),
    enqueueGenerateTags: jest.fn().mockResolvedValue('job-1'),
    enqueueGenerateKeywords: jest.fn().mockResolvedValue('job-1'),
  };

  const memberFixture = { id: 'member-1', workspaceId: 'ws-1', userId: 'user-1', role: 'MEMBER' };
  const editorFixture = { id: 'member-2', workspaceId: 'ws-1', userId: 'user-1', role: 'EDITOR' };
  const viewerFixture = { id: 'member-3', workspaceId: 'ws-1', userId: 'user-1', role: 'VIEWER' };
  const docFixture = {
    id: 'doc-1',
    workspaceId: 'ws-1',
    ownerId: 'user-1',
    title: 'Test Doc',
    originalName: 'test.pdf',
    fileType: 'pdf',
    mimeType: 'application/pdf',
    fileSize: BigInt(1000),
    uploadStatus: 'UPLOADED',
    versionNumber: 1,
    sourceType: 'FILE',
    status: 'READY',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        { provide: QueueService, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get(PrismaService);
    storage = module.get(StorageService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      title: 'Test Doc',
      originalName: 'test.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: BigInt(1000),
      storageKey: 'uploads/key.pdf',
      checksum: 'abc123',
      collectionId: 'col-1',
      folderId: 'fld-1',
    };

    it('should create document with initial version', async () => {
      mockPrisma.document.create.mockResolvedValue({
        ...docFixture,
        tags: [],
        _count: { versions: 1, comments: 0 },
        versions: [{ id: 'ver-1', versionNumber: 1 }],
      });
      mockStorage.moveToPermanent.mockResolvedValue('documents/ws-1/doc-1/v1/key.pdf');
      mockPrisma.documentVersion.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.create('user-1', 'ws-1', dto);

      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            ownerId: 'user-1',
            title: 'Test Doc',
            versionNumber: 1,
            versions: expect.objectContaining({
              create: expect.objectContaining({ versionNumber: 1, storageKey: 'uploads/key.pdf' }),
            }),
          }),
        }),
      );
      expect(mockStorage.moveToPermanent).toHaveBeenCalledWith(
        'uploads/key.pdf',
        'ws-1',
        result.id,
        1,
      );
      expect(mockPrisma.documentVersion.updateMany).toHaveBeenCalled();
    });

    it('should not require workspace membership for create (no access check)', async () => {
      mockPrisma.document.create.mockResolvedValue({
        ...docFixture,
        tags: [],
        _count: { versions: 1, comments: 0 },
        versions: [{ id: 'ver-1', versionNumber: 1 }],
      });

      await service.create('user-1', 'ws-1', dto);

      expect(mockPrisma.workspaceMember.findUnique).not.toHaveBeenCalled();
    });

    it('should handle storageKey being absent', async () => {
      const dtoNoKey = { title: 'Test Doc' };
      mockPrisma.document.create.mockResolvedValue({
        ...docFixture,
        tags: [],
        _count: { versions: 1, comments: 0 },
        versions: [{ id: 'ver-1', versionNumber: 1 }],
      });

      const result = await service.create('user-1', 'ws-1', dtoNoKey);

      expect(mockStorage.moveToPermanent).not.toHaveBeenCalled();
      expect(result.title).toBe('Test Doc');
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findMany.mockResolvedValue([docFixture]);
      mockPrisma.document.count.mockResolvedValue(1);

      const result = await service.findAll('ws-1', 'user-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should filter by search query', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await service.findAll('ws-1', 'user-1', { search: 'test' });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'test', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('should filter by collectionId', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await service.findAll('ws-1', 'user-1', { collectionId: 'col-1' });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ collectionId: 'col-1' }) }),
      );
    });

    it('should filter by tagId', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await service.findAll('ws-1', 'user-1', { tagId: 'tag-1' });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tags: { some: { id: 'tag-1' } } }),
        }),
      );
    });

    it('should respect pagination params', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await service.findAll('ws-1', 'user-1', { page: 3, limit: 10 });

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should throw ForbiddenException for non-members', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.findAll('ws-1', 'user-2', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return document with versions', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findUnique.mockResolvedValue({ ...docFixture, workspaceId: 'ws-1' });
      const docWithVersions = { ...docFixture, versions: [{ id: 'v-1', versionNumber: 1 }] };
      mockPrisma.document.findUniqueOrThrow.mockResolvedValue(docWithVersions);

      const result = await service.findOne('ws-1', 'doc-1', 'user-1');

      expect(result.versions).toHaveLength(1);
      expect(mockPrisma.document.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'doc-1' } }),
      );
    });

    it('should throw NotFoundException for wrong workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findUnique.mockResolvedValue({ ...docFixture, workspaceId: 'ws-2' });

      await expect(service.findOne('ws-1', 'doc-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ws-1', 'doc-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update metadata fields', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.document.update.mockResolvedValue({ ...docFixture, title: 'Updated' });

      const result = await service.update('ws-1', 'doc-1', 'user-1', {
        title: 'Updated',
        description: 'New desc',
      });

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: expect.objectContaining({ title: 'Updated', description: 'New desc' }),
        }),
      );
      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException for VIEWER role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(viewerFixture);

      await expect(service.update('ws-1', 'doc-1', 'user-1', { title: 'Updated' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for non-members', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.update('ws-1', 'doc-1', 'user-2', { title: 'Updated' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.document.update.mockResolvedValue({ ...docFixture, deletedAt: new Date() });

      const result = await service.softDelete('ws-1', 'doc-1', 'user-1');

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should clear deletedAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.update.mockResolvedValue({ ...docFixture, deletedAt: null });

      const result = await service.restore('ws-1', 'doc-1', 'user-1');

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: { deletedAt: null },
        }),
      );
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('addVersion', () => {
    const dto = {
      storageKey: 'new/key.pdf',
      fileName: 'v2.pdf',
      fileSize: BigInt(2000),
      mimeType: 'application/pdf',
      checksum: 'def456',
    };

    it('should increment version number', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.document.findUniqueOrThrow.mockResolvedValue(docFixture);
      const newVersion = { id: 'v-2', documentId: 'doc-1', versionNumber: 2, ...dto };
      mockPrisma.$transaction.mockResolvedValue([newVersion]);

      const result = await service.addVersion('ws-1', 'doc-1', 'user-1', dto);

      expect(mockPrisma.document.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.versionNumber).toBe(2);
    });
  });

  describe('getVersions', () => {
    it('should return versions ordered desc', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.findUnique.mockResolvedValue({ ...docFixture, workspaceId: 'ws-1' });
      const versions = [
        { id: 'v-2', versionNumber: 2 },
        { id: 'v-1', versionNumber: 1 },
      ];
      mockPrisma.documentVersion.findMany.mockResolvedValue(versions);

      const result = await service.getVersions('ws-1', 'doc-1', 'user-1');

      expect(mockPrisma.documentVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId: 'doc-1' },
          orderBy: { versionNumber: 'desc' },
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('assignTags', () => {
    it('should connect tags', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.document.update.mockResolvedValue({
        ...docFixture,
        tags: [{ id: 'tag-1', name: 'Tag1', color: '#000' }],
      });

      const result = await service.assignTags('ws-1', 'doc-1', 'user-1', { tagIds: ['tag-1'] });

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: { tags: { set: [{ id: 'tag-1' }] } },
        }),
      );
      expect(result.tags).toHaveLength(1);
    });
  });
});

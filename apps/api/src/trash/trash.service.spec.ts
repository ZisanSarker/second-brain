import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { StorageService } from '../shared/services/storage.service';
import { TrashService } from './trash.service';

describe('TrashService', () => {
  let service: TrashService;
  let prisma: any;
  let storage: any;

  const mockPrisma = {
    document: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    documentVersion: { findMany: jest.fn() },
    collection: { findMany: jest.fn(), deleteMany: jest.fn(), count: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
  };

  const mockStorage = {
    deleteObject: jest.fn(),
  };

  const memberFixture = { id: 'member-1', workspaceId: 'ws-1', userId: 'user-1', role: 'MEMBER' };
  const editorFixture = { id: 'member-2', workspaceId: 'ws-1', userId: 'user-1', role: 'EDITOR' };
  const viewerFixture = { id: 'member-3', workspaceId: 'ws-1', userId: 'user-1', role: 'VIEWER' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrashService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<TrashService>(TrashService);
    prisma = module.get(PrismaService);
    storage = module.get(StorageService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return trashed documents and collections with pagination', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      const trashedDoc = {
        id: 'doc-1',
        title: 'Trashed Doc',
        deletedAt: new Date(),
        collection: { id: 'col-1', name: 'Test' },
        tags: [],
      };
      const trashedCol = { id: 'col-1', name: 'Trashed Collection', deletedAt: new Date() };
      mockPrisma.document.findMany.mockResolvedValue([trashedDoc]);
      mockPrisma.collection.findMany.mockResolvedValue([trashedCol]);
      mockPrisma.document.count.mockResolvedValue(1);
      mockPrisma.collection.count.mockResolvedValue(1);

      const result = await service.findAll('ws-1', 'user-1', 1, 50);

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: { not: null } },
        skip: 0,
        take: 50,
        include: {
          collection: { select: { id: true, name: true } },
          tags: { select: { id: true, name: true, color: true } },
        },
        orderBy: { deletedAt: 'desc' },
      });
      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      });
      expect(result.documents).toHaveLength(1);
      expect(result.collections).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 50, totalPages: 1 });
    });
  });

  describe('restoreDocument', () => {
    it('should clear deletedAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.document.update.mockResolvedValue({ id: 'doc-1', deletedAt: null });

      const result = await service.restoreDocument('ws-1', 'doc-1', 'user-1');

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { deletedAt: null },
      });
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('permanentDeleteDocument', () => {
    it('should delete versions from storage and then the document', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      const versions = [
        { id: 'v-1', storageKey: 'key1' },
        { id: 'v-2', storageKey: 'key2' },
      ];
      mockPrisma.documentVersion.findMany.mockResolvedValue(versions);
      mockStorage.deleteObject.mockResolvedValue(undefined);
      mockPrisma.document.delete.mockResolvedValue({ id: 'doc-1' });

      await service.permanentDeleteDocument('ws-1', 'doc-1', 'user-1');

      expect(mockPrisma.documentVersion.findMany).toHaveBeenCalledWith({
        where: { documentId: 'doc-1' },
      });
      expect(mockStorage.deleteObject).toHaveBeenCalledTimes(2);
      expect(mockStorage.deleteObject).toHaveBeenCalledWith('key1');
      expect(mockStorage.deleteObject).toHaveBeenCalledWith('key2');
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
    });

    it('should continue if storage delete fails', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.documentVersion.findMany.mockResolvedValue([{ id: 'v-1', storageKey: 'key1' }]);
      mockStorage.deleteObject.mockRejectedValue(new Error('Storage error'));
      mockPrisma.document.delete.mockResolvedValue({ id: 'doc-1' });

      await expect(
        service.permanentDeleteDocument('ws-1', 'doc-1', 'user-1'),
      ).resolves.not.toThrow();
      expect(mockPrisma.document.delete).toHaveBeenCalled();
    });
  });

  describe('emptyTrash', () => {
    it('should delete all trashed documents and collections', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      const docs = [
        {
          id: 'doc-1',
          title: 'Trashed Doc',
          deletedAt: new Date(),
          versions: [{ storageKey: 'key1' }, { storageKey: 'key2' }],
        },
      ];
      mockPrisma.document.findMany.mockResolvedValue(docs);
      mockStorage.deleteObject.mockResolvedValue(undefined);
      mockPrisma.document.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.collection.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.emptyTrash('ws-1', 'user-1');

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: { not: null } },
        include: { versions: true },
      });
      expect(mockStorage.deleteObject).toHaveBeenCalledTimes(2);
      expect(mockStorage.deleteObject).toHaveBeenCalledWith('key1');
      expect(mockStorage.deleteObject).toHaveBeenCalledWith('key2');
      expect(mockPrisma.document.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: { not: null } },
      });
      expect(mockPrisma.collection.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: { not: null } },
      });
      expect(result).toEqual({ deletedDocuments: 1, deletedCollections: 2 });
    });

    it('should require editor role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(viewerFixture);

      await expect(service.emptyTrash('ws-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});

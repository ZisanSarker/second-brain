import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let prisma: any;

  const mockPrisma = {
    collection: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
  };

  const memberFixture = { id: 'member-1', workspaceId: 'ws-1', userId: 'user-1', role: 'MEMBER' };
  const editorFixture = { id: 'member-2', workspaceId: 'ws-1', userId: 'user-1', role: 'EDITOR' };
  const viewerFixture = { id: 'member-3', workspaceId: 'ws-1', userId: 'user-1', role: 'VIEWER' };

  const collectionFixture = {
    id: 'col-1',
    workspaceId: 'ws-1',
    name: 'Test Collection',
    description: 'A test',
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { documents: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { name: 'New Collection', description: 'A new collection' };

    it('should create a collection', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.collection.create.mockResolvedValue(collectionFixture);

      const result = await service.create('ws-1', 'user-1', dto);

      expect(mockPrisma.collection.create).toHaveBeenCalledWith({
        data: { workspaceId: 'ws-1', name: 'New Collection', description: 'A new collection' },
        include: { _count: { select: { documents: true } } },
      });
      expect(result.name).toBe('Test Collection');
    });

    it('should require workspace membership', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.create('ws-1', 'user-2', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return active (not deleted/archived) collections', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.collection.findMany.mockResolvedValue([collectionFixture]);

      const result = await service.findAll('ws-1', 'user-1');

      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', deletedAt: null, archivedAt: null },
        include: { _count: { select: { documents: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update name and description', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.collection.findFirst.mockResolvedValue(collectionFixture);
      mockPrisma.collection.update.mockResolvedValue({
        ...collectionFixture,
        name: 'Updated',
        description: 'New desc',
      });

      const result = await service.update('ws-1', 'col-1', 'user-1', {
        name: 'Updated',
        description: 'New desc',
      });

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { name: 'Updated', description: 'New desc' },
        include: { _count: { select: { documents: true } } },
      });
      expect(result.name).toBe('Updated');
    });

    it('should require editor role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(viewerFixture);

      await expect(service.update('ws-1', 'col-1', 'user-1', { name: 'Updated' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if collection does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.collection.findFirst.mockResolvedValue(null);

      await expect(service.update('ws-1', 'col-1', 'user-1', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive', () => {
    it('should set archivedAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.collection.findFirst.mockResolvedValue(collectionFixture);
      mockPrisma.collection.update.mockResolvedValue({
        ...collectionFixture,
        archivedAt: new Date(),
      });

      const result = await service.archive('ws-1', 'col-1', 'user-1');

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { archivedAt: expect.any(Date) },
      });
      expect(result.archivedAt).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should clear archivedAt and deletedAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.collection.update.mockResolvedValue({
        ...collectionFixture,
        archivedAt: null,
        deletedAt: null,
      });

      const result = await service.restore('ws-1', 'col-1', 'user-1');

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { archivedAt: null, deletedAt: null },
      });
      expect(result.archivedAt).toBeNull();
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.collection.update.mockResolvedValue({
        ...collectionFixture,
        deletedAt: new Date(),
      });

      const result = await service.softDelete('ws-1', 'col-1', 'user-1');

      expect(mockPrisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeDefined();
    });
  });
});

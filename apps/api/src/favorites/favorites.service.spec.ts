import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: any;

  const mockPrisma = {
    favorite: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    document: { findMany: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
  };

  const memberFixture = { id: 'member-1', workspaceId: 'ws-1', userId: 'user-1', role: 'MEMBER' };

  const favoriteFixture = {
    id: 'fav-1',
    userId: 'user-1',
    entityId: 'doc-1',
    entityType: 'DOCUMENT',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoritesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return user favorites filtered by workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.favorite.findMany.mockResolvedValue([favoriteFixture]);
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Test',
          fileType: 'pdf',
          status: 'READY',
          createdAt: new Date(),
          updatedAt: new Date(),
          workspaceId: 'ws-1',
        },
      ]);

      const result = await service.findAll('user-1', 'ws-1');

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['doc-1'] }, workspaceId: 'ws-1' },
        select: {
          id: true,
          title: true,
          fileType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          workspaceId: true,
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].document).toBeDefined();
      expect(result[0].document!.id).toBe('doc-1');
    });

    it('should filter favorites whose documents are not in the workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.favorite.findMany.mockResolvedValue([favoriteFixture]);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-1', 'ws-1');

      expect(result).toHaveLength(0);
    });

    it('should handle non-document favorites', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      const collectionFav = { ...favoriteFixture, entityId: 'col-1', entityType: 'COLLECTION' };
      mockPrisma.favorite.findMany.mockResolvedValue([collectionFav]);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-1', 'ws-1');

      expect(result).toHaveLength(1);
      expect(result[0].document).toBeNull();
    });
  });

  describe('toggle', () => {
    it('should create favorite if not exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue(favoriteFixture);

      const result = await service.toggle('user-1', 'doc-1', 'DOCUMENT');

      expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', entityId: 'doc-1', entityType: 'DOCUMENT' },
      });
      expect(result).toEqual({ favorited: true });
    });

    it('should delete if exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(favoriteFixture);
      mockPrisma.favorite.delete.mockResolvedValue(favoriteFixture);

      const result = await service.toggle('user-1', 'doc-1', 'DOCUMENT');

      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 'fav-1' } });
      expect(result).toEqual({ favorited: false });
    });
  });

  describe('remove', () => {
    it('should delete if exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(favoriteFixture);
      mockPrisma.favorite.delete.mockResolvedValue(favoriteFixture);

      await service.remove('user-1', 'doc-1', 'DOCUMENT');

      expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
        where: {
          userId_entityId_entityType: {
            userId: 'user-1',
            entityId: 'doc-1',
            entityType: 'DOCUMENT',
          },
        },
      });
      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 'fav-1' } });
    });

    it('should do nothing if not exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);

      await service.remove('user-1', 'doc-1', 'DOCUMENT');

      expect(mockPrisma.favorite.delete).not.toHaveBeenCalled();
    });
  });

  describe('isFavorited', () => {
    it('should return true when favorite exists', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(favoriteFixture);

      const result = await service.isFavorited('user-1', 'doc-1', 'DOCUMENT');

      expect(result).toBe(true);
    });

    it('should return false when favorite does not exist', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);

      const result = await service.isFavorited('user-1', 'doc-1', 'DOCUMENT');

      expect(result).toBe(false);
    });
  });
});

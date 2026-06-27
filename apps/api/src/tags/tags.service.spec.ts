import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;
  let prisma: any;

  const mockPrisma = {
    tag: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    document: { updateMany: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
  };

  const editorFixture = { id: 'member-1', workspaceId: 'ws-1', userId: 'user-1', role: 'EDITOR' };
  const memberFixture = { id: 'member-2', workspaceId: 'ws-1', userId: 'user-1', role: 'MEMBER' };

  const tagFixture = {
    id: 'tag-1',
    workspaceId: 'ws-1',
    name: 'Test Tag',
    color: '#6B7280',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { documents: 5 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TagsService>(TagsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tag', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue(tagFixture);

      const result = await service.create('ws-1', 'user-1', { name: 'Test Tag' });

      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: { workspaceId: 'ws-1', name: 'Test Tag', color: '#6B7280' },
      });
      expect(result.name).toBe('Test Tag');
    });

    it('should use provided color', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ ...tagFixture, color: '#FF0000' });

      await service.create('ws-1', 'user-1', { name: 'Red Tag', color: '#FF0000' });

      expect(mockPrisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ color: '#FF0000' }),
        }),
      );
    });

    it('should throw ConflictException for duplicate name', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findUnique.mockResolvedValue(tagFixture);

      await expect(service.create('ws-1', 'user-1', { name: 'Test Tag' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return workspace tags with doc count', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.tag.findMany.mockResolvedValue([tagFixture]);

      const result = await service.findAll('ws-1', 'user-1');

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        include: { _count: { select: { documents: true } } },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]._count.documents).toBe(5);
    });
  });

  describe('update', () => {
    it('should update name and color', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findFirst.mockResolvedValue(tagFixture);
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.update.mockResolvedValue({ ...tagFixture, name: 'Renamed', color: '#000' });

      const result = await service.update('ws-1', 'tag-1', 'user-1', {
        name: 'Renamed',
        color: '#000',
      });

      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
        data: { name: 'Renamed', color: '#000' },
        include: { _count: { select: { documents: true } } },
      });
      expect(result.name).toBe('Renamed');
    });

    it('should throw ConflictException if new name clashes with another tag', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findFirst.mockResolvedValue(tagFixture);
      mockPrisma.tag.findUnique.mockResolvedValue({ ...tagFixture, id: 'tag-2', name: 'Renamed' });

      await expect(service.update('ws-1', 'tag-1', 'user-1', { name: 'Renamed' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should disconnect from documents first, then delete', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findFirst.mockResolvedValue(tagFixture);
      mockPrisma.document.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.tag.delete.mockResolvedValue(tagFixture);

      await service.delete('ws-1', 'tag-1', 'user-1');

      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: { tags: { some: { id: 'tag-1' } } },
        data: { tags: { disconnect: { id: 'tag-1' } } },
      });
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: 'tag-1' } });
    });

    it('should throw NotFoundException when tag does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.tag.findFirst.mockResolvedValue(null);

      await expect(service.delete('ws-1', 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

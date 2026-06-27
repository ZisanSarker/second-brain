import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { FoldersService } from './folders.service';

describe('FoldersService', () => {
  let service: FoldersService;
  let prisma: any;

  const mockPrisma = {
    folder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    document: { updateMany: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
  };

  const editorFixture = { id: 'member-1', workspaceId: 'ws-1', userId: 'user-1', role: 'EDITOR' };
  const memberFixture = { id: 'member-2', workspaceId: 'ws-1', userId: 'user-1', role: 'MEMBER' };

  const folderFixture = {
    id: 'fld-1',
    workspaceId: 'ws-1',
    name: 'Test Folder',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { documents: 0, children: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoldersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a folder', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.folder.create.mockResolvedValue(folderFixture);

      const result = await service.create('ws-1', 'user-1', { name: 'Test Folder' });

      expect(mockPrisma.folder.create).toHaveBeenCalledWith({
        data: { workspaceId: 'ws-1', name: 'Test Folder', parentId: null },
        include: { _count: { select: { documents: true, children: true } } },
      });
      expect(result.name).toBe('Test Folder');
    });

    it('should validate parent folder exists', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.folder.findFirst.mockResolvedValue(null);

      await expect(
        service.create('ws-1', 'user-1', { name: 'Child', parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create with valid parentId', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.folder.findFirst.mockResolvedValue(folderFixture);
      mockPrisma.folder.create.mockResolvedValue({ ...folderFixture, parentId: 'fld-1' });

      const result = await service.create('ws-1', 'user-1', { name: 'Child', parentId: 'fld-1' });

      expect(mockPrisma.folder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ parentId: 'fld-1' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return workspace folders', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.folder.findMany.mockResolvedValue([folderFixture]);

      const result = await service.findAll('ws-1', 'user-1');

      expect(mockPrisma.folder.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        include: { _count: { select: { documents: true, children: true } } },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getTree', () => {
    it('should build nested tree structure', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      const parent = { ...folderFixture, id: 'parent', name: 'Parent' };
      const child = { ...folderFixture, id: 'child', name: 'Child', parentId: 'parent' };
      mockPrisma.folder.findMany.mockResolvedValue([parent, child]);

      const result = await service.getTree('ws-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('parent');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('child');
      expect(result[0].children[0].children).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should include children', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      const folderWithChildren = {
        ...folderFixture,
        children: [
          {
            ...folderFixture,
            id: 'child',
            name: 'Child',
            parentId: 'fld-1',
            _count: { documents: 0, children: 0 },
          },
        ],
        parent: { id: 'parent', name: 'Parent' },
      };
      mockPrisma.folder.findFirst.mockResolvedValue(folderWithChildren);

      const result = await service.findOne('ws-1', 'fld-1', 'user-1');

      expect(result.children).toHaveLength(1);
      expect(result.parent!.name).toBe('Parent');
    });

    it('should throw NotFoundException when folder does not exist', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberFixture);
      mockPrisma.folder.findFirst.mockResolvedValue(null);

      await expect(service.findOne('ws-1', 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update name', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.folder.findFirst.mockResolvedValue(folderFixture);
      mockPrisma.folder.update.mockResolvedValue({ ...folderFixture, name: 'Renamed' });

      const result = await service.update('ws-1', 'fld-1', 'user-1', { name: 'Renamed' });

      expect(mockPrisma.folder.update).toHaveBeenCalledWith({
        where: { id: 'fld-1' },
        data: { name: 'Renamed' },
        include: { _count: { select: { documents: true, children: true } } },
      });
      expect(result.name).toBe('Renamed');
    });
  });

  describe('delete', () => {
    it('should reparent children and unset documents', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.folder.findFirst.mockResolvedValue({
        ...folderFixture,
        parentId: 'parent-id',
        _count: { children: 2 },
      });
      mockPrisma.document.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.folder.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.folder.delete.mockResolvedValue(folderFixture);

      await service.delete('ws-1', 'fld-1', 'user-1');

      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: { folderId: 'fld-1' },
        data: { folderId: null },
      });
      expect(mockPrisma.folder.updateMany).toHaveBeenCalledWith({
        where: { parentId: 'fld-1' },
        data: { parentId: 'parent-id' },
      });
      expect(mockPrisma.folder.delete).toHaveBeenCalledWith({ where: { id: 'fld-1' } });
    });

    it('should reparent to null when deleting a root folder', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(editorFixture);
      mockPrisma.folder.findFirst.mockResolvedValue({
        ...folderFixture,
        parentId: null,
        _count: { children: 2 },
      });
      mockPrisma.document.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.folder.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.folder.delete.mockResolvedValue(folderFixture);

      await service.delete('ws-1', 'fld-1', 'user-1');

      expect(mockPrisma.folder.updateMany).toHaveBeenCalledWith({
        where: { parentId: 'fld-1' },
        data: { parentId: null },
      });
    });
  });
});

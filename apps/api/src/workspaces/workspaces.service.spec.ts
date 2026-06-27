import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../shared/services/prisma.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: any;

  const mockPrisma = {
    workspace: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockWorkspace = {
    id: 'ws-1',
    name: 'Test Workspace',
    slug: 'test-workspace',
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspacesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { name: 'My Workspace' };

    it('should create workspace with owner role', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.create.mockResolvedValue({
        ...mockWorkspace,
        name: 'My Workspace',
        slug: 'my-workspace',
        members: [{ userId: 'user-1', role: 'OWNER' }],
        settings: {},
      });

      const result = await service.create('user-1', dto);

      expect(result.name).toBe('My Workspace');
      expect(result.slug).toBe('my-workspace');
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            members: { create: { userId: 'user-1', role: 'OWNER' } },
          }),
        }),
      );
    });

    it('should use custom slug if provided', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.workspace.create.mockResolvedValue({
        ...mockWorkspace,
        name: 'My Workspace',
        slug: 'custom-slug',
      });

      await service.create('user-1', { name: 'My Workspace', slug: 'custom-slug' });

      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'custom-slug' }),
        }),
      );
    });

    it('should throw ConflictException if slug exists', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await expect(service.create('user-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByUser', () => {
    it('should return user workspaces with role info', async () => {
      mockPrisma.workspaceMember.findMany.mockResolvedValue([
        {
          role: 'OWNER',
          createdAt: new Date('2024-01-01'),
          workspace: {
            ...mockWorkspace,
            _count: { members: 3, documents: 5 },
          },
        },
      ]);

      const result = await service.findByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('OWNER');
      expect(result[0].memberCount).toBe(3);
      expect(result[0].documentCount).toBe(5);
    });
  });

  describe('findById', () => {
    it('should return workspace if user is member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        _count: { members: 3, documents: 5, conversations: 2 },
        settings: { aiModel: 'gpt-4' },
      });

      const result = await service.findById('ws-1', 'user-1');

      expect(result.id).toBe('ws-1');
      expect(result.role).toBe('ADMIN');
    });

    it('should throw ForbiddenException if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.findById('ws-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update workspace name', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspace.update.mockResolvedValue({ ...mockWorkspace, name: 'Updated' });

      const result = await service.update('ws-1', 'user-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw if user is not admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'VIEWER',
      });

      await expect(service.update('ws-1', 'user-1', { name: 'Updated' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should soft-delete workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'OWNER',
      });

      await service.delete('ws-1', 'user-1');

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw if user is not owner', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });

      await expect(service.delete('ws-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMembers', () => {
    it('should return workspace members', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'VIEWER',
      });
      const members = [
        {
          id: 'm-1',
          userId: 'user-2',
          role: 'MEMBER',
          user: { id: 'user-2', email: 'member@test.com', name: 'Member', avatarUrl: null },
        },
      ];
      mockPrisma.workspaceMember.findMany.mockResolvedValue(members);

      const result = await service.getMembers('ws-1', 'user-1');

      expect(result).toEqual(members);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-2',
        role: 'MEMBER',
      });
      mockPrisma.workspaceMember.update.mockResolvedValue({
        userId: 'user-2',
        role: 'EDITOR',
        user: { id: 'user-2', email: 'm@t.com', name: 'M', avatarUrl: null },
      });

      const result = await service.updateMemberRole('ws-1', 'user-1', 'user-2', 'EDITOR');

      expect(result.role).toBe('EDITOR');
    });

    it('should throw if target is owner', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-2',
        role: 'OWNER',
      });

      await expect(service.updateMemberRole('ws-1', 'user-1', 'user-2', 'EDITOR')).rejects.toThrow(
        'Cannot change the owner role',
      );
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-2',
        role: 'MEMBER',
      });

      await service.removeMember('ws-1', 'user-1', 'user-2');

      expect(mockPrisma.workspaceMember.delete).toHaveBeenCalled();
    });

    it('should throw if target is owner', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-2',
        role: 'OWNER',
      });

      await expect(service.removeMember('ws-1', 'user-1', 'user-2')).rejects.toThrow(
        'Cannot remove the workspace owner',
      );
    });
  });

  describe('getSettings', () => {
    it('should return workspace settings', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'VIEWER',
      });
      mockPrisma.workspaceSettings.findUnique.mockResolvedValue({
        aiModel: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
      });

      const result = await service.getSettings('ws-1', 'user-1');

      expect(result.aiModel).toBe('gpt-4');
    });

    it('should create settings if not exists', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'VIEWER',
      });
      mockPrisma.workspaceSettings.findUnique.mockResolvedValue(null);
      mockPrisma.workspaceSettings.create.mockResolvedValue({ aiModel: 'gpt-4' });

      const result = await service.getSettings('ws-1', 'user-1');

      expect(result.aiModel).toBe('gpt-4');
      expect(mockPrisma.workspaceSettings.create).toHaveBeenCalled();
    });
  });

  describe('getMyMembership', () => {
    it('should return membership', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'MEMBER',
      });

      const result = await service.getMyMembership('ws-1', 'user-1');

      expect(result.role).toBe('MEMBER');
    });

    it('should throw if not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.getMyMembership('ws-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});

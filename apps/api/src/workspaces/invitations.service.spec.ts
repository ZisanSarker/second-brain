import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../shared/services/prisma.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: any;

  const mockPrisma = {
    workspaceMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    workspaceInvitation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockInvitation = {
    id: 'inv-1',
    workspaceId: 'ws-1',
    email: 'invited@example.com',
    role: 'MEMBER',
    token: 'random-token-123',
    expiresAt: new Date(Date.now() + 86400000),
    acceptedAt: null,
    rejectedAt: null,
    createdAt: new Date('2024-01-01'),
    workspace: { id: 'ws-1', name: 'Test', slug: 'test' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { email: 'invited@example.com', role: 'MEMBER' as any };

    it('should create an invitation', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.workspaceInvitation.findFirst.mockResolvedValue(null);
      mockPrisma.workspaceInvitation.create.mockResolvedValue(mockInvitation);

      const result = await service.create('ws-1', 'user-1', dto);

      expect(result.email).toBe(dto.email);
      expect(result.inviteUrl).toBeDefined();
    });

    it('should throw if not admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'MEMBER',
      });

      await expect(service.create('ws-1', 'user-1', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if user is already a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: dto.email });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'existing-user',
        workspaceId: 'ws-1',
      });

      await expect(service.create('ws-1', 'user-1', dto)).rejects.toThrow(ConflictException);
    });

    it('should throw if active invitation exists', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.workspaceInvitation.findFirst.mockResolvedValue(mockInvitation);

      await expect(service.create('ws-1', 'user-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByWorkspace', () => {
    it('should return invitations for workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceInvitation.findMany.mockResolvedValue([mockInvitation]);

      const result = await service.findByWorkspace('ws-1', 'user-1');

      expect(result).toHaveLength(1);
    });

    it('should throw if not admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'MEMBER',
      });

      await expect(service.findByWorkspace('ws-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revoke', () => {
    it('should revoke invitation', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(mockInvitation);

      await service.revoke('ws-1', 'user-1', 'inv-1');

      expect(mockPrisma.workspaceInvitation.delete).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
      });
    });

    it('should throw if not admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'VIEWER',
      });

      await expect(service.revoke('ws-1', 'user-1', 'inv-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if invitation not found', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(null);

      await expect(service.revoke('ws-1', 'user-1', 'inv-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvitation', () => {
    it('should return invitation by token', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(mockInvitation);

      const result = await service.getInvitation('random-token-123');

      expect(result.workspaceName).toBe('Test');
      expect(result.email).toBe('invited@example.com');
    });

    it('should throw if not found', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(null);

      await expect(service.getInvitation('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw if expired', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(service.getInvitation('expired')).rejects.toThrow('Invitation has expired');
    });

    it('should throw if already processed', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        acceptedAt: new Date(),
      });

      await expect(service.getInvitation('accepted')).rejects.toThrow(
        'Invitation has already been processed',
      );
    });
  });

  describe('accept', () => {
    it('should accept invitation and create membership', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'invited@example.com',
      });
      mockPrisma.$transaction.mockResolvedValue([
        { userId: 'user-2', workspaceId: 'ws-1', role: 'MEMBER' },
        { ...mockInvitation, acceptedAt: new Date() },
      ]);

      const result = await service.accept('random-token-123', 'user-2');

      expect(result.userId).toBe('user-2');
    });

    it('should throw if email does not match', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-3',
        email: 'other@example.com',
      });

      await expect(service.accept('random-token-123', 'user-3')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw if already accepted', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        acceptedAt: new Date(),
      });

      await expect(service.accept('random-token-123', 'user-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('should reject invitation', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(mockInvitation);

      await service.reject('random-token-123');

      expect(mockPrisma.workspaceInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { rejectedAt: expect.any(Date) },
      });
    });

    it('should throw if not found', async () => {
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(null);

      await expect(service.reject('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});

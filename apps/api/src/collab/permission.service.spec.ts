import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: any;

  const mockPrisma = {
    workspaceMember: { findUnique: jest.fn() },
    resourcePermission: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('getMemberRole', () => {
    it('should return member role when found', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      const result = await service.getMemberRole('ws-1', 'user-1');
      expect(result).toBe('ADMIN');
    });

    it('should return null when no membership', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      const result = await service.getMemberRole('ws-1', 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('requireWorkspaceAccess', () => {
    it('should return role for member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      const result = await service.requireWorkspaceAccess('ws-1', 'user-1');
      expect(result).toBe('MEMBER');
    });

    it('should throw ForbiddenException for non-member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.requireWorkspaceAccess('ws-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('requireRole', () => {
    it('should pass for user with sufficient role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      const result = await service.requireRole('ws-1', 'user-1', 'EDITOR');
      expect(result).toBe('ADMIN');
    });

    it('should throw ForbiddenException for insufficient role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'VIEWER' });
      await expect(service.requireRole('ws-1', 'user-1', 'EDITOR')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('canRead', () => {
    it('should return true for member with VIEWER or higher', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'VIEWER' });
      const result = await service.canRead('ws-1', 'DOCUMENT', 'doc-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should check ResourcePermission when user is not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.resourcePermission.findUnique.mockResolvedValue({ role: 'VIEWER' });
      const result = await service.canRead('ws-1', 'DOCUMENT', 'doc-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false when no access granted', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.resourcePermission.findUnique.mockResolvedValue(null);
      const result = await service.canRead('ws-1', 'DOCUMENT', 'doc-1', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('should return true for EDITOR or higher', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'EDITOR' });
      const result = await service.canEdit('ws-1', 'DOCUMENT', 'doc-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false for VIEWER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'VIEWER' });
      await expect(service.canEdit('ws-1', 'DOCUMENT', 'doc-1', 'user-1')).resolves.toBe(false);
    });
  });

  describe('canComment', () => {
    it('should return true for MEMBER or higher', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      const result = await service.canComment('ws-1', 'DOCUMENT', 'doc-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false for VIEWER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'VIEWER' });
      const result = await service.canComment('ws-1', 'DOCUMENT', 'doc-1', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('requireRead/requireEdit/requireComment', () => {
    it('should not throw when permission granted', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'ADMIN' });
      await expect(
        service.requireRead('ws-1', 'DOCUMENT', 'doc-1', 'user-1'),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when denied', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.resourcePermission.findUnique.mockResolvedValue(null);
      await expect(service.requireRead('ws-1', 'DOCUMENT', 'doc-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

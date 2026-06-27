import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionService } from '../../collab/permission.service';
import { AuditService } from '../../audit/services/audit.service';
import { SharingService } from './sharing.service';

describe('SharingService', () => {
  let service: SharingService;
  let prisma: any;
  let permission: any;
  let audit: any;

  const mockPrisma = {
    resourcePermission: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sharedLink: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPermission = {
    requireEdit: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PermissionService, useValue: mockPermission },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
    prisma = module.get(PrismaService);
    permission = module.get(PermissionService);
    audit = module.get(AuditService);
    jest.clearAllMocks();
  });

  const permFixture = {
    id: 'p-1',
    entityType: 'DOCUMENT',
    entityId: 'doc-1',
    userId: 'user-2',
    role: 'VIEWER',
    workspaceId: 'ws-1',
    createdBy: 'user-1',
    user: { id: 'user-2', name: 'Bob', email: 'bob@test.com', avatarUrl: null },
  };

  describe('createPermission', () => {
    it('should upsert permission with edit check', async () => {
      mockPermission.requireEdit.mockResolvedValue(undefined);
      mockPrisma.resourcePermission.upsert.mockResolvedValue(permFixture);

      const result = await service.createPermission({
        workspaceId: 'ws-1',
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
        userId: 'user-2',
        role: 'VIEWER',
        createdBy: 'user-1',
      });

      expect(mockPermission.requireEdit).toHaveBeenCalledWith(
        'ws-1',
        'DOCUMENT',
        'doc-1',
        'user-1',
      );
      expect(mockPrisma.resourcePermission.upsert).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SHARING_CHANGED' }),
      );
      expect(result.role).toBe('VIEWER');
    });
  });

  describe('listPermissions', () => {
    it('should return permissions for entity', async () => {
      mockPrisma.resourcePermission.findMany.mockResolvedValue([permFixture]);

      const result = await service.listPermissions('DOCUMENT', 'doc-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.resourcePermission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { entityType: 'DOCUMENT', entityId: 'doc-1' } }),
      );
    });
  });

  describe('updatePermission', () => {
    it('should update permission role', async () => {
      mockPrisma.resourcePermission.findUnique.mockResolvedValue(permFixture);
      mockPrisma.resourcePermission.update.mockResolvedValue({ ...permFixture, role: 'EDITOR' });

      const result = await service.updatePermission('p-1', 'EDITOR', 'user-1');

      expect(result.role).toBe('EDITOR');
    });

    it('should throw if permission not found', async () => {
      mockPrisma.resourcePermission.findUnique.mockResolvedValue(null);

      await expect(service.updatePermission('p-1', 'EDITOR', 'user-1')).rejects.toThrow(
        'Permission not found',
      );
    });
  });

  describe('deletePermission', () => {
    it('should delete existing permission', async () => {
      mockPrisma.resourcePermission.findUnique.mockResolvedValue(permFixture);
      mockPrisma.resourcePermission.delete.mockResolvedValue({});

      await service.deletePermission('p-1', 'user-1');

      expect(mockPrisma.resourcePermission.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });
  });

  describe('createLink', () => {
    it('should create a shareable link with generated token', async () => {
      mockPrisma.sharedLink.create.mockResolvedValue({
        id: 'l-1',
        token: 'abc123def456',
        permission: 'VIEWER',
      });

      const result = await service.createLink({
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        createdBy: 'user-1',
      });

      expect(mockPrisma.sharedLink.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: expect.any(String),
            permission: 'VIEWER',
          }),
        }),
      );
      expect(result.token).toBeDefined();
    });
  });

  describe('getLinkByToken', () => {
    it('should return link for valid token', async () => {
      mockPrisma.sharedLink.findUnique.mockResolvedValue({
        id: 'l-1',
        token: 'abc123',
        expiresAt: null,
      });
      mockPrisma.sharedLink.update.mockResolvedValue({});

      const result = await service.getLinkByToken('abc123');

      expect(result.token).toBe('abc123');
      expect(mockPrisma.sharedLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { lastAccessedAt: expect.any(Date) } }),
      );
    });

    it('should throw for expired link', async () => {
      mockPrisma.sharedLink.findUnique.mockResolvedValue({
        token: 'expired',
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.getLinkByToken('expired')).rejects.toThrow('Link expired');
    });

    it('should throw if link not found', async () => {
      mockPrisma.sharedLink.findUnique.mockResolvedValue(null);

      await expect(service.getLinkByToken('missing')).rejects.toThrow('Link not found');
    });
  });

  describe('listLinks', () => {
    it('should list links by entity type', async () => {
      mockPrisma.sharedLink.findMany.mockResolvedValue([
        { id: 'l-1', token: 'abc123', permission: 'VIEWER' },
      ]);

      const result = await service.listLinks('DOCUMENT', 'doc-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.sharedLink.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { documentId: 'doc-1' } }),
      );
    });
  });

  describe('deleteLink', () => {
    it('should delete by id', async () => {
      mockPrisma.sharedLink.delete.mockResolvedValue({});

      await service.deleteLink('l-1');

      expect(mockPrisma.sharedLink.delete).toHaveBeenCalledWith({ where: { id: 'l-1' } });
    });
  });
});

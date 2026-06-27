import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionService } from '../../collab/permission.service';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: any;
  let permission: any;

  const mockPrisma = {
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPermission = {
    requireRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PermissionService, useValue: mockPermission },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prisma = module.get(PrismaService);
    permission = module.get(PermissionService);
    jest.clearAllMocks();
  });

  const teamFixture = {
    id: 'team-1',
    workspaceId: 'ws-1',
    name: 'Engineering',
    description: 'Engineering team',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create team with admin role check', async () => {
      mockPermission.requireRole.mockResolvedValue('ADMIN');
      mockPrisma.team.create.mockResolvedValue(teamFixture);

      const result = await service.create('ws-1', {
        name: 'Engineering',
        createdBy: 'user-1',
      });

      expect(mockPermission.requireRole).toHaveBeenCalledWith('ws-1', 'user-1', 'ADMIN');
      expect(mockPrisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Engineering', workspaceId: 'ws-1' }),
        }),
      );
      expect(result.name).toBe('Engineering');
    });
  });

  describe('list', () => {
    it('should list teams with members', async () => {
      mockPrisma.team.findMany.mockResolvedValue([
        {
          ...teamFixture,
          members: [{ user: { id: 'user-1', name: 'Alice' } }],
        },
      ]);

      const result = await service.list('ws-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          include: expect.objectContaining({
            members: expect.objectContaining({
              include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
            }),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update team with admin check', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(teamFixture);
      mockPermission.requireRole.mockResolvedValue('ADMIN');
      mockPrisma.team.update.mockResolvedValue({ ...teamFixture, name: 'Design' });

      const result = await service.update('team-1', { name: 'Design' }, 'user-1');

      expect(mockPrisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'team-1' }, data: { name: 'Design' } }),
      );
      expect(result.name).toBe('Design');
    });

    it('should throw if team not found', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(null);

      await expect(service.update('team-1', { name: 'Design' }, 'user-1')).rejects.toThrow(
        'Team not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete team with admin check', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(teamFixture);
      mockPermission.requireRole.mockResolvedValue('ADMIN');
      mockPrisma.team.delete.mockResolvedValue(teamFixture);

      await service.delete('team-1', 'user-1');

      expect(mockPrisma.team.delete).toHaveBeenCalledWith({ where: { id: 'team-1' } });
    });
  });

  describe('addMember', () => {
    it('should upsert team member with admin check', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(teamFixture);
      mockPermission.requireRole.mockResolvedValue('ADMIN');
      mockPrisma.teamMember.upsert.mockResolvedValue({
        id: 'tm-1',
        teamId: 'team-1',
        userId: 'user-2',
        role: 'MEMBER',
      });

      const result = await service.addMember('team-1', 'user-2', 'MEMBER', 'user-1');

      expect(mockPrisma.teamMember.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId_userId: { teamId: 'team-1', userId: 'user-2' } },
          create: { teamId: 'team-1', userId: 'user-2', role: 'MEMBER' },
        }),
      );
      expect(result.role).toBe('MEMBER');
    });
  });

  describe('removeMember', () => {
    it('should remove team member with admin check', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(teamFixture);
      mockPermission.requireRole.mockResolvedValue('ADMIN');
      mockPrisma.teamMember.delete.mockResolvedValue({});

      await service.removeMember('team-1', 'user-2', 'user-1');

      expect(mockPrisma.teamMember.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId_userId: { teamId: 'team-1', userId: 'user-2' } },
        }),
      );
    });
  });
});

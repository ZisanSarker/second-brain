import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionService } from '../../collab/permission.service';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private permission: PermissionService,
  ) {}

  async create(
    workspaceId: string,
    data: { name: string; description?: string; createdBy: string },
  ) {
    await this.permission.requireRole(workspaceId, data.createdBy, 'ADMIN');
    return this.prisma.team.create({ data: { ...data, workspaceId } });
  }

  async list(workspaceId: string) {
    return this.prisma.team.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
        },
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string }, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new Error('Team not found');
    await this.permission.requireRole(team.workspaceId, userId, 'ADMIN');
    return this.prisma.team.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new Error('Team not found');
    await this.permission.requireRole(team.workspaceId, userId, 'ADMIN');
    await this.prisma.team.delete({ where: { id } });
  }

  async addMember(teamId: string, userId: string, role: string, actorId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new Error('Team not found');
    await this.permission.requireRole(team.workspaceId, actorId, 'ADMIN');

    return this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId, role },
      update: { role },
    });
  }

  async removeMember(teamId: string, userId: string, actorId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new Error('Team not found');
    await this.permission.requireRole(team.workspaceId, actorId, 'ADMIN');

    await this.prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
  }
}

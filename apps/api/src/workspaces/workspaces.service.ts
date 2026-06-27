import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('A workspace with this slug already exists');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        settings: {
          create: {},
        },
      },
      include: {
        members: true,
        settings: true,
      },
    });

    return workspace;
  }

  async findByUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true, documents: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.createdAt,
      memberCount: m.workspace._count.members,
      documentCount: m.workspace._count.documents,
    }));
  }

  async findById(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: { members: true, documents: true, conversations: true },
        },
        settings: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return { ...workspace, role: member.role };
  }

  async update(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.requireRole(workspaceId, userId, 'ADMIN');

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.slug) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== workspaceId) {
        throw new ConflictException('Slug already taken');
      }
      data.slug = dto.slug;
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });
  }

  async delete(workspaceId: string, userId: string) {
    await this.requireRole(workspaceId, userId, 'OWNER');

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });
  }

  async getSettings(workspaceId: string, userId: string) {
    await this.requireRole(workspaceId, userId, 'VIEWER');

    let settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings) {
      settings = await this.prisma.workspaceSettings.create({
        data: { workspaceId },
      });
    }

    return settings;
  }

  async updateSettings(workspaceId: string, userId: string, dto: UpdateWorkspaceSettingsDto) {
    await this.requireRole(workspaceId, userId, 'ADMIN');

    const data: Record<string, unknown> = {};
    if (dto.aiModel !== undefined) data.aiModel = dto.aiModel;
    if (dto.embeddingModel !== undefined) data.embeddingModel = dto.embeddingModel;
    if (dto.chunkSize !== undefined) data.chunkSize = dto.chunkSize;
    if (dto.chunkOverlap !== undefined) data.chunkOverlap = dto.chunkOverlap;
    if (dto.maxTokens !== undefined) data.maxTokens = dto.maxTokens;
    if (dto.temperature !== undefined) data.temperature = dto.temperature;

    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    });
  }

  async getMembers(workspaceId: string, userId: string) {
    await this.requireRole(workspaceId, userId, 'VIEWER');

    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async updateMemberRole(workspaceId: string, userId: string, targetUserId: string, role: string) {
    await this.requireRole(workspaceId, userId, 'ADMIN');

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the owner role');
    }

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role: role as any },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(workspaceId: string, userId: string, targetUserId: string) {
    await this.requireRole(workspaceId, userId, 'ADMIN');

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
  }

  async addMemberByEmail(workspaceId: string, userId: string, email: string, role?: string) {
    await this.requireRole(workspaceId, userId, 'ADMIN');

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: (role as any) || 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async getMyMembership(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Not a member of this workspace');
    }

    return member;
  }

  private async requireRole(workspaceId: string, userId: string, minimumRole: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    const hierarchy: Record<string, number> = {
      VIEWER: 20,
      MEMBER: 40,
      EDITOR: 60,
      ADMIN: 80,
      OWNER: 100,
    };

    if ((hierarchy[member.role] ?? 0) < (hierarchy[minimumRole] ?? 0)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, userId: string, dto: CreateTagDto) {
    await this.requireEditor(workspaceId, userId);

    const existing = await this.prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name: dto.name } },
    });
    if (existing) throw new ConflictException('Tag with this name already exists');

    return this.prisma.tag.create({
      data: {
        workspaceId,
        name: dto.name,
        color: dto.color || '#6B7280',
      },
    });
  }

  async findAll(workspaceId: string, userId: string) {
    await this.requireMember(workspaceId, userId);

    return this.prisma.tag.findMany({
      where: { workspaceId },
      include: { _count: { select: { documents: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async update(workspaceId: string, tagId: string, userId: string, dto: UpdateTagDto) {
    await this.requireEditor(workspaceId, userId);

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    if (dto.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { workspaceId_name: { workspaceId, name: dto.name } },
      });
      if (existing && existing.id !== tagId) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    return this.prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
      include: { _count: { select: { documents: true } } },
    });
  }

  async delete(workspaceId: string, tagId: string, userId: string) {
    await this.requireEditor(workspaceId, userId);

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    // Disconnect from all documents first
    await this.prisma.document.updateMany({
      where: { tags: { some: { id: tagId } } },
      data: { tags: { disconnect: { id: tagId } } },
    });

    return this.prisma.tag.delete({ where: { id: tagId } });
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }

  private async requireEditor(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    const hierarchy: Record<string, number> = {
      VIEWER: 20,
      MEMBER: 40,
      EDITOR: 60,
      ADMIN: 80,
      OWNER: 100,
    };
    if ((hierarchy[member.role] ?? 0) < 60) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}

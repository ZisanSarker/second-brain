import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, userId: string, dto: CreateCollectionDto) {
    await this.requireMember(workspaceId, userId);
    return this.prisma.collection.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
      },
      include: { _count: { select: { documents: true } } },
    });
  }

  async findAll(workspaceId: string, userId: string) {
    await this.requireMember(workspaceId, userId);
    return this.prisma.collection.findMany({
      where: { workspaceId, deletedAt: null, archivedAt: null },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, collectionId: string, userId: string) {
    await this.requireMember(workspaceId, userId);
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, workspaceId, deletedAt: null },
      include: {
        _count: { select: { documents: true } },
        documents: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            fileType: true,
            fileSize: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async update(
    workspaceId: string,
    collectionId: string,
    userId: string,
    dto: UpdateCollectionDto,
  ) {
    await this.requireEditor(workspaceId, userId);
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, workspaceId, deletedAt: null },
    });
    if (!collection) throw new NotFoundException('Collection not found');

    return this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: { _count: { select: { documents: true } } },
    });
  }

  async archive(workspaceId: string, collectionId: string, userId: string) {
    await this.requireEditor(workspaceId, userId);
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, workspaceId, deletedAt: null },
    });
    if (!collection) throw new NotFoundException('Collection not found');

    return this.prisma.collection.update({
      where: { id: collectionId },
      data: { archivedAt: new Date() },
    });
  }

  async restore(workspaceId: string, collectionId: string, userId: string) {
    await this.requireEditor(workspaceId, userId);
    return this.prisma.collection.update({
      where: { id: collectionId },
      data: { archivedAt: null, deletedAt: null },
    });
  }

  async softDelete(workspaceId: string, collectionId: string, userId: string) {
    await this.requireEditor(workspaceId, userId);
    return this.prisma.collection.update({
      where: { id: collectionId },
      data: { deletedAt: new Date() },
    });
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

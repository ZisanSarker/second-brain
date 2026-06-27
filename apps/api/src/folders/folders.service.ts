import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, userId: string, dto: CreateFolderDto) {
    await this.requireEditor(workspaceId, userId);

    if (dto.parentId) {
      const parent = await this.prisma.folder.findFirst({
        where: { id: dto.parentId, workspaceId, deletedAt: null },
      });
      if (!parent) throw new NotFoundException('Parent folder not found');
    }

    return this.prisma.folder.create({
      data: {
        workspaceId,
        name: dto.name,
        parentId: dto.parentId || null,
      },
      include: { _count: { select: { documents: true, children: true } } },
    });
  }

  async findAll(workspaceId: string, userId: string) {
    await this.requireMember(workspaceId, userId);
    return this.prisma.folder.findMany({
      where: { workspaceId },
      include: { _count: { select: { documents: true, children: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getTree(workspaceId: string, userId: string) {
    await this.requireMember(workspaceId, userId);

    const folders = await this.prisma.folder.findMany({
      where: { workspaceId },
      include: { _count: { select: { documents: true, children: true } } },
      orderBy: { name: 'asc' },
    });

    return this.buildTree(folders);
  }

  async findOne(workspaceId: string, folderId: string, userId: string) {
    await this.requireMember(workspaceId, userId);
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, workspaceId },
      include: {
        children: {
          include: { _count: { select: { documents: true, children: true } } },
          orderBy: { name: 'asc' },
        },
        _count: { select: { documents: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async update(workspaceId: string, folderId: string, userId: string, dto: UpdateFolderDto) {
    await this.requireEditor(workspaceId, userId);
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, workspaceId },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: { _count: { select: { documents: true, children: true } } },
    });
  }

  async delete(workspaceId: string, folderId: string, userId: string) {
    await this.requireEditor(workspaceId, userId);

    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, workspaceId },
      include: { _count: { select: { children: true } } },
    });
    if (!folder) throw new NotFoundException('Folder not found');

    // Unset folderId for documents in this folder
    await this.prisma.document.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    // Reparent child folders to parent
    if (folder.parentId) {
      await this.prisma.folder.updateMany({
        where: { parentId: folderId },
        data: { parentId: folder.parentId },
      });
    } else {
      await this.prisma.folder.updateMany({
        where: { parentId: folderId },
        data: { parentId: null },
      });
    }

    return this.prisma.folder.delete({ where: { id: folderId } });
  }

  private buildTree(folders: any[], parentId: string | null = null): any[] {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        ...f,
        children: this.buildTree(folders, f.id),
      }));
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

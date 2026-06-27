import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { ROLE_HIERARCHY } from '../shared/constants/role-hierarchy';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return member?.role ?? null;
  }

  async requireWorkspaceAccess(workspaceId: string, userId: string) {
    const role = await this.getMemberRole(workspaceId, userId);
    if (!role) throw new ForbiddenException('Not a member of this workspace');
    return role;
  }

  async requireRole(workspaceId: string, userId: string, minimumRole: string) {
    const role = await this.requireWorkspaceAccess(workspaceId, userId);
    const userLevel = ROLE_HIERARCHY[role] ?? 0;
    const minLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
    if (userLevel < minLevel) {
      throw new ForbiddenException(`Requires ${minimumRole} role or higher`);
    }
    return role;
  }

  async canRead(
    workspaceId: string,
    entityType: string,
    entityId: string,
    userId: string,
  ): Promise<boolean> {
    const role = await this.getMemberRole(workspaceId, userId);
    if (role && (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.VIEWER) return true;

    const perm = await this.prisma.resourcePermission.findUnique({
      where: { entityType_entityId_userId: { entityType, entityId, userId } },
    });
    if (perm && (ROLE_HIERARCHY[perm.role] ?? 0) >= ROLE_HIERARCHY.VIEWER) return true;

    return false;
  }

  async canEdit(
    workspaceId: string,
    entityType: string,
    entityId: string,
    userId: string,
  ): Promise<boolean> {
    const role = await this.getMemberRole(workspaceId, userId);
    if (role && (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.EDITOR) return true;

    const perm = await this.prisma.resourcePermission.findUnique({
      where: { entityType_entityId_userId: { entityType, entityId, userId } },
    });
    if (perm && (ROLE_HIERARCHY[perm.role] ?? 0) >= ROLE_HIERARCHY.EDITOR) return true;

    return false;
  }

  async canComment(
    workspaceId: string,
    entityType: string,
    entityId: string,
    userId: string,
  ): Promise<boolean> {
    if (!(await this.canRead(workspaceId, entityType, entityId, userId))) return false;

    const role = await this.getMemberRole(workspaceId, userId);
    if (role && (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.MEMBER) return true;

    const perm = await this.prisma.resourcePermission.findUnique({
      where: { entityType_entityId_userId: { entityType, entityId, userId } },
    });
    if (perm && (ROLE_HIERARCHY[perm.role] ?? 0) >= ROLE_HIERARCHY.COMMENTER) return true;

    return false;
  }

  async requireRead(workspaceId: string, entityType: string, entityId: string, userId: string) {
    if (!(await this.canRead(workspaceId, entityType, entityId, userId))) {
      throw new ForbiddenException('No read access');
    }
  }

  async requireEdit(workspaceId: string, entityType: string, entityId: string, userId: string) {
    if (!(await this.canEdit(workspaceId, entityType, entityId, userId))) {
      throw new ForbiddenException('No edit access');
    }
  }

  async requireComment(workspaceId: string, entityType: string, entityId: string, userId: string) {
    if (!(await this.canComment(workspaceId, entityType, entityId, userId))) {
      throw new ForbiddenException('No comment access');
    }
  }
}

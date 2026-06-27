import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../shared/services/prisma.service';
import { CacheService } from '../../shared/services/cache.service';
import { ROLE_HIERARCHY } from '../../shared/constants/role-hierarchy';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const workspaceId = request.headers['x-workspace-id'] || request.params?.workspaceId;

    if (!userId || !workspaceId) {
      return false;
    }

    const cacheKey = `role:${workspaceId}:${userId}`;
    let memberRole = await this.cache.get<string>(cacheKey);

    if (!memberRole) {
      const member = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
      });

      if (!member) {
        return false;
      }

      memberRole = member.role;
      await this.cache.set(cacheKey, memberRole, 30);
    }

    const userLevel = ROLE_HIERARCHY[memberRole] ?? 0;
    const requiredLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));

    return userLevel >= requiredLevel;
  }
}

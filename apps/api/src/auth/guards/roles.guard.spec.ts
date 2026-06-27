import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../../shared/services/prisma.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: any;
  let prisma: any;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrisma = {
    workspaceMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    reflector = mockReflector;
    prisma = mockPrisma;
    guard = new RolesGuard(reflector, prisma);
    jest.clearAllMocks();
  });

  const mockContext = (userId?: string, workspaceId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: userId ? { id: userId } : undefined,
          params: workspaceId ? { workspaceId } : {},
        }),
      }),
      getHandler: () => {},
      getClass: () => {},
    }) as any;

  it('should return true if no roles required', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(true);
  });

  it('should return true if required roles is empty array', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);

    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(true);
  });

  it('should return false if no user on request', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const result = await guard.canActivate(mockContext(undefined, 'ws-1'));

    expect(result).toBe(false);
  });

  it('should return false if no workspaceId in params', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const result = await guard.canActivate(mockContext('user-1', undefined));

    expect(result).toBe(false);
  });

  it('should return false if user is not a member', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['VIEWER']);
    mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(false);
  });

  it('should return true if user has sufficient role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['EDITOR']);
    mockPrisma.workspaceMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      role: 'ADMIN',
    });

    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(true);
  });

  it('should return false if user has insufficient role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['EDITOR']);
    mockPrisma.workspaceMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      role: 'VIEWER',
    });

    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(false);
  });

  it('should handle multiple required roles and use minimum level', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'EDITOR']);
    mockPrisma.workspaceMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      role: 'EDITOR',
    });

    // EDITOR = 60, minimum of [ADMIN=80, EDITOR=60] = 60 → user has 60 >= 60
    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(true);
  });

  it('should return false if user role is not in hierarchy', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    mockPrisma.workspaceMember.findUnique.mockResolvedValue({
      userId: 'user-1',
      role: 'UNKNOWN',
    });

    const result = await guard.canActivate(mockContext('user-1', 'ws-1'));

    expect(result).toBe(false);
  });
});

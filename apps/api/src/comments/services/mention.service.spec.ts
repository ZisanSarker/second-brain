import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { MentionService } from './mention.service';

describe('MentionService', () => {
  let service: MentionService;
  let prisma: any;

  const mockPrisma = {
    user: { findMany: jest.fn() },
    mention: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MentionService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MentionService>(MentionService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should parse @usernames and create mention records', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-2', name: 'Bob' }]);
    mockPrisma.mention.create.mockResolvedValue({ id: 'm-1' });

    const result = await service.parseAndCreate(
      'ws-1',
      'COMMENT',
      'cm-1',
      'Hey @Bob check this out',
      'user-1',
    );

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { equals: 'Bob', mode: 'insensitive' } }),
          ]),
        }),
      }),
    );
    expect(mockPrisma.mention.create).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no @usernames found', async () => {
    const result = await service.parseAndCreate(
      'ws-1',
      'COMMENT',
      'cm-1',
      'No mentions here',
      'user-1',
    );

    expect(result).toEqual([]);
    expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
  });

  it('should filter users to workspace members', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.mention.create.mockResolvedValue({});

    const result = await service.parseAndCreate(
      'ws-1',
      'COMMENT',
      'cm-1',
      'Hello @Alice and @Bob',
      'user-1',
    );

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberships: { some: { workspaceId: 'ws-1' } },
        }),
      }),
    );
  });
});

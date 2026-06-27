import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { PermissionService } from '../../collab/permission.service';
import { MentionService } from './mention.service';
import { AuditService } from '../../audit/services/audit.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: any;
  let permission: any;
  let mentionService: any;
  let audit: any;

  const mockPrisma = {
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    reaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPermission = {
    requireComment: jest.fn(),
    requireRead: jest.fn(),
  };

  const mockMentionService = {
    parseAndCreate: jest.fn().mockResolvedValue([]),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PermissionService, useValue: mockPermission },
        { provide: MentionService, useValue: mockMentionService },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prisma = module.get(PrismaService);
    permission = module.get(PermissionService);
    mentionService = module.get(MentionService);
    audit = module.get(AuditService);
    jest.clearAllMocks();
  });

  const commentFixture = {
    id: 'cm-1',
    workspaceId: 'ws-1',
    documentId: 'doc-1',
    userId: 'user-1',
    content: 'Great document!',
    parentId: null,
    deletedAt: null,
    editedAt: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', name: 'Alice', avatarUrl: null },
  };

  describe('create', () => {
    it('should create a comment with permission check', async () => {
      mockPermission.requireComment.mockResolvedValue(undefined);
      mockPrisma.comment.create.mockResolvedValue(commentFixture);
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);

      const result = (await service.create({
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        userId: 'user-1',
        content: 'Great document!',
      }))!;

      expect(mockPermission.requireComment).toHaveBeenCalledWith(
        'ws-1',
        'DOCUMENT',
        'doc-1',
        'user-1',
      );
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ content: 'Great document!' }) }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMMENT_ADDED' }),
      );
      expect(result.content).toBe('Great document!');
    });

    it('should create a reply when parentId is provided', async () => {
      mockPermission.requireComment.mockResolvedValue(undefined);
      const reply = { ...commentFixture, id: 'cm-2', parentId: 'cm-1' };
      mockPrisma.comment.create.mockResolvedValue(reply);
      mockPrisma.comment.findUnique.mockResolvedValue(reply);

      const result = (await service.create({
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        userId: 'user-1',
        content: 'Reply!',
        parentId: 'cm-1',
      }))!;

      expect(result.parentId).toBe('cm-1');
    });

    it('should parse mentions in content', async () => {
      mockPermission.requireComment.mockResolvedValue(undefined);
      mockPrisma.comment.create.mockResolvedValue(commentFixture);
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);

      await service.create({
        workspaceId: 'ws-1',
        documentId: 'doc-1',
        userId: 'user-1',
        content: 'Hey @Bob check this out',
      });

      expect(mockMentionService.parseAndCreate).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return top-level comments with replies', async () => {
      const commentWithReplies = {
        ...commentFixture,
        replies: [{ id: 'cm-2', content: 'Reply', user: { id: 'user-2', name: 'Bob' } }],
      };
      mockPrisma.comment.findMany.mockResolvedValue([
        commentWithReplies,
        { ...commentFixture, id: 'cm-3', parentId: 'cm-1' },
      ]);

      const result = await service.list('DOCUMENT', 'doc-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cm-1');
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { documentId: 'doc-1', deletedAt: null } }),
      );
    });
  });

  describe('update', () => {
    it('should update own comment content', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      mockPrisma.comment.update.mockResolvedValue({
        ...commentFixture,
        content: 'Updated',
        editedAt: new Date(),
      });

      const result = await service.update('cm-1', 'Updated', 'user-1');

      expect(result.content).toBe('Updated');
      expect(result.editedAt).toBeDefined();
    });

    it('should throw for non-owner', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      await expect(service.update('cm-1', 'Updated', 'user-2')).rejects.toThrow('Not authorized');
    });

    it('should throw for deleted comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ ...commentFixture, deletedAt: new Date() });
      await expect(service.update('cm-1', 'Updated', 'user-1')).rejects.toThrow('Comment deleted');
    });
  });

  describe('softDelete', () => {
    it('should soft delete own comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      mockPrisma.comment.update.mockResolvedValue({
        ...commentFixture,
        deletedAt: new Date(),
        content: '[deleted]',
      });

      const result = await service.softDelete('cm-1', 'user-1');

      expect(result.deletedAt).toBeDefined();
      expect(result.content).toBe('[deleted]');
    });

    it('should throw for non-owner', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      await expect(service.softDelete('cm-1', 'user-2')).rejects.toThrow('Not authorized');
    });
  });

  describe('resolve', () => {
    it('should resolve own comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      mockPrisma.comment.update.mockResolvedValue({
        ...commentFixture,
        resolvedAt: new Date(),
        resolvedBy: 'user-1',
      });

      const result = await service.resolve('cm-1', 'user-1');

      expect(result.resolvedAt).toBeDefined();
    });

    it('should throw for non-owner trying to resolve', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      await expect(service.resolve('cm-1', 'user-2')).rejects.toThrow(
        'Only the comment author can resolve',
      );
    });
  });

  describe('addReaction', () => {
    it('should add reaction to non-deleted comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(commentFixture);
      mockPrisma.reaction.create.mockResolvedValue({ id: 'r-1', userId: 'user-1', type: 'LIKE' });

      const result = await service.addReaction('cm-1', 'user-1', 'LIKE');

      expect(mockPrisma.reaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'LIKE' }) }),
      );
    });

    it('should throw for deleted comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ ...commentFixture, deletedAt: new Date() });
      await expect(service.addReaction('cm-1', 'user-1', 'LIKE')).rejects.toThrow(
        'Comment not found',
      );
    });
  });

  describe('removeReaction', () => {
    it('should remove existing reaction', async () => {
      mockPrisma.reaction.findUnique.mockResolvedValue({ id: 'r-1' });
      mockPrisma.reaction.delete.mockResolvedValue({});

      await service.removeReaction('cm-1', 'user-1', 'LIKE');

      expect(mockPrisma.reaction.delete).toHaveBeenCalledWith({ where: { id: 'r-1' } });
    });

    it('should do nothing if reaction does not exist', async () => {
      mockPrisma.reaction.findUnique.mockResolvedValue(null);

      await service.removeReaction('cm-1', 'user-1', 'LIKE');

      expect(mockPrisma.reaction.delete).not.toHaveBeenCalled();
    });
  });
});

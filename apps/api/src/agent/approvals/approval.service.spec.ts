import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { ExecutionService } from '../execution.service';
import { ApprovalService } from './approval.service';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let prisma: any;
  let executionService: any;

  const mockPrisma = {
    approval: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockExecutionService = {
    updateStatus: jest.fn(),
  };

  const approvalFixture = {
    id: 'app-1',
    workspaceId: 'ws-1',
    executionId: 'exec-1',
    stepId: null,
    requestedBy: 'user-1',
    assignedTo: 'user-2',
    action: 'APPROVE_ACTION',
    context: { action: 'delete_document', documentId: 'doc-1' },
    status: 'PENDING',
    modification: null,
    decidedBy: null,
    decidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ExecutionService, useValue: mockExecutionService },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    prisma = module.get(PrismaService);
    executionService = module.get(ExecutionService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create PENDING approval', async () => {
      mockPrisma.approval.create.mockResolvedValue(approvalFixture);

      const result = await service.create({
        workspaceId: 'ws-1',
        executionId: 'exec-1',
        requestedBy: 'user-1',
        assignedTo: 'user-2',
        action: 'APPROVE_ACTION',
        context: { action: 'delete_document', documentId: 'doc-1' },
      });

      expect(mockPrisma.approval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            workspaceId: 'ws-1',
            context: { action: 'delete_document', documentId: 'doc-1' },
          }),
        }),
      );
      expect(result.status).toBe('PENDING');
    });

    it('should default context to empty object', async () => {
      mockPrisma.approval.create.mockResolvedValue({ ...approvalFixture, context: {} });

      await service.create({
        workspaceId: 'ws-1',
        action: 'APPROVE_ACTION',
        context: undefined,
      });

      expect(mockPrisma.approval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ context: {} }),
        }),
      );
    });
  });

  describe('list', () => {
    it('should return pending approvals by default', async () => {
      mockPrisma.approval.findMany.mockResolvedValue([approvalFixture]);

      const result = await service.list('ws-1');

      expect(mockPrisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1', status: 'PENDING' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by specific status when provided', async () => {
      mockPrisma.approval.findMany.mockResolvedValue([]);

      await service.list('ws-1', 'APPROVED');

      expect(mockPrisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1', status: 'APPROVED' },
        }),
      );
    });
  });

  describe('getById', () => {
    it('should return approval by id and workspace', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue(approvalFixture);

      const result = await service.getById('ws-1', 'app-1');

      expect(mockPrisma.approval.findFirst).toHaveBeenCalledWith({
        where: { id: 'app-1', workspaceId: 'ws-1' },
      });
      expect(result.id).toBe('app-1');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue(null);

      await expect(service.getById('ws-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should set APPROVED and update execution status to RUNNING', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue(approvalFixture);
      mockPrisma.approval.update.mockResolvedValue({
        ...approvalFixture,
        status: 'APPROVED',
        decidedBy: 'user-2',
        decidedAt: new Date(),
      });

      const result = await service.approve('ws-1', 'app-1', 'user-2');

      expect(mockPrisma.approval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({
            status: 'APPROVED',
            decidedBy: 'user-2',
            decidedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockExecutionService.updateStatus).toHaveBeenCalledWith('exec-1', 'RUNNING');
      expect(result.status).toBe('APPROVED');
    });

    it('should throw if already approved', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue({ ...approvalFixture, status: 'APPROVED' });

      await expect(service.approve('ws-1', 'app-1', 'user-2')).rejects.toThrow(
        'Approval is not pending',
      );
    });
  });

  describe('reject', () => {
    it('should set REJECTED and update execution status to CANCELLED', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue(approvalFixture);
      mockPrisma.approval.update.mockResolvedValue({
        ...approvalFixture,
        status: 'REJECTED',
        decidedBy: 'user-2',
        decidedAt: new Date(),
      });

      const result = await service.reject('ws-1', 'app-1', 'user-2');

      expect(mockPrisma.approval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({
            status: 'REJECTED',
            decidedBy: 'user-2',
            decidedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockExecutionService.updateStatus).toHaveBeenCalledWith('exec-1', 'CANCELLED');
      expect(result.status).toBe('REJECTED');
    });

    it('should throw if already approved', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue({ ...approvalFixture, status: 'APPROVED' });

      await expect(service.reject('ws-1', 'app-1', 'user-2')).rejects.toThrow(
        'Approval is not pending',
      );
    });
  });

  describe('modify', () => {
    it('should set MODIFIED and update execution status to RUNNING', async () => {
      const modification = { input: 'modified input' };
      mockPrisma.approval.findFirst.mockResolvedValue(approvalFixture);
      mockPrisma.approval.update.mockResolvedValue({
        ...approvalFixture,
        status: 'MODIFIED',
        modification,
        decidedBy: 'user-2',
        decidedAt: new Date(),
      });

      const result = await service.modify('ws-1', 'app-1', 'user-2', modification);

      expect(mockPrisma.approval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({
            status: 'MODIFIED',
            modification,
            decidedBy: 'user-2',
            decidedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockExecutionService.updateStatus).toHaveBeenCalledWith('exec-1', 'RUNNING');
      expect(result.status).toBe('MODIFIED');
    });

    it('should throw if not pending', async () => {
      mockPrisma.approval.findFirst.mockResolvedValue({ ...approvalFixture, status: 'APPROVED' });

      await expect(service.modify('ws-1', 'app-1', 'user-2', {})).rejects.toThrow(
        'Approval is not pending',
      );
    });
  });
});

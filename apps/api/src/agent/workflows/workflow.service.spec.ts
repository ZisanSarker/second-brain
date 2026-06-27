import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let prisma: any;

  const mockPrisma = {
    workflow: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const workflowFixture = {
    id: 'wf-1',
    workspaceId: 'ws-1',
    name: 'Test Workflow',
    description: 'A test workflow',
    steps: [],
    trigger: { type: 'MANUAL' },
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create workflow with default trigger MANUAL', async () => {
      mockPrisma.workflow.create.mockResolvedValue(workflowFixture);

      const result = await service.create('ws-1', {
        name: 'Test Workflow',
        description: 'A test workflow',
        createdBy: 'user-1',
      });

      expect(mockPrisma.workflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            name: 'Test Workflow',
            description: 'A test workflow',
            trigger: { type: 'MANUAL' },
            createdBy: 'user-1',
          }),
        }),
      );
      expect(result.trigger).toEqual({ type: 'MANUAL' });
    });

    it('should accept custom trigger', async () => {
      const customTrigger = { type: 'SCHEDULED', cron: '0 0 * * *' };
      mockPrisma.workflow.create.mockResolvedValue({ ...workflowFixture, trigger: customTrigger });

      const result = await service.create('ws-1', {
        name: 'Scheduled Workflow',
        trigger: customTrigger,
        createdBy: 'user-1',
      });

      expect(result.trigger).toEqual(customTrigger);
    });

    it('should default steps to empty array', async () => {
      mockPrisma.workflow.create.mockResolvedValue(workflowFixture);

      await service.create('ws-1', { name: 'Test', createdBy: 'user-1' });

      expect(mockPrisma.workflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ steps: [] }),
        }),
      );
    });
  });

  describe('list', () => {
    it('should return all workspace workflows ordered by createdAt desc', async () => {
      const workflows = [workflowFixture, { ...workflowFixture, id: 'wf-2' }];
      mockPrisma.workflow.findMany.mockResolvedValue(workflows);

      const result = await service.list('ws-1');

      expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no workflows', async () => {
      mockPrisma.workflow.findMany.mockResolvedValue([]);

      const result = await service.list('ws-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return workflow by id and workspace', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(workflowFixture);

      const result = await service.getById('ws-1', 'wf-1');

      expect(mockPrisma.workflow.findFirst).toHaveBeenCalledWith({
        where: { id: 'wf-1', workspaceId: 'ws-1' },
      });
      expect(result.id).toBe('wf-1');
    });

    it('should throw NotFoundException for wrong workspace', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      await expect(service.getById('ws-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update workflow fields', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(workflowFixture);
      mockPrisma.workflow.update.mockResolvedValue({
        ...workflowFixture,
        name: 'Updated',
        description: 'New desc',
      });

      const result = await service.update('ws-1', 'wf-1', {
        name: 'Updated',
        description: 'New desc',
      });

      expect(mockPrisma.workflow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wf-1' },
          data: { name: 'Updated', description: 'New desc' },
        }),
      );
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if workflow does not exist', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      await expect(service.update('ws-1', 'nonexistent', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should remove workflow', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(workflowFixture);
      mockPrisma.workflow.delete.mockResolvedValue(workflowFixture);

      await service.delete('ws-1', 'wf-1');

      expect(mockPrisma.workflow.delete).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
      });
    });

    it('should throw NotFoundException if workflow does not exist', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      await expect(service.delete('ws-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});

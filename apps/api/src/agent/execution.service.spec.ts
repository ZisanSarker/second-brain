import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { ExecutionService } from './execution.service';

describe('ExecutionService', () => {
  let service: ExecutionService;
  let prisma: any;

  const mockPrisma = {
    agentExecution: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    agentExecutionStep: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const executionFixture = {
    id: 'exec-1',
    workspaceId: 'ws-1',
    agentId: null,
    userId: 'user-1',
    type: 'CHAT',
    status: 'QUEUED',
    input: { message: 'hello' },
    output: null,
    plan: null,
    metadata: {},
    tokenUsage: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutionService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create execution with QUEUED status', async () => {
      mockPrisma.agentExecution.create.mockResolvedValue(executionFixture);

      const result = await service.create({
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'CHAT',
        input: { message: 'hello' },
      });

      expect(mockPrisma.agentExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            status: 'QUEUED',
            input: { message: 'hello' },
          }),
        }),
      );
      expect(result.status).toBe('QUEUED');
    });

    it('should set default empty objects for input and metadata', async () => {
      mockPrisma.agentExecution.create.mockResolvedValue(executionFixture);

      await service.create({
        workspaceId: 'ws-1',
        type: 'CHAT',
        input: undefined,
        metadata: undefined,
      });

      expect(mockPrisma.agentExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ input: {}, metadata: {} }),
        }),
      );
    });
  });

  describe('getById', () => {
    it('should return execution with steps and approvals', async () => {
      const fullExecution = {
        ...executionFixture,
        steps: [{ id: 'step-1', stepIndex: 0, status: 'COMPLETED' }],
        approvals: [{ id: 'app-1', status: 'PENDING' }],
      };
      mockPrisma.agentExecution.findFirst.mockResolvedValue(fullExecution);

      const result = await service.getById('ws-1', 'exec-1');

      expect(mockPrisma.agentExecution.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1', workspaceId: 'ws-1' },
          include: expect.objectContaining({
            steps: expect.any(Object),
            approvals: true,
          }),
        }),
      );
      expect(result.steps).toHaveLength(1);
      expect(result.approvals).toHaveLength(1);
    });

    it('should throw NotFoundException for wrong workspace', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue(null);

      await expect(service.getById('ws-1', 'exec-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent execution', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue(null);

      await expect(service.getById('ws-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      mockPrisma.agentExecution.findMany.mockResolvedValue([executionFixture]);
      mockPrisma.agentExecution.count.mockResolvedValue(1);

      const result = await service.list('ws-1', {});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.agentExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: 'ws-1' } }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.agentExecution.findMany.mockResolvedValue([]);
      mockPrisma.agentExecution.count.mockResolvedValue(0);

      await service.list('ws-1', { status: 'RUNNING' });

      expect(mockPrisma.agentExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'RUNNING' }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrisma.agentExecution.findMany.mockResolvedValue([]);
      mockPrisma.agentExecution.count.mockResolvedValue(0);

      await service.list('ws-1', { type: 'CHAT' });

      expect(mockPrisma.agentExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'CHAT' }),
        }),
      );
    });

    it('should respect pagination params', async () => {
      mockPrisma.agentExecution.findMany.mockResolvedValue([]);
      mockPrisma.agentExecution.count.mockResolvedValue(0);

      await service.list('ws-1', { limit: 10, offset: 20 });

      expect(mockPrisma.agentExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 20 }),
      );
    });

    it('should use default limit and offset', async () => {
      mockPrisma.agentExecution.findMany.mockResolvedValue([]);
      mockPrisma.agentExecution.count.mockResolvedValue(0);

      await service.list('ws-1', {});

      expect(mockPrisma.agentExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should set startedAt when RUNNING', async () => {
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'RUNNING',
        startedAt: new Date(),
      });

      await service.updateStatus('exec-1', 'RUNNING');

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1' },
          data: expect.objectContaining({
            status: 'RUNNING',
            startedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should set completedAt when terminal status', async () => {
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      await service.updateStatus('exec-1', 'COMPLETED');

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should include error when provided', async () => {
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'FAILED',
        error: 'Something went wrong',
      });

      await service.updateStatus('exec-1', 'FAILED', 'Something went wrong');

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ error: 'Something went wrong' }),
        }),
      );
    });
  });

  describe('updateOutput', () => {
    it('should set output, tokenUsage, and COMPLETED status', async () => {
      const tokenUsage = { prompt: 10, completion: 20, total: 30 };
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'COMPLETED',
        output: { result: 'done' },
        tokenUsage,
      });

      const result = await service.updateOutput('exec-1', { result: 'done' }, tokenUsage);

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1' },
          data: expect.objectContaining({
            output: { result: 'done' },
            tokenUsage,
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should work without tokenUsage', async () => {
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'COMPLETED',
        output: { result: 'done' },
      });

      await service.updateOutput('exec-1', { result: 'done' });

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            output: { result: 'done' },
            status: 'COMPLETED',
          }),
        }),
      );
    });
  });

  describe('updatePlan', () => {
    it('should set plan and RUNNING status', async () => {
      const plan = { steps: [{ type: 'TOOL_CALL', tool: 'search' }] };
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'RUNNING',
        plan,
      });

      const result = await service.updatePlan('exec-1', plan);

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1' },
          data: expect.objectContaining({
            plan,
            status: 'RUNNING',
            startedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe('RUNNING');
    });
  });

  describe('createStep', () => {
    it('should create step with RUNNING status', async () => {
      const stepFixture = {
        id: 'step-1',
        executionId: 'exec-1',
        stepIndex: 0,
        type: 'TOOL_CALL',
        toolName: 'search',
        toolInput: { query: 'test' },
        llmPrompt: null,
        status: 'RUNNING',
        startedAt: new Date(),
        completedAt: null,
        toolOutput: null,
        error: null,
      };
      mockPrisma.agentExecutionStep.create.mockResolvedValue(stepFixture);

      const result = await service.createStep({
        executionId: 'exec-1',
        stepIndex: 0,
        type: 'TOOL_CALL',
        toolName: 'search',
        toolInput: { query: 'test' },
      });

      expect(mockPrisma.agentExecutionStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            executionId: 'exec-1',
            stepIndex: 0,
            status: 'RUNNING',
            startedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe('RUNNING');
    });
  });

  describe('completeStep', () => {
    it('should set COMPLETED with output', async () => {
      const output = { result: 'search results' };
      mockPrisma.agentExecutionStep.update.mockResolvedValue({
        id: 'step-1',
        status: 'COMPLETED',
        toolOutput: output,
        completedAt: new Date(),
      });

      await service.completeStep('step-1', output);

      expect(mockPrisma.agentExecutionStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'step-1' },
          data: expect.objectContaining({
            toolOutput: output,
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('failStep', () => {
    it('should set FAILED with error', async () => {
      mockPrisma.agentExecutionStep.update.mockResolvedValue({
        id: 'step-1',
        status: 'FAILED',
        error: 'Tool error',
        completedAt: new Date(),
      });

      await service.failStep('step-1', 'Tool error');

      expect(mockPrisma.agentExecutionStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'step-1' },
          data: expect.objectContaining({
            status: 'FAILED',
            error: 'Tool error',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('cancel', () => {
    it('should throw if status is not cancellable', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue({
        ...executionFixture,
        status: 'COMPLETED',
      });

      await expect(service.cancel('ws-1', 'exec-1')).rejects.toThrow(
        'Execution cannot be cancelled',
      );
    });

    it('should succeed for QUEUED status', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue(executionFixture);
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'CANCELLED',
      });

      const result = await service.cancel('ws-1', 'exec-1');

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1' },
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
      expect(result.status).toBe('CANCELLED');
    });

    it('should succeed for RUNNING status', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue({
        ...executionFixture,
        status: 'RUNNING',
      });
      mockPrisma.agentExecution.update.mockResolvedValue({
        ...executionFixture,
        status: 'CANCELLED',
      });

      const result = await service.cancel('ws-1', 'exec-1');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('retry', () => {
    it('should throw if not FAILED', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue({
        ...executionFixture,
        status: 'COMPLETED',
      });

      await expect(service.retry('ws-1', 'exec-1')).rejects.toThrow(
        'Only failed executions can be retried',
      );
    });

    it('should succeed for FAILED status', async () => {
      mockPrisma.agentExecution.findFirst.mockResolvedValue({
        ...executionFixture,
        status: 'FAILED',
      });
      mockPrisma.agentExecution.update.mockResolvedValue({ ...executionFixture, status: 'QUEUED' });

      const result = await service.retry('ws-1', 'exec-1');

      expect(mockPrisma.agentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1' },
          data: expect.objectContaining({ status: 'QUEUED' }),
        }),
      );
      expect(result.status).toBe('QUEUED');
    });
  });
});

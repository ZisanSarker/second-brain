import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: any;

  const mockPrisma = {
    agentSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const scheduleFixture = {
    id: 'sched-1',
    workspaceId: 'ws-1',
    name: 'Daily Summary',
    cron: '0 0 * * *',
    agentId: null,
    workflowId: 'wf-1',
    input: { type: 'summary' },
    isActive: true,
    createdBy: 'user-1',
    lastRunAt: null,
    nextRunAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchedulerService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create schedule with provided data', async () => {
      mockPrisma.agentSchedule.create.mockResolvedValue(scheduleFixture);

      const result = await service.create('ws-1', {
        name: 'Daily Summary',
        cron: '0 0 * * *',
        workflowId: 'wf-1',
        input: { type: 'summary' },
        createdBy: 'user-1',
      });

      expect(mockPrisma.agentSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            name: 'Daily Summary',
            cron: '0 0 * * *',
            workflowId: 'wf-1',
            input: { type: 'summary' },
            createdBy: 'user-1',
          }),
        }),
      );
      expect(result.name).toBe('Daily Summary');
    });

    it('should default input to empty object', async () => {
      mockPrisma.agentSchedule.create.mockResolvedValue(scheduleFixture);

      await service.create('ws-1', {
        name: 'Test',
        cron: '0 0 * * *',
        createdBy: 'user-1',
        input: undefined,
      });

      expect(mockPrisma.agentSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ input: {} }),
        }),
      );
    });
  });

  describe('list', () => {
    it('should return all schedules for workspace', async () => {
      mockPrisma.agentSchedule.findMany.mockResolvedValue([scheduleFixture]);

      const result = await service.list('ws-1');

      expect(mockPrisma.agentSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no schedules', async () => {
      mockPrisma.agentSchedule.findMany.mockResolvedValue([]);

      const result = await service.list('ws-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return schedule by id and workspace', async () => {
      mockPrisma.agentSchedule.findFirst.mockResolvedValue(scheduleFixture);

      const result = await service.getById('ws-1', 'sched-1');

      expect(mockPrisma.agentSchedule.findFirst).toHaveBeenCalledWith({
        where: { id: 'sched-1', workspaceId: 'ws-1' },
      });
      expect(result.id).toBe('sched-1');
    });

    it('should throw NotFoundException for non-existent schedule', async () => {
      mockPrisma.agentSchedule.findFirst.mockResolvedValue(null);

      await expect(service.getById('ws-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update schedule fields', async () => {
      mockPrisma.agentSchedule.findFirst.mockResolvedValue(scheduleFixture);
      mockPrisma.agentSchedule.update.mockResolvedValue({
        ...scheduleFixture,
        name: 'Updated',
        cron: '0 1 * * *',
      });

      const result = await service.update('ws-1', 'sched-1', {
        name: 'Updated',
        cron: '0 1 * * *',
      });

      expect(mockPrisma.agentSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sched-1' },
          data: { name: 'Updated', cron: '0 1 * * *' },
        }),
      );
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if schedule does not exist', async () => {
      mockPrisma.agentSchedule.findFirst.mockResolvedValue(null);

      await expect(service.update('ws-1', 'nonexistent', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should remove schedule', async () => {
      mockPrisma.agentSchedule.findFirst.mockResolvedValue(scheduleFixture);
      mockPrisma.agentSchedule.delete.mockResolvedValue(scheduleFixture);

      await service.delete('ws-1', 'sched-1');

      expect(mockPrisma.agentSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
      });
    });

    it('should throw NotFoundException if schedule does not exist', async () => {
      mockPrisma.agentSchedule.findFirst.mockResolvedValue(null);

      await expect(service.delete('ws-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDueSchedules', () => {
    it('should return schedules that need to run', async () => {
      const dueSchedules = [
        scheduleFixture,
        { ...scheduleFixture, id: 'sched-2', nextRunAt: new Date(0) },
      ];
      mockPrisma.agentSchedule.findMany.mockResolvedValue(dueSchedules);

      const result = await service.getDueSchedules();

      expect(mockPrisma.agentSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            OR: [{ nextRunAt: null }, { nextRunAt: { lte: expect.any(Date) } }],
          },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no due schedules', async () => {
      mockPrisma.agentSchedule.findMany.mockResolvedValue([]);

      const result = await service.getDueSchedules();

      expect(result).toEqual([]);
    });
  });

  describe('updateLastRun', () => {
    it('should update lastRunAt and compute nextRunAt', async () => {
      const existingSchedule = { ...scheduleFixture, cron: '0 0 * * *' };
      mockPrisma.agentSchedule.findUnique.mockResolvedValue(existingSchedule);
      mockPrisma.agentSchedule.update.mockResolvedValue({
        ...existingSchedule,
        lastRunAt: new Date(),
        nextRunAt: expect.any(Date),
      });

      await service.updateLastRun('sched-1');

      expect(mockPrisma.agentSchedule.findUnique).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
      });
      expect(mockPrisma.agentSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sched-1' },
          data: expect.objectContaining({
            lastRunAt: expect.any(Date),
            nextRunAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should return undefined when schedule does not exist', async () => {
      mockPrisma.agentSchedule.findUnique.mockResolvedValue(null);

      const result = await service.updateLastRun('nonexistent');

      expect(result).toBeUndefined();
      expect(mockPrisma.agentSchedule.update).not.toHaveBeenCalled();
    });
  });
});

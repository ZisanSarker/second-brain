import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SchedulerService } from '../scheduler/scheduler.service';
import { AgentService } from '../agent.service';

@Processor('schedules')
export class ScheduleProcessor extends WorkerHost {
  private logger = new Logger(ScheduleProcessor.name);

  constructor(
    private schedulerService: SchedulerService,
    private agentService: AgentService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing schedule job ${job.id}`);

    try {
      const { scheduleId } = job.data;
      await this.schedulerService.updateLastRun(scheduleId);
      return { processed: true };
    } catch (e: any) {
      this.logger.error(`Schedule job ${job.id} failed: ${e.message}`);
      throw e;
    }
  }
}
